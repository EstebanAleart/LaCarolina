/**
 * Tests para PUT /api/leads/:id/status
 * Verifica automatizaciones: prevención de duplicados, sync de propuesta, creación de eventos.
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
    estado_actual: 'Propuesta Aceptada',
    fecha_tentativa: '2026-06-15',
    fecha_firma_contrato: null,
    valor_estimado: 400000,
    tipo_evento: 'Fiesta de 15',
    invitados_estimados: 100,
    ...overrides,
    update: jest.fn().mockImplementation(function (data) {
      Object.assign(obj, data);
      return Promise.resolve(obj);
    }),
  };
  return obj;
}

function mockProposal(overrides = {}) {
  const obj = {
    id: 'prop-1',
    lead_id: 'lead-1',
    estado: 'Aprobada',
    fecha_envio: new Date(),
    servicios_base: [],
    adicionales: [],
    ...overrides,
    update: jest.fn().mockResolvedValue(true),
  };
  return obj;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Contrato firmado ─────────────────────────────────────────────────────────

describe('PUT /status → Contrato firmado', () => {
  test('actualiza propuesta a "Firmada"', async () => {
    const lead = mockLead();
    const proposal = mockProposal({ estado: 'Aprobada' });
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue({ id: 'evt-1' }); // ya existe
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT(makeRequest({ estado: 'Contrato firmado', motivo: null }), makeParams('lead-1'));

    expect(proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'Firmada' })
    );
  });

  test('NO crea Event duplicado: usa findOne antes de crear', async () => {
    const lead = mockLead();
    const existingEvent = { id: 'evt-existente' };
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(existingEvent);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(mockProposal());

    await PUT(makeRequest({ estado: 'Contrato firmado' }), makeParams('lead-1'));

    expect(models.Event.findOne).toHaveBeenCalled();
    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('crea Event si no existe y hay fecha_tentativa', async () => {
    const lead = mockLead({ fecha_tentativa: '2026-06-15' });
    const proposal = mockProposal({ estado: 'Firmada' });
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Proposal.findOne
      .mockResolvedValueOnce(proposal)   // busca propuesta Firmada para copiar datos al event
      .mockResolvedValue(mockProposal()); // última propuesta para actualizar estado
    models.Event.findOne.mockResolvedValue(null);
    models.Event.create.mockResolvedValue({ id: 'evt-nuevo' });
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Contrato firmado' }), makeParams('lead-1'));

    expect(models.Event.create).toHaveBeenCalled();
  });
});

// ─── Reserva tomada ───────────────────────────────────────────────────────────

describe('PUT /status → Reserva tomada', () => {
  test('actualiza propuesta a "Aprobada" (no a Firmada)', async () => {
    const lead = mockLead({ estado_actual: 'Esperando Reserva' });
    const proposal = mockProposal({ estado: 'Enviada' });
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT(makeRequest({ estado: 'Reserva tomada' }), makeParams('lead-1'));

    expect(proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'Aprobada' })
    );
  });

  test('NO actualiza propuesta si ya está Firmada', async () => {
    const lead = mockLead({ estado_actual: 'Esperando Reserva' });
    const proposal = mockProposal({ estado: 'Firmada' });
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT(makeRequest({ estado: 'Reserva tomada' }), makeParams('lead-1'));

    expect(proposal.update).not.toHaveBeenCalled();
  });
});

// ─── Perdido ──────────────────────────────────────────────────────────────────

describe('PUT /status → Perdido', () => {
  test('requiere motivo — retorna 400 sin motivo', async () => {
    const lead = mockLead();
    models.Lead.findByPk.mockResolvedValue(lead);

    const res = await PUT(makeRequest({ estado: 'Perdido', motivo: null }), makeParams('lead-1'));
    const body = await res.json();

    expect(body.error).toMatch(/motivo/i);
  });

  test('actualiza propuesta a "Rechazada" si no está Firmada', async () => {
    const lead = mockLead({ estado_actual: 'Propuesta enviada' });
    const proposal = mockProposal({ estado: 'Enviada' });
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT(makeRequest({ estado: 'Perdido', motivo: 'Precio muy alto' }), makeParams('lead-1'));

    expect(proposal.update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'Rechazada' }));
  });

  test('NO toca propuesta si ya está Firmada', async () => {
    const lead = mockLead();
    const proposal = mockProposal({ estado: 'Firmada' });
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Proposal.findOne.mockResolvedValue(proposal);

    await PUT(makeRequest({ estado: 'Perdido', motivo: 'Razón' }), makeParams('lead-1'));

    expect(proposal.update).not.toHaveBeenCalled();
  });
});

// ─── Lead no encontrado ───────────────────────────────────────────────────────

describe('PUT /status → errores', () => {
  test('retorna 404 si lead no existe', async () => {
    models.Lead.findByPk.mockResolvedValue(null);

    const res = await PUT(makeRequest({ estado: 'Contactado' }), makeParams('no-existe'));
    const body = await res.json();

    expect(body.error).toBeDefined();
  });
});
