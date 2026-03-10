/**
 * Test End-to-End — Flujo completo de un lead.
 *
 * Recorre todos los módulos y automatizaciones en el orden real de uso:
 *   Lead nuevo → Contactado → Enviar propuesta → Contrato Enviada/Aprobada/Firmada
 *   → Event creado → Pagos → Anulación de pago
 *
 * Cada test valida el estado resultante del objeto compartido, simulando
 * cómo las funciones mutan los datos a través del flujo completo.
 */

jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));

const { POST: POST_INTERACTION } = require('../app/api/leads/[id]/interactions/route');
const { PUT: PUT_STATUS }        = require('../app/api/leads/[id]/status/route');
const { PUT: PUT_PROPOSAL }      = require('../app/api/proposals/[id]/route');
const { POST: POST_PAYMENT }     = require('../app/api/payments/route');
const { PUT: PUT_PAYMENT }       = require('../app/api/payments/[id]/route');
const models = require('./__mocks__/models');

// ─── Objetos compartidos (se mutan a lo largo del flujo) ─────────────────────

const lead = {
  id: 'lead-e2e',
  nombre: 'Valentina García',
  estado_actual: 'Lead nuevo',
  fecha_tentativa: '2026-09-20',
  fecha_firma_contrato: null,
  valor_estimado: 500000,
  tipo_evento: 'Fiesta de 15',
  invitados_estimados: 120,
  update: jest.fn().mockImplementation(function (data) {
    Object.assign(lead, data);
    return Promise.resolve(lead);
  }),
};

const proposal = {
  id: 'prop-e2e',
  lead_id: 'lead-e2e',
  estado: 'Creada',
  fecha_envio: null,
  tipo_evento: 'Fiesta de 15',
  invitados_estimados: 120,
  valor_total_evento: 500000,
  precio_senia: 150000,
  servicios_base: ['Salón', 'Catering'],
  adicionales: [
    { nombre: 'DJ', opciones: [{ descripcion: 'DJ básico', precio: 20000 }], opcion_elegida: 0 },
  ],
  menu_seleccionado: 'Menú 2',
  minimo_tarjetas: 100,
  valor_tarjeta_adulto: 4000,
  valor_tarjeta_adolescente: 2500,
  valor_tarjeta_nino: 1500,
  modalidad_actualizacion_precios: 'Precio fijo',
  update: jest.fn().mockImplementation(function (data) {
    Object.assign(proposal, data);
    return Promise.resolve(proposal);
  }),
};

const createdEvent = {
  id: 'evt-e2e',
  lead_id: 'lead-e2e',
  valor_total_evento: 500000,
  estado_pago: 'Pendiente',
  update: jest.fn().mockImplementation(function (data) {
    Object.assign(createdEvent, data);
    return Promise.resolve(createdEvent);
  }),
};

const createdPayment = {
  id: 'pay-e2e',
  event_id: 'evt-e2e',
  monto: 150000,
  tipo: 'senia',
  estado: 'pendiente',
  update: jest.fn().mockImplementation(function (data) {
    Object.assign(createdPayment, data);
    return Promise.resolve(createdPayment);
  }),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeReq(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}
function makeParams(id) {
  return { params: { id } };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Event.findByPk siempre necesario para recalcular estado_pago
  models.Event.findByPk.mockResolvedValue(createdEvent);
});

// ─── 1. Interacción saliente → Contactado ────────────────────────────────────

describe('1. Primera interacción saliente', () => {
  test('interacción OUT en "Lead nuevo" → lead pasa a "Contactado"', async () => {
    lead.estado_actual = 'Lead nuevo';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Interaction.create.mockResolvedValue({ id: 'int-1' });
    models.LeadStatusHistory.create.mockResolvedValue({});

    await POST_INTERACTION(
      makeReq({ canal: 'WhatsApp', direction: 'OUT', descripcion: 'Primer contacto' }),
      makeParams('lead-e2e')
    );

    expect(lead.estado_actual).toBe('Contactado');
    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_nuevo: 'Contactado', estado_anterior: 'Lead nuevo' })
    );
  });

  test('interacción IN en "Lead nuevo" → estado NO cambia', async () => {
    lead.estado_actual = 'Lead nuevo';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Interaction.create.mockResolvedValue({ id: 'int-2' });

    await POST_INTERACTION(
      makeReq({ canal: 'WhatsApp', direction: 'IN', descripcion: 'Consulta del cliente' }),
      makeParams('lead-e2e')
    );

    expect(lead.estado_actual).toBe('Lead nuevo');
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
  });

  test('interacción OUT en lead ya "Contactado" → estado NO cambia de nuevo', async () => {
    lead.estado_actual = 'Contactado';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Interaction.create.mockResolvedValue({ id: 'int-3' });

    await POST_INTERACTION(
      makeReq({ canal: 'Llamada', direction: 'OUT', descripcion: 'Segunda llamada' }),
      makeParams('lead-e2e')
    );

    // La automatización solo se dispara desde "Lead nuevo"
    expect(lead.estado_actual).toBe('Contactado');
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
  });
});

