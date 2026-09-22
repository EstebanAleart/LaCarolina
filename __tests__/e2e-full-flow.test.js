/**
 * Test End-to-End — Flujo completo de un lead.
 *
 * Recorre todos los módulos y automatizaciones en el orden real de uso:
 *   Lead nuevo → Visita agendada → Visita realizada → Reserva confirmada (seña)
 *   → Contrato Enviada/Aprobada/Firmada (no mueve el lead) → Event creado → Pagos → Anulación
 *
 * Cada test valida el estado resultante del objeto compartido, simulando
 * cómo las funciones mutan los datos a través del flujo completo.
 */

jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));

const { POST: POST_INTERACTION } = require('../app/api/leads/[id]/interactions/route');
const { PUT: PUT_STATUS }        = require('../app/api/leads/[id]/status/route');
const { PUT: PUT_LEAD }          = require('../app/api/leads/[id]/route');
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

// ─── 4. Reserva confirmada (seña) → fecha Reservada ──────────────────────────

describe('4. Estado "Reserva confirmada" (seña tomada)', () => {
  test('reserva la fecha tentativa: CalendarDate "Reservada" + Reservation, sin crear Event', async () => {
    lead.estado_actual = 'Visita realizada';
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({ id: 'cal-e2e' });
    models.Reservation.findOne.mockResolvedValue(null);
    models.Reservation.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT_STATUS(makeReq({ estado: 'Reserva confirmada' }), makeParams('lead-e2e'));

    expect(lead.estado_actual).toBe('Reserva confirmada');
    expect(models.CalendarDate.create).toHaveBeenCalledWith(
      expect.objectContaining({ fecha: '2026-09-20', estado_fecha: 'Reservada', lead_id: 'lead-e2e' })
    );
    expect(models.Reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ lead_id: 'lead-e2e', calendar_date_id: 'cal-e2e' })
    );
    expect(models.Event.create).not.toHaveBeenCalled();
  });
});

// ─── 5. Contrato: Enviada/Aprobada no tocan el lead; Firmada crea el Event ───

describe('5. Contrato', () => {
  test('Enviada: setea fecha_envio y NO toca el lead', async () => {
    models.Proposal.findByPk.mockResolvedValue(proposal);

    await PUT_PROPOSAL(makeReq({ estado: 'Enviada' }), makeParams('prop-e2e'));

    expect(proposal.estado).toBe('Enviada');
    expect(proposal.fecha_envio).toBeInstanceOf(Date);
    expect(lead.estado_actual).toBe('Reserva confirmada');
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
  });

  test('Aprobada: NO toca el lead ni el Event', async () => {
    models.Proposal.findByPk.mockResolvedValue(proposal);

    await PUT_PROPOSAL(makeReq({ estado: 'Aprobada' }), makeParams('prop-e2e'));

    expect(proposal.estado).toBe('Aprobada');
    expect(lead.estado_actual).toBe('Reserva confirmada');
    expect(models.Event.findOne).not.toHaveBeenCalled();
    expect(models.Event.create).not.toHaveBeenCalled();
  });

  describe('Firmada', () => {
    const existingCal = {
      id: 'cal-e2e', estado_fecha: 'Reservada', evento_id: null,
      update: jest.fn().mockImplementation(function (d) { Object.assign(existingCal, d); return Promise.resolve(existingCal); }),
    };

    beforeEach(async () => {
      models.Proposal.findByPk.mockResolvedValue(proposal);
      models.Lead.findByPk.mockResolvedValue(lead);
      models.Event.findOne.mockResolvedValue(null);
      models.Event.create.mockImplementation(async (data) => { Object.assign(createdEvent, data); return createdEvent; });
      models.CalendarDate.findOne.mockResolvedValue(existingCal);
      await PUT_PROPOSAL(makeReq({ estado: 'Firmada' }), makeParams('prop-e2e'));
    });

    test('el lead sigue en "Reserva confirmada": el contrato no mueve el estado', () => {
      expect(lead.estado_actual).toBe('Reserva confirmada');
      expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
    });

    test('auto-setea fecha_firma_contrato en el lead', () => {
      expect(lead.fecha_firma_contrato).toBeInstanceOf(Date);
    });

    test('crea Event con datos completos del contrato', () => {
      expect(models.Event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lead_id: 'lead-e2e',
          fecha_confirmada: '2026-09-20',
          valor_total_evento: 500000,
          precio_senia: 150000,
          menu_seleccionado: 'Menú 2',
          minimo_tarjetas: 100,
          estado_operativo: 'Pendiente',
          estado_pago: 'Pendiente',
        })
      );
    });

    test('servicios_contratados combina servicios_base + adicionales elegidos', () => {
      expect(createdEvent.servicios_contratados).toEqual(['Salón', 'Catering', 'DJ']);
    });

    test('la fecha Reservada pasa a "Confirmada" con el evento asociado, sin duplicarla', () => {
      expect(existingCal.update).toHaveBeenCalledWith(
        expect.objectContaining({ estado_fecha: 'Confirmada', evento_id: 'evt-e2e' })
      );
      expect(models.CalendarDate.create).not.toHaveBeenCalled();
    });
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
