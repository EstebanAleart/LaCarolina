/**
 * Tests para PUT /api/leads/:id/status
 * Pipeline de 4 estados (E15-01): Lead nuevo → Visita agendada → Visita realizada → Reserva confirmada, más Perdido.
 * - "Reserva confirmada" = seña tomada: reserva la fecha tentativa en el calendario (Reservada + Reservation).
 * - No hay tareas automáticas ni cambios de propuesta desde acá.
 */

jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));

const { PUT } = require('../app/api/leads/[id]/status/route');
const models = require('./__mocks__/models');

function makeRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}
function makeParams(id) {
  return { params: { id } };
}

function mockLead(overrides = {}) {
  const obj = {
    id: 'lead-1',
    nombre: 'Test Lead',
    estado_actual: 'Visita realizada',
    fecha_tentativa: '2026-06-15',
    valor_estimado: 400000,
    invitados_estimados: 100,
    ...overrides,
    update: jest.fn().mockImplementation(function (data) {
      Object.assign(obj, data);
      return Promise.resolve(obj);
    }),
  };
  return obj;
}

beforeEach(() => {
  jest.clearAllMocks();
  models.LeadStatusHistory.create.mockResolvedValue({});
  models.Proposal.findOne.mockResolvedValue({ id: 'prop-1' }); // ya hay propuesta, no crea otra
});

// E15-03 / E15-04: "Reserva confirmada" exige seña registrada + fecha reservada + contrato firmado,
// y al cumplirse crea el Evento con los datos del contrato (lib/reserva).
describe('PUT /status → Reserva confirmada', () => {
  const contratoFirmado = { id: 'prop-1', estado: 'Firmada', valor_total_evento: 400000, tipo_evento: 'Fiesta de 15', invitados_estimados: 100, servicios_base: ['Salón'], adicionales: [] };
  const seniaPagada = { id: 'res-1', estado: 'Pagada', monto_senia: 150000, fecha_pago: '2026-05-01', metodo_pago: 'Transferencia' };

  test('rechaza con 400 y dice qué falta cuando no hay seña, fecha ni contrato', async () => {
    models.Lead.findByPk.mockResolvedValue(mockLead());
    models.Reservation.findOne.mockResolvedValue(null);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.Proposal.findOne.mockResolvedValue(null);

    const res = await PUT(makeRequest({ estado: 'Reserva confirmada' }), makeParams('lead-1'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/seña registrada/);
    expect(body.error).toMatch(/fecha del evento/);
    expect(body.error).toMatch(/contrato firmado/);
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('con seña pero sin contrato: 400 nombrando solo lo que falta', async () => {
    models.Lead.findByPk.mockResolvedValue(mockLead());
    models.Reservation.findOne.mockResolvedValue(seniaPagada);
    models.CalendarDate.findOne.mockResolvedValue({ id: 'cal-1', fecha: '2026-06-15', estado_fecha: 'Reservada' });
    models.Proposal.findOne.mockResolvedValue(null);

    const res = await PUT(makeRequest({ estado: 'Reserva confirmada' }), makeParams('lead-1'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Para confirmar la reserva falta: contrato firmado');
  });

  test('con las tres condiciones: confirma, crea el Evento con el contrato, la seña como primer pago y la fecha Confirmada', async () => {
    const lead = mockLead();
    const calDate = { id: 'cal-1', fecha: '2026-06-15', estado_fecha: 'Reservada', evento_id: null, update: jest.fn().mockResolvedValue(true) };
    const evt = { id: 'evt-1', valor_total_evento: 400000, update: jest.fn().mockResolvedValue(true) };
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Reservation.findOne.mockResolvedValue(seniaPagada);
    models.CalendarDate.findOne.mockResolvedValue(calDate);
    models.Proposal.findOne.mockResolvedValue(contratoFirmado);
    models.Event.findOne.mockResolvedValue(null);
    models.Event.create.mockResolvedValue(evt);
    models.Payment.findOne.mockResolvedValue(null);
    models.Payment.create.mockResolvedValue({});

    const res = await PUT(makeRequest({ estado: 'Reserva confirmada' }), makeParams('lead-1'));

    expect(res.status).toBe(200);
    expect(models.Event.create).toHaveBeenCalledWith(
      expect.objectContaining({ lead_id: 'lead-1', fecha_confirmada: '2026-06-15', valor_total_evento: 400000, servicios_contratados: ['Salón'], estado_operativo: 'Pendiente' })
    );
    expect(models.Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: 'evt-1', tipo: 'seña', monto: 150000, estado: 'confirmado', metodo_pago: 'transferencia', fecha_pago: '2026-05-01' })
    );
    expect(evt.update).toHaveBeenCalledWith({ estado_pago: 'Parcial' });
    expect(calDate.update).toHaveBeenCalledWith({ estado_fecha: 'Confirmada', evento_id: 'evt-1' });
    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_anterior: 'Visita realizada', estado_nuevo: 'Reserva confirmada' })
    );
    expect(lead.update).toHaveBeenCalledWith(expect.objectContaining({ estado_actual: 'Reserva confirmada' }));
    expect(models.Task.create).not.toHaveBeenCalled();
  });

  test('es idempotente: con Evento, seña y fecha ya cargados no duplica nada', async () => {
    const lead = mockLead({ estado_actual: 'Reserva confirmada' });
    const calDate = { id: 'cal-1', fecha: '2026-06-15', estado_fecha: 'Confirmada', evento_id: 'evt-1', update: jest.fn() };
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Reservation.findOne.mockResolvedValue(seniaPagada);
    models.CalendarDate.findOne.mockResolvedValue(calDate);
    models.Proposal.findOne.mockResolvedValue(contratoFirmado);
    models.Event.findOne.mockResolvedValue({ id: 'evt-1', update: jest.fn() });
    models.Payment.findOne.mockResolvedValue({ id: 'pay-1' });

    const res = await PUT(makeRequest({ estado: 'Reserva confirmada' }), makeParams('lead-1'));

    expect(res.status).toBe(200);
    expect(models.Event.create).not.toHaveBeenCalled();
    expect(models.Payment.create).not.toHaveBeenCalled();
    expect(calDate.update).not.toHaveBeenCalled();
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
  });
});