// ─── 2. Estado → "Enviar propuesta" → Task automática ────────────────────────

describe('2. Estado "Enviar propuesta" — tarea automática', () => {
  test('pasa a "Enviar propuesta" → crea Task de alta prioridad (vence en 1 día)', async () => {
    lead.estado_actual = 'Visita al salón realizada';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Task.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(null);

    await PUT_STATUS(makeReq({ estado: 'Enviar propuesta' }), makeParams('lead-e2e'));

    expect(lead.estado_actual).toBe('Enviar propuesta');
    expect(models.Task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: expect.stringContaining('propuesta'),
        prioridad: 'Alta',
      })
    );
  });
});

// ─── 3. Contrato enviado ──────────────────────────────────────────────────────

describe('3. Contrato → Enviada', () => {
  test('lead pasa a "Propuesta enviada" + fecha_envio auto-seteada', async () => {
    proposal.estado = 'Creada';
    proposal.fecha_envio = null;
    lead.estado_actual = 'Enviar propuesta';
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT_PROPOSAL(makeReq({ estado: 'Enviada' }), makeParams('prop-e2e'));

    expect(proposal.estado).toBe('Enviada');
    expect(proposal.fecha_envio).toBeTruthy();
    expect(lead.estado_actual).toBe('Propuesta enviada');
  });

  test('enviar propuesta ya enviada → NO duplica fecha_envio', async () => {
    const fechaOriginal = new Date('2026-03-01');
    proposal.estado = 'Enviada';
    proposal.fecha_envio = fechaOriginal;
    lead.estado_actual = 'Propuesta enviada';
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT_PROPOSAL(makeReq({ estado: 'Enviada' }), makeParams('prop-e2e'));

    expect(proposal.fecha_envio).toBe(fechaOriginal); // no se sobreescribió
  });
});

// ─── 4. Contrato aprobado ─────────────────────────────────────────────────────

describe('4. Contrato → Aprobada', () => {
  test('lead pasa a "Propuesta Aceptada"', async () => {
    proposal.estado = 'Enviada';
    lead.estado_actual = 'Propuesta enviada';
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT_PROPOSAL(makeReq({ estado: 'Aprobada' }), makeParams('prop-e2e'));

    expect(proposal.estado).toBe('Aprobada');
    expect(lead.estado_actual).toBe('Propuesta Aceptada');
  });

  test('aprobar NO crea ni toca el Event (solo firmar lo hace)', async () => {
    proposal.estado = 'Enviada';
    lead.estado_actual = 'Propuesta enviada';
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT_PROPOSAL(makeReq({ estado: 'Aprobada' }), makeParams('prop-e2e'));

    expect(models.Event.findOne).not.toHaveBeenCalled();
    expect(models.Event.create).not.toHaveBeenCalled();
  });
});

// ─── 5. Contrato firmado — el más importante ──────────────────────────────────

