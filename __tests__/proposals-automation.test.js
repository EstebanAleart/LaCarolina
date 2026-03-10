/**
 * Tests para PUT /api/proposals/:id
 * Verifica automatizaciones de estado y prevención de duplicados.
 */

// Mocks antes de importar el route
jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));

const { PUT } = require('../app/api/proposals/[id]/route');
const models = require('./__mocks__/models');

// Helper para crear un mock Request
function makeRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}

// Helper params (Next.js await params)
function makeParams(id) {
  return { params: { id } };
}

// Factory de propuesta mock
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

// Factory de lead mock
function mockLead(overrides = {}) {
  const obj = {
    id: 'lead-1',
    estado_actual: 'Propuesta enviada',
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

// ─── Firmada → sincronización al Event ──────────────────────────────────────

describe('PUT proposal → Firmada', () => {
  test('cambia estado del lead a "Contrato firmado"', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead({ estado_actual: 'Propuesta Aceptada' });
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(null); // no existe evento
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});
    models.Event.create.mockResolvedValue({ id: 'evt-1' });

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_nuevo: 'Contrato firmado' })
    );
    expect(lead.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado_actual: 'Contrato firmado' })
    );
  });

  test('NO crea Event duplicado si ya existe', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead();
    const existingEvent = { id: 'evt-existente', update: jest.fn().mockResolvedValue(true) };
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(existingEvent); // ya existe
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
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(null); // no existe
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
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(null);
    models.CalendarDate.findOne.mockResolvedValue(null);

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.Event.create).not.toHaveBeenCalled();
  });

  test('NO crea CalendarDate duplicado si ya existe', async () => {
    const proposal = mockProposal({ estado: 'Aprobada' });
    const lead = mockLead();
    const existingEvent = { id: 'evt-1', update: jest.fn().mockResolvedValue(true) };
    const existingCal = { update: jest.fn().mockResolvedValue(true) };
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(existingEvent);
    models.CalendarDate.findOne.mockResolvedValue(existingCal);

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(models.CalendarDate.create).not.toHaveBeenCalled();
    expect(existingCal.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado_fecha: 'Confirmada' })
    );
  });

  test('sincroniza precio_senia y adicionales al Event', async () => {
    const adicionales = [{ nombre: 'DJ', opciones: [{ descripcion: 'DJ', precio: 20000 }], opcion_elegida: 0 }];
    const proposal = mockProposal({ estado: 'Aprobada', precio_senia: 150000, adicionales });
    const lead = mockLead();
    const existingEvent = { id: 'evt-1', update: jest.fn().mockResolvedValue(true) };
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});
    models.Event.findOne.mockResolvedValue(existingEvent);
    models.CalendarDate.findOne.mockResolvedValue(null);
    models.CalendarDate.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Firmada' }), makeParams('prop-1'));

    expect(existingEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ precio_senia: 150000, adicionales })
    );
  });
});

// ─── Aprobada → solo cambia estado del lead ──────────────────────────────────

describe('PUT proposal → Aprobada', () => {
  test('cambia estado del lead a "Propuesta Aceptada"', async () => {
    const proposal = mockProposal({ estado: 'Enviada' });
    const lead = mockLead({ estado_actual: 'Propuesta enviada' });
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Aprobada' }), makeParams('prop-1'));

    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_nuevo: 'Propuesta Aceptada' })
    );
  });

  test('NO toca el Event al aprobar (solo al firmar)', async () => {
    const proposal = mockProposal({ estado: 'Enviada' });
    const lead = mockLead();
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Aprobada' }), makeParams('prop-1'));

    expect(models.Event.findOne).not.toHaveBeenCalled();
    expect(models.Event.create).not.toHaveBeenCalled();
  });
});

// ─── Rechazada ───────────────────────────────────────────────────────────────

describe('PUT proposal → Rechazada', () => {
  test('cambia estado del lead a "Propuesta Rechazada"', async () => {
    const proposal = mockProposal({ estado: 'Enviada' });
    const lead = mockLead({ estado_actual: 'Propuesta enviada' });
    models.Proposal.findByPk.mockResolvedValue(proposal);
    models.Lead.findByPk.mockResolvedValue(lead);
    models.LeadStatusHistory.create.mockResolvedValue({});

    await PUT(makeRequest({ estado: 'Rechazada' }), makeParams('prop-1'));

    expect(models.LeadStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ estado_nuevo: 'Propuesta Rechazada' })
    );
  });
});

// ─── Propuesta no encontrada ──────────────────────────────────────────────────

describe('PUT proposal → errores', () => {
  test('retorna 404 si la propuesta no existe', async () => {
    models.Proposal.findByPk.mockResolvedValue(null);
    const res = await PUT(makeRequest({ estado: 'Firmada' }), makeParams('no-existe'));
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
