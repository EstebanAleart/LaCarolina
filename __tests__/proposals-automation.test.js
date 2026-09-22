/**
 * Tests para PUT /api/proposals/:id
 * E15-03 / E15-04: el estado del contrato no mueve el lead por sí solo. Al firmar se registra la fecha
 * de firma; si además hay seña registrada y fecha reservada, lib/reserva pasa el lead a
 * "Reserva confirmada" y crea el Evento con los datos del contrato.
 */

jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));

const { PUT } = require('../app/api/proposals/[id]/route');
const models = require('./__mocks__/models');

function makeRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}
function makeParams(id) {
  return { params: { id } };
}

function mockProposal(overrides = {}) {
  const obj = {
    id: 'prop-1',
    lead_id: 'lead-1',
    estado: 'Enviada',
    fecha_envio: null,
    servicios_base: ['Salón'],
    adicionales: [],
    tipo_evento: 'Fiesta de 15',
    invitados_estimados: 100,
    valor_total_evento: 400000,
    precio_senia: 100000,
    menu_seleccionado: null,
    minimo_tarjetas: null,
    modalidad_actualizacion_precios: 'Precio fijo',
    valor_tarjeta_adulto: null,
    valor_tarjeta_adolescente: null,
    valor_tarjeta_nino: null,
    ...overrides,
    update: jest.fn().mockImplementation(function (data) {
      Object.assign(obj, data);
      return Promise.resolve(obj);
    }),
  };
  return obj;
}

function mockLead(overrides = {}) {
  const obj = {
    id: 'lead-1',
    estado_actual: 'Visita realizada',
    fecha_tentativa: '2026-06-15',
    fecha_firma_contrato: null,
    nombre: 'Test Lead',
    valor_estimado: 400000,
    ...overrides,
    update: jest.fn().mockImplementation(function (data) {
      Object.assign(obj, data);
      return Promise.resolve(obj);
    }),
  };
  return obj;
}

const seniaPagada = { id: 'res-1', estado: 'Pagada', monto_senia: 150000, fecha_pago: '2026-05-01', metodo_pago: 'efectivo' };
const fechaReservada = () => ({ id: 'cal-1', fecha: '2026-06-15', estado_fecha: 'Reservada', evento_id: null, update: jest.fn().mockResolvedValue(true) });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PUT proposal → Firmada', () => {
  test('setea fecha_firma_contrato; sin seña ni fecha NO crea Evento ni cambia el lead', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead();
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(null);
    models.Reservation.findOne.mockResolvedValue(null);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(lead.fecha_firma_contrato).toBeInstanceOf(Date);
    expect(lead.estado_actual).toBe('Visita realizada');
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('con seña y fecha reservada: crea el Evento con los datos del contrato, la seña como pago y el lead pasa a Reserva confirmada', async () => {
    const proposal = mockProposal({ estado: 'Aprobada', precio_senia: 150000 });
    const lead = mockLead();
    const calDate = fechaReservada();
    const evt = { id: 'evt-nuevo', valor_total_evento: 400000, update: jest.fn().mockResolvedValue(true) };
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(null);
    models.Reservation.findOne.mockResolvedValue(seniaPagada);
    models.CalendarDate.findOne.mockResolvedValue(calDate);
    models.Proposal.findOne.mockResolvedValue(proposal);
    models.Event.create.mockResolvedValue(evt);
    models.Payment.findOne.mockResolvedValue(null);
    models.Payment.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.Event.create).toHaveBeenCalledWith(
      expect.objectContaining({ lead_id: 'lead-1', fecha_confirmada: '2026-06-15', valor_total_evento: 400000, precio_senia: 150000, estado_operativo: 'Pendiente' })
    );
    expect(models.Payment.create).toHaveBeenCalledWith(expect.objectContaining({ event_id: 'evt-nuevo', tipo: 'seña', monto: 150000, estado: 'confirmado' }));
    expect(calDate.update).toHaveBeenCalledWith({ estado_fecha: 'Confirmada', evento_id: 'evt-nuevo' });
    expect(lead.estado_actual).toBe('Reserva confirmada');
    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(expect.objectContaining({ estado_nuevo: 'Reserva confirmada' }));
  });

  test('si el Evento ya existe: sincroniza los datos del contrato y NO lo duplica', async () => {
    const adicionales = [{ nombre: 'DJ', opciones: [{ descripcion: 'DJ', precio: 20000 }], opcion_elegida: 0 }];
    const proposal = mockProposal({ estado: 'Aprobada', precio_senia: 150000, adicionales });
    const lead = mockLead({ estado_actual: 'Reserva confirmada' });
    const existingEvent = { id: 'evt-1', valor_total_evento: 400000, update: jest.fn().mockResolvedValue(true) };
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(existingEvent);
    models.Reservation.findOne.mockResolvedValue(seniaPagada);
    models.CalendarDate.findOne.mockResolvedValue({ id: 'cal-1', fecha: '2026-06-15', estado_fecha: 'Confirmada', evento_id: 'evt-1', update: jest.fn() });
    models.Proposal.findOne.mockResolvedValue(proposal);
    models.Payment.findOne.mockResolvedValue({ id: 'pay-1' });

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.Event.create).not.toHaveBeenCalled();
    expect(existingEvent.update).toHaveBeenCalledWith(expect.objectContaining({ precio_senia: 150000, adicionales, servicios_contratados: ['Salón', 'DJ'] }));
    expect(models.Payment.create).not.toHaveBeenCalled();
  });
});

describe('PUT proposal → Enviada / Aprobada / Rechazada', () => {
  test.each(['Enviada', 'Aprobada', 'Rechazada'])('%s: NO toca el lead ni el Event', async (estado) => {
    const proposal = mockProposal({ estado: 'Creada' });
    models.Proposal.findByPk.mockResolvedValue(proposal);

    await PUT(makeRequest({ estado }), makeParams('prop-1'));

    expect(proposal.update).toHaveBeenCalledWith(expect.objectContaining({ estado }));
    expect(models.Lead.findByPk).not.toHaveBeenCalled();
    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
    expect(models.Event.findOne).not.toHaveBeenCalled();
    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('Enviada setea fecha_envio una sola vez', async () => {
    const proposal = mockProposal({ estado: 'Creada', fecha_envio: null });
    models.Proposal.findByPk.mockResolvedValue(proposal);

    await PUT(makeRequest({ estado: 'Enviada' }), makeParams('prop-1'));
    expect(proposal.update).toHaveBeenCalledWith(expect.objectContaining({ fecha_envio: expect.any(Date) }));

    const ya = mockProposal({ estado: 'Enviada', fecha_envio: new Date('2026-01-01') });
    models.Proposal.findByPk.mockResolvedValue(ya);
    await PUT(makeRequest({ estado: 'Enviada' }), makeParams('prop-1'));
    expect(ya.update).toHaveBeenCalledWith(expect.not.objectContaining({ fecha_envio: expect.anything() }));
  });
});

describe('PUT proposal → errores', () => {
  test('retorna 404 si la propuesta no existe', async () => {
    models.Proposal.findByPk.mockResolvedValue(null);
    const res = await PUT(makeRequest({ estado: 'Firmada' }), makeParams('no-existe'));
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
