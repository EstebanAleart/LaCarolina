/**
 * E15-08: Cliente ≠ Evento. Vinculación lead → cliente (dedupe por teléfono/email) y titular del evento.
 */
const { Op } = require('sequelize');
const { normTelefono, normEmail, buscarOCrearCliente, vincularClienteAlLead, vincularTitularAlEvento } = require('@/lib/clientes');

jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));
const { POST } = require('../app/api/leads/route');
const models = require('./__mocks__/models');

beforeEach(() => jest.clearAllMocks());

describe('normalización', () => {
  test('teléfono a dígitos, email a minúsculas', () => {
    expect(normTelefono('+54 (11) 5555-1234')).toBe('541155551234');
    expect(normTelefono('')).toBeNull();
    expect(normEmail('  Ana@Mail.com ')).toBe('ana@mail.com');
    expect(normEmail(null)).toBeNull();
  });
});

describe('buscarOCrearCliente', () => {
  test('usa cliente_id si viene y existe', async () => {
    const Cliente = { findByPk: jest.fn().mockResolvedValue({ id: 'c1' }), findOne: jest.fn(), create: jest.fn() };
    const c = await buscarOCrearCliente(Cliente, { cliente_id: 'c1', nombre: 'X' });
    expect(c.id).toBe('c1');
    expect(Cliente.create).not.toHaveBeenCalled();
  });

  test('reutiliza un cliente existente con el mismo teléfono (aunque esté escrito distinto)', async () => {
    const Cliente = { findByPk: jest.fn(), findOne: jest.fn().mockResolvedValue({ id: 'c-existente' }), create: jest.fn() };
    const c = await buscarOCrearCliente(Cliente, { nombre: 'Ana', telefono: '11 5555-1234', email: '' });
    expect(c.id).toBe('c-existente');
    expect(Cliente.findOne.mock.calls[0][0].where[Op.or]).toEqual([{ telefono_norm: '1155551234' }]);
    expect(Cliente.create).not.toHaveBeenCalled();
  });

  test('crea el cliente si no hay coincidencia, con teléfono normalizado y email en minúsculas', async () => {
    const Cliente = { findByPk: jest.fn(), findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'c-nuevo' }) };
    await buscarOCrearCliente(Cliente, { nombre: 'Ana', telefono: '11 5555-1234', email: 'Ana@Mail.com', lead_origen_id: 'lead-1' });
    expect(Cliente.create).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Ana', telefono_norm: '1155551234', email: 'ana@mail.com', lead_origen_id: 'lead-1' }));
  });
});

describe('vincularClienteAlLead / vincularTitularAlEvento', () => {
  test('deja el lead con cliente_id (idempotente si ya lo tiene)', async () => {
    const Cliente = { findByPk: jest.fn().mockResolvedValue({ id: 'c1' }), findOne: jest.fn(), create: jest.fn() };
    const lead = { id: 'l1', nombre: 'Ana', cliente_id: null, update: jest.fn().mockResolvedValue(true) };
    await vincularClienteAlLead(Cliente, lead, { cliente_id: 'c1' });
    expect(lead.update).toHaveBeenCalledWith({ cliente_id: 'c1' });

    const ya = { id: 'l2', nombre: 'Ana', cliente_id: 'c1', update: jest.fn() };
    await vincularClienteAlLead(Cliente, ya, {});
    expect(ya.update).not.toHaveBeenCalled();
  });

  test('titular del evento con findOrCreate; sin cliente no hace nada', async () => {
    const EventoCliente = { findOrCreate: jest.fn().mockResolvedValue([{ rol: 'titular' }, true]) };
    await vincularTitularAlEvento(EventoCliente, { id: 'e1' }, 'c1');
    expect(EventoCliente.findOrCreate).toHaveBeenCalledWith({
      where: { evento_id: 'e1', cliente_id: 'c1' },
      defaults: { evento_id: 'e1', cliente_id: 'c1', rol: 'titular' },
    });
    expect(await vincularTitularAlEvento(EventoCliente, { id: 'e1' }, null)).toBeNull();
  });
});

describe('POST /api/leads', () => {
  test('crea el lead y lo deja atado a un cliente (nuevo si no existe)', async () => {
    const lead = { id: 'lead-1', nombre: 'Ana', telefono: '1155551234', email: '', cliente_id: null, update: jest.fn().mockResolvedValue(true) };
    models.Lead.create.mockResolvedValue(lead);
    models.Cliente.findOne.mockResolvedValue(null);
    models.Cliente.create.mockResolvedValue({ id: 'c-nuevo' });

    const res = await POST({ json: jest.fn().mockResolvedValue({ nombre: 'Ana', telefono: '1155551234' }) });

    expect(res.status).toBe(201);
    expect(models.Cliente.create).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Ana', telefono_norm: '1155551234', lead_origen_id: 'lead-1' }));
    expect(lead.update).toHaveBeenCalledWith({ cliente_id: 'c-nuevo' });
  });
});
