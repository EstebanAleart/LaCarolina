/**
 * Test End-to-End — Flujo completo de un lead.
 *
 * Recorre todos los módulos y automatizaciones en el orden real de uso:
 *   Lead nuevo → Visita agendada → Visita realizada → seña registrada + contrato firmado → Reserva confirmada
 *   → Contrato Enviada/Aprobada/Firmada (no mueve el lead) → Event creado → Pagos → Anulación
 *
 * Cada test valida el estado resultante del objeto compartido, simulando
 * cómo las funciones mutan los datos a través del flujo completo.
 */

jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));

const { POST: POST_INTERACTION } = require('../app/api/leads/[id]/interactions/route');
const { PUT: PUT_STATUS }        = require('../app/api/leads/[id]/status/route');
const { PUT: PUT_LEAD }          = require('../app/api/leads/[id]/route');
const { POST: POST_SENIA }       = require('../app/api/leads/[id]/senia/route');
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

// ─── 1. Interacciones: no mueven el estado (E15-01) ──────────────────────────

describe('1. Interacciones', () => {
  test('interacción OUT en "Lead nuevo" → el estado NO cambia', async () => {
    lead.estado_actual = 'Lead nuevo';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Interaction.create.mockResolvedValue({ id: 'int-1' });

    await POST_INTERACTION(
      makeReq({ canal: 'WhatsApp', direction: 'OUT', descripcion: 'Primer contacto' }),
      makeParams('lead-e2e')
    );

    expect(lead.estado_actual).toBe('Lead nuevo');
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
  });
});

// ─── 2. Fecha de visita → "Visita agendada" ──────────────────────────────────

describe('2. Fecha de visita al salón', () => {
  test('cargar fecha_visita_salon en un lead nuevo → "Visita agendada" + fecha "Visita" en el calendario', async () => {
    lead.estado_actual = 'Lead nuevo';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});

    await PUT_LEAD(makeReq({ fecha_visita_salon: '2026-08-10' }), makeParams('lead-e2e'));

    expect(lead.estado_actual).toBe('Visita agendada');
    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_anterior: 'Lead nuevo', estado_nuevo: 'Visita agendada' })
    );
    expect(models.CalendarDate.create).toHaveBeenCalledWith(
      expect.objectContaining({ fecha: '2026-08-10', estado_fecha: 'Visita', lead_id: 'lead-e2e' })
    );
  });
});

// ─── 3. Visita realizada → propuesta base ────────────────────────────────────

describe('3. Estado "Visita realizada"', () => {
  test('crea una propuesta "Creada" si el lead no tiene ninguna; sin tareas automáticas', async () => {
    lead.estado_actual = 'Visita agendada';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(null);
    models.Proposal.create.mockResolvedValue(proposal);

    await PUT_STATUS(makeReq({ estado: 'Visita realizada' }), makeParams('lead-e2e'));

    expect(lead.estado_actual).toBe('Visita realizada');
    expect(models.Proposal.create).toHaveBeenCalledWith(
      expect.objectContaining({ lead_id: 'lead-e2e', estado: 'Creada' })
    );
    expect(models.Task.create).not.toHaveBeenCalled();
  });
});

// ─── 4. Seña registrada desde la ficha del lead (E15-03) ─────────────────────

const calDateE2E = {
  id: 'cal-e2e', fecha: '2026-09-20', estado_fecha: 'Reservada', evento_id: null,
  update: jest.fn().mockImplementation(function (d) { Object.assign(calDateE2E, d); return Promise.resolve(calDateE2E); }),
};
const reservationE2E = {
  id: 'res-e2e', lead_id: 'lead-e2e', calendar_date_id: 'cal-e2e', estado: 'Pendiente', monto_senia: 0,
  update: jest.fn().mockImplementation(function (d) { Object.assign(reservationE2E, d); return Promise.resolve(reservationE2E); }),
};