describe('5. Contrato → Firmada', () => {
  beforeEach(() => {
    proposal.estado = 'Aprobada';
    lead.estado_actual = 'Propuesta Aceptada';
    lead.fecha_firma_contrato = null;
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(null);
    models.Event.create.mockResolvedValue(createdEvent);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});
  });

  test('lead pasa a "Contrato firmado"', async () => {
    await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));
    expect(lead.estado_actual).toBe('Contrato firmado');
  });

  test('auto-setea fecha_firma_contrato en el lead', async () => {
    await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));
    expect(lead.fecha_firma_contrato).toBeTruthy();
  });

  test('crea Event con datos completos del contrato', async () => {
    await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));
    expect(models.Event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_id: 'lead-e2e',
        estado_operativo: 'Pendiente',
        precio_senia: 150000,
        tipo_evento: 'Fiesta de 15',
        invitados_estimados: 120,
        valor_total_evento: 500000,
        menu_seleccionado: 'Menú 2',
        minimo_tarjetas: 100,
        valor_tarjeta_adulto: 4000,
        valor_tarjeta_adolescente: 2500,
        valor_tarjeta_nino: 1500,
      })
    );
  });

  test('servicios_contratados combina servicios_base + adicionales elegidos', async () => {
    await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));
    expect(models.Event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        servicios_contratados: expect.arrayContaining(['Salón', 'Catering', 'DJ']),
      })
    );
  });

  test('crea CalendarDate "Confirmada" asociada al lead', async () => {
    await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));
    expect(models.CalendarDate.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_fecha: 'Confirmada', lead_id: 'lead-e2e' })
    );
  });

  test('NO crea Event duplicado — usa findOne y update si ya existe', async () => {
    models.Event.findOne.mockResolvedValue(createdEvent);

    await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));

    expect(models.Event.create).not.toHaveBeenCalled();
    expect(createdEvent.update).toHaveBeenCalled();
  });

  test('NO crea CalendarDate duplicada — actualiza la existente', async () => {
    const existingCal = { update: jest.fn().mockResolvedValue(true) };
    models.CalendarDate.findOne.mockResolvedValue(existingCal);
    models.Event.findOne.mockResolvedValue(createdEvent);

    await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));

    expect(models.CalendarDate.create).not.toHaveBeenCalled();
    expect(existingCal.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado_fecha: 'Confirmada' })
    );
  });

  test('propuesta Rechazada → lead "Propuesta Rechazada", NO toca Event', async () => {
    proposal.estado = 'Enviada';
    lead.estado_actual = 'Propuesta enviada';

    await PUT_PROPOSAL(makeReq({ estado: 'Rechazada' }), makeParams('prop-e2e'));

    expect(proposal.estado).toBe('Rechazada');
    expect(lead.estado_actual).toBe('Propuesta Rechazada');
    expect(models.Event.findOne).not.toHaveBeenCalled();
  });
});

// ─── 6. Estado manual "Contrato firmado" (vía status route) ──────────────────

describe('6. Status route → "Contrato firmado"', () => {
  test('crea Event si no existe y hay fecha_tentativa', async () => {
    lead.estado_actual = 'Propuesta Aceptada';
    lead.fecha_tentativa = '2026-09-20';
    lead.fecha_firma_contrato = null;
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(null);
    models.Event.create.mockResolvedValue(createdEvent);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT_STATUS(makeReq({ estado: 'Contrato firmado' }), makeParams('lead-e2e'));

    expect(models.Event.create).toHaveBeenCalled();
    expect(lead.estado_actual).toBe('Contrato firmado');
  });

  test('NO crea Event si ya existe', async () => {
    lead.estado_actual = 'Propuesta Aceptada';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(createdEvent);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT_STATUS(makeReq({ estado: 'Contrato firmado' }), makeParams('lead-e2e'));

    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('"Perdido" sin motivo → 400', async () => {
    models.Lead.findByPk.mockResolvedValue(lead);

    const res = await PUT_STATUS(
      makeReq({ estado: 'Perdido', motivo: null }),
      makeParams('lead-e2e')
    );
    const body = await res.json();

    expect(body.error).toMatch(/motivo/i);
  });

  test('"Perdido" con motivo → propuesta pasa a "Rechazada"', async () => {
    const propNoFirmada = {
      ...proposal,
      estado: 'Enviada',
      update: jest.fn().mockImplementation(function (data) {
        Object.assign(propNoFirmada, data);
        return Promise.resolve(propNoFirmada);
      }),
    };
    lead.estado_actual = 'Propuesta enviada';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(propNoFirmada);

    await PUT_STATUS(
      makeReq({ estado: 'Perdido', motivo: 'Precio muy alto' }),
      makeParams('lead-e2e')
    );

    expect(propNoFirmada.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'Rechazada' })
    );
  });

  test('"Perdido" NO toca propuesta si ya está Firmada', async () => {
    const propFirmada = {
      ...proposal,
      estado: 'Firmada',
      update: jest.fn().mockResolvedValue(true),
    };
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(propFirmada);

    await PUT_STATUS(
      makeReq({ estado: 'Perdido', motivo: 'Fecha ocupada' }),
      makeParams('lead-e2e')
    );

    expect(propFirmada.update).not.toHaveBeenCalled();
  });
});

// ─── 7. Módulo de pagos ───────────────────────────────────────────────────────