describe('PUT /status → propuesta base', () => {
  test('Visita realizada crea una propuesta "Creada" si el lead no tiene ninguna', async () => {
    const lead = mockLead({ estado_actual: 'Visita agendada' });
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Proposal.findOne.mockResolvedValue(null);
    models.Proposal.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Visita realizada' }), makeParams('lead-1'));

    expect(models.Proposal.create).toHaveBeenCalledWith(expect.objectContaining({ lead_id: 'lead-1', estado: 'Creada' }));
  });

  test('Visita agendada NO crea propuesta', async () => {
    const lead = mockLead({ estado_actual: 'Lead nuevo' });
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Proposal.findOne.mockResolvedValue(null);

    await PUT(makeRequest({ estado: 'Visita agendada' }), makeParams('lead-1'));

    expect(models.Proposal.create).not.toHaveBeenCalled();
  });
});

describe('PUT /status → Perdido', () => {
  test('requiere motivo: retorna 400 sin motivo', async () => {
    models.Lead.findByPk.mockResolvedValue(mockLead());
    const res = await PUT(makeRequest({ estado: 'Perdido' }), makeParams('lead-1'));
    expect(res.status).toBe(400);
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
  });

  test('con motivo de la lista: historial con el motivo y motivo_perdida en el lead (reporteable)', async () => {
    const lead = mockLead();
    models.Lead.findByPk.mockResolvedValue(lead);

    await PUT(makeRequest({ estado: 'Perdido', motivo: 'Eligió otro salón' }), makeParams('lead-1'));

    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_nuevo: 'Perdido', motivo: 'Eligió otro salón' })
    );
    expect(lead.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado_actual: 'Perdido', motivo_perdida: 'Eligió otro salón' })
    );
  });

  test('motivo fuera de la lista → 400', async () => {
    models.Lead.findByPk.mockResolvedValue(mockLead());
    const res = await PUT(makeRequest({ estado: 'Perdido', motivo: 'no me gustó' }), makeParams('lead-1'));
    expect(res.status).toBe(400);
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
  });

  test('"Otro" sin descripción → 400; con descripción guarda "Otro: ..." en el historial', async () => {
    const lead = mockLead();
    models.Lead.findByPk.mockResolvedValue(lead);

    const sin = await PUT(makeRequest({ estado: 'Perdido', motivo: 'Otro', detalle: '  ' }), makeParams('lead-1'));
    expect(sin.status).toBe(400);

    await PUT(makeRequest({ estado: 'Perdido', motivo: 'Otro', detalle: 'Se mudan a otra ciudad' }), makeParams('lead-1'));
    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_nuevo: 'Perdido', motivo: 'Otro: Se mudan a otra ciudad' })
    );
    expect(lead.update).toHaveBeenCalledWith(expect.objectContaining({ motivo_perdida: 'Otro' }));
  });

  test('al salir de Perdido se limpia motivo_perdida', async () => {
    const lead = mockLead({ estado_actual: 'Perdido', motivo_perdida: 'Precio' });
    models.Lead.findByPk.mockResolvedValue(lead);

    await PUT(makeRequest({ estado: 'Visita agendada' }), makeParams('lead-1'));

    expect(lead.update).toHaveBeenCalledWith(expect.objectContaining({ estado_actual: 'Visita agendada', motivo_perdida: null }));
  });
});

describe('PUT /status → errores', () => {
  test('retorna 404 si lead no existe', async () => {
    models.Lead.findByPk.mockResolvedValue(null);
    const res = await PUT(makeRequest({ estado: 'Visita agendada' }), makeParams('no-existe'));
    expect(res.status).toBe(404);
  });
});