describe('4. Registrar seña (POST /api/leads/:id/senia)', () => {
  test('reserva la fecha tentativa en el calendario, guarda la seña como Pagada y, sin contrato firmado, NO confirma', async () => {
    lead.estado_actual = 'Visita realizada';
    models.Lead.findByPk.mockResolvedValue(lead);
    // 1ª: fecha Reservada/Confirmada del lead → no hay · 2ª: ocupada por otro → no · 3ª: propia en esa fecha → no
    models.CalendarDate.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(calDateE2E); // después (lib/reserva) ya existe
    models.CalendarDate.create.mockResolvedValue(calDateE2E);
    models.Reservation.findOne.mockResolvedValueOnce(null).mockResolvedValue(reservationE2E);
    models.Reservation.create.mockImplementation(async (d) => { Object.assign(reservationE2E, d); return reservationE2E; });
    models.Proposal.findOne.mockResolvedValue(null); // contrato todavía no firmado

    const res = await POST_SENIA(makeReq({ monto: 150000, fecha_pago: '2026-09-01', metodo_pago: 'transferencia' }), makeParams('lead-e2e'));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(models.CalendarDate.create).toHaveBeenCalledWith(
      expect.objectContaining({ fecha: '2026-09-20', estado_fecha: 'Reservada', lead_id: 'lead-e2e' })
    );
    expect(reservationE2E.estado).toBe('Pagada');
    expect(reservationE2E.monto_senia).toBe(150000);
    expect(body.confirmada).toBe(false);
    expect(body.faltantes).toEqual(['contrato firmado']);
    expect(lead.estado_actual).toBe('Visita realizada');
    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('sin monto → 400', async () => {
    const res = await POST_SENIA(makeReq({ monto: 0 }), makeParams('lead-e2e'));
    expect(res.status).toBe(400);
  });
});

// ─── 5. Contrato: Enviada/Aprobada no tocan el lead; Firmada completa las 3 condiciones ─

describe('5. Contrato', () => {
  test('Enviada: setea fecha_envio y NO toca el lead', async () => {
    models.Proposal.findByPk.mockResolvedValue(proposal);

    await PUT_PROPOSAL(makeReq({ estado: 'Enviada' }), makeParams('prop-e2e'));

    expect(proposal.estado).toBe('Enviada');
    expect(proposal.fecha_envio).toBeInstanceOf(Date);
    expect(lead.estado_actual).toBe('Visita realizada');
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
  });

  test('Aprobada: NO toca el lead ni el Event', async () => {
    models.Proposal.findByPk.mockResolvedValue(proposal);

    await PUT_PROPOSAL(makeReq({ estado: 'Aprobada' }), makeParams('prop-e2e'));

    expect(proposal.estado).toBe('Aprobada');
    expect(lead.estado_actual).toBe('Visita realizada');
    expect(models.Event.findOne).not.toHaveBeenCalled();
    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('Firmada con seña y fecha ya reservadas → Reserva confirmada + Evento con contrato, seña como pago y fecha Confirmada', async () => {
    lead.estado_actual = 'Visita realizada';
    Object.assign(reservationE2E, { estado: 'Pagada', monto_senia: 150000, fecha_pago: '2026-09-01', metodo_pago: 'transferencia' });
    Object.assign(calDateE2E, { estado_fecha: 'Reservada', evento_id: null });
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(null);
    models.Event.create.mockImplementation(async (data) => { Object.assign(createdEvent, data); return createdEvent; });
    models.Reservation.findOne.mockResolvedValue(reservationE2E);
    models.CalendarDate.findOne.mockResolvedValue(calDateE2E);
    models.Proposal.findOne.mockResolvedValue(proposal);
    models.Payment.findOne.mockResolvedValue(null);
    models.Payment.create.mockResolvedValue(createdPayment);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));

    // fecha de firma
    expect(lead.fecha_firma_contrato).toBeInstanceOf(Date);
    // lead confirmado con historial
    expect(lead.estado_actual).toBe('Reserva confirmada');
    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(expect.objectContaining({ estado_nuevo: 'Reserva confirmada' }));
    // Evento con los datos del contrato
    expect(models.Event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_id: 'lead-e2e',
        fecha_confirmada: '2026-09-20',
        valor_total_evento: 500000,
        precio_senia: 150000,
        menu_seleccionado: 'Menú 2',
        minimo_tarjetas: 100,
        estado_operativo: 'En planificación',
      })
    );
    expect(createdEvent.servicios_contratados).toEqual(['Salón', 'Catering', 'DJ']);
    // seña como primer pago confirmado → Parcial
    expect(models.Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: 'evt-e2e', tipo: 'seña', monto: 150000, estado: 'confirmado' })
    );
    expect(createdEvent.estado_pago).toBe('Parcial');
    // fecha Confirmada ligada al evento, sin duplicar
    expect(calDateE2E.estado_fecha).toBe('Confirmada');
    expect(calDateE2E.evento_id).toBe('evt-e2e');
    expect(models.CalendarDate.create).not.toHaveBeenCalled();
  });
});

// ─── 6. Perdido ──────────────────────────────────────────────────────────────

describe('6. Estado "Perdido"', () => {
  test('sin motivo → 400', async () => {
    models.Lead.findByPk.mockResolvedValue(lead);
    const res = await PUT_STATUS(makeReq({ estado: 'Perdido' }), makeParams('lead-e2e'));
    expect(res.status).toBe(400);
  });

  test('con motivo → historial con motivo y estado "Perdido"', async () => {
    const otro = {
      ...lead, id: 'lead-perdido', estado_actual: 'Visita realizada',
      update: jest.fn().mockImplementation(function (d) { Object.assign(otro, d); return Promise.resolve(otro); }),
    };
    models.Lead.findByPk.mockResolvedValue(otro);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT_STATUS(makeReq({ estado: 'Perdido', motivo: 'Eligió otro salón' }), makeParams('lead-perdido'));

    expect(otro.estado_actual).toBe('Perdido');
    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_nuevo: 'Perdido', motivo: 'Eligió otro salón' })
    );
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