describe('7. Pagos del evento', () => {
  test('crear pago confirmado → estado_pago pasa a "Parcial"', async () => {
    createdEvent.estado_pago = 'Pendiente';
    createdEvent.valor_total_evento = 500000;
    models.Payment.create.mockResolvedValue({ id: 'pay-1', estado: 'confirmado', monto: 150000, tipo: 'senia' });
    models.Payment.findAll.mockResolvedValue([
      { monto: 150000, tipo: 'senia', estado: 'confirmado' },
    ]);

    await POST_PAYMENT(
      makeReq({ event_id: 'evt-e2e', monto: 150000, tipo: 'senia', estado: 'confirmado' })
    );

    expect(createdEvent.estado_pago).toBe('Parcial');
  });

  test('pagos que cubren el total → estado_pago pasa a "Completo"', async () => {
    createdEvent.estado_pago = 'Parcial';
    createdEvent.valor_total_evento = 500000;
    models.Payment.create.mockResolvedValue({ id: 'pay-2', estado: 'confirmado', monto: 350000, tipo: 'final' });
    models.Payment.findAll.mockResolvedValue([
      { monto: 150000, tipo: 'senia',  estado: 'confirmado' },
      { monto: 350000, tipo: 'final',  estado: 'confirmado' },
    ]);

    await POST_PAYMENT(
      makeReq({ event_id: 'evt-e2e', monto: 350000, tipo: 'final', estado: 'confirmado' })
    );

    expect(createdEvent.estado_pago).toBe('Completo');
  });

  test('anular pago → estado_pago recalcula a "Parcial"', async () => {
    createdPayment.estado = 'confirmado';
    createdPayment.event_id = 'evt-e2e';
    createdEvent.estado_pago = 'Completo';
    createdEvent.valor_total_evento = 500000;
    models.Payment.findByPk.mockResolvedValue(createdPayment);
    // Después de anular queda solo 1 pago confirmado de 150000
    models.Payment.findAll.mockResolvedValue([
      { monto: 150000, tipo: 'senia', estado: 'confirmado' },
    ]);

    await PUT_PAYMENT(makeReq({ estado: 'anulado' }), makeParams('pay-e2e'));

    expect(createdPayment.estado).toBe('anulado');
    expect(createdEvent.estado_pago).toBe('Parcial');
  });

  test('anular todos los pagos → estado_pago vuelve a "Pendiente"', async () => {
    createdPayment.estado = 'confirmado';
    createdEvent.estado_pago = 'Parcial';
    models.Payment.findByPk.mockResolvedValue(createdPayment);
    models.Payment.findAll.mockResolvedValue([]); // sin pagos confirmados

    await PUT_PAYMENT(makeReq({ estado: 'anulado' }), makeParams('pay-e2e'));

    expect(createdEvent.estado_pago).toBe('Pendiente');
  });

  test('devolución descuenta del total cobrado', async () => {
    createdEvent.estado_pago = 'Pendiente';
    createdEvent.valor_total_evento = 500000;
    models.Payment.create.mockResolvedValue({ id: 'pay-dev', estado: 'confirmado', monto: 50000, tipo: 'devolucion' });
    // 300000 confirmado - 50000 devolucion = 250000 < 500000 → Parcial
    models.Payment.findAll.mockResolvedValue([
      { monto: 300000, tipo: 'parcial',   estado: 'confirmado' },
      { monto: 50000,  tipo: 'devolucion', estado: 'confirmado' },
    ]);

    await POST_PAYMENT(
      makeReq({ event_id: 'evt-e2e', monto: 50000, tipo: 'devolucion', estado: 'confirmado' })
    );

    expect(createdEvent.estado_pago).toBe('Parcial');
  });
});

// ─── 8. Validaciones de negocio ───────────────────────────────────────────────

describe('8. Validaciones de negocio', () => {
  test('crear pago sin event_id → 400', async () => {
    const res = await POST_PAYMENT(makeReq({ monto: 1000, tipo: 'senia' }));
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test('crear pago con monto 0 → 400', async () => {
    const res = await POST_PAYMENT(makeReq({ event_id: 'evt-e2e', monto: 0 }));
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test('actualizar pago con estado inválido → 400', async () => {
    models.Payment.findByPk.mockResolvedValue(createdPayment);
    const res = await PUT_PAYMENT(makeReq({ estado: 'pagado' }), makeParams('pay-e2e'));
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test('lead no encontrado → 404', async () => {
    models.Lead.findByPk.mockResolvedValue(null);
    const res = await PUT_STATUS(makeReq({ estado: 'Contactado' }), makeParams('no-existe'));
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test('propuesta no encontrada → 404', async () => {
    models.Proposal.findByPk.mockResolvedValue(null);
    const res = await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('no-existe'));
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
