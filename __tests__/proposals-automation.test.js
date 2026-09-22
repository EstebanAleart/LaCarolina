/**
 * Tests para PUT /api/proposals/:id
 * E15-01: el estado del contrato NO mueve el estado del lead. Al firmar: fecha de firma,
 * Event con los datos del contrato y fecha "Confirmada" en el calendario.
 */

// Mocks antes de importar el route
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
    update: jest.fn().mockResolvedValue(true),
  };
  return obj;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Firmada → Event + fecha Confirmada, sin tocar el estado del lead ────────

describe('PUT proposal → Firmada', () => {
  test('NO cambia el estado del lead y setea fecha_firma_contrato', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead();
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(null);
    models.Event.create.mockResolvedValue({ id: 'evt-1' });
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.LeadStatusHistory.create).not.toHaveBeenCalled();
    expect(lead.update).not.toHaveBeenCalledWith(expect.objectContaining({ estado_actual: expect.anything() }));
    expect(lead.update).toHaveBeenCalledWith(expect.objectContaining({ fecha_firma_contrato: expect.any(Date) }));
  });

  test('NO crea Event duplicado si ya existe', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead();
    const existingEvent = { id: 'evt-existente', update: jest.fn().mockResolvedValue(true) };
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(existingEvent);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.Event.create).not.toHaveBeenCalled();
    expect(existingEvent.update).toHaveBeenCalled();
  });

  test('crea Event si no existe y hay fecha_tentativa', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead({ fecha_tentativa: '2026-06-15' });
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(null);
    models.Event.create.mockResolvedValue({ id: 'evt-nuevo' });
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.Event.create).toHaveBeenCalledWith(
      expect.objectContaining({ lead_id: 'lead-1', estado_operativo: 'Pendiente' })
    );
  });

  test('NO crea Event si no hay fecha_tentativa', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead({ fecha_tentativa: null });
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(null);
    models.CalendarDate.findOne.mockResolvedValue(null);

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('NO crea CalendarDate duplicado si ya existe: la pasa a Confirmada', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead();
    const existingEvent = { id: 'evt-1', update: jest.fn().mockResolvedValue(true) };
    const existingCal = { update: jest.fn().mockResolvedValue(true) };
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(existingEvent);
    models.CalendarDate.findOne.mockResolvedValue(existingCal);

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.CalendarDate.create).not.toHaveBeenCalled();
    expect(existingCal.update).toHaveBeenCalledWith(expect.objectContaining({ estado_fecha: 'Confirmada' }));
  });

  test('sincroniza precio_senia y adicionales al Event', async () => {
    const adicionales = [{ nombre: 'DJ', opciones: [{ descripcion: 'DJ', precio: 20000 }], opcion_elegida: 0 }];
    const proposal = mockProposal({ estado: 'Aprobada', precio_senia: 150000, adicionales });
    const lead = mockLead();
    const existingEvent = { id: 'evt-1', update: jest.fn().mockResolvedValue(true) };
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.Event.findOne.mockResolvedValue(existingEvent);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(existingEvent.update).toHaveBeenCalledWith(expect.objectContaining({ precio_senia: 150000, adicionales }));
  });
});

// ─── Enviada / Aprobada / Rechazada → no tocan el lead ni el Event ───────────

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
