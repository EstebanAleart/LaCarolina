// E15-08: vinculación lead → cliente. Un lead siempre queda atado a un cliente:
// - si viene cliente_id, se usa;
// - si no, se busca uno existente por teléfono normalizado (solo dígitos) o por email;
// - si no hay, se crea con los datos de contacto del lead.
const { Op } = require('sequelize');

const normTelefono = (t) => (t ? String(t).replace(/\D/g, '') : '') || null;
const normEmail = (e) => (e ? String(e).trim().toLowerCase() : '') || null;

// Devuelve el cliente (existente o nuevo) para los datos de contacto dados. No toca el lead.
async function buscarOCrearCliente(Cliente, { cliente_id, nombre, telefono, email, tipo_cliente, lead_origen_id }) {
  if (cliente_id) {
    const c = await Cliente.findByPk(cliente_id);
    if (c) return c;
  }
  const tel = normTelefono(telefono);
  const mail = normEmail(email);
  const or = [];
  if (tel) or.push({ telefono_norm: tel });
  if (mail) or.push({ email: mail });
  if (or.length) {
    const existente = await Cliente.findOne({ where: { [Op.or]: or }, order: [['created_at', 'ASC']] });
    if (existente) return existente;
  }
  return Cliente.create({
    nombre: nombre || 'Sin nombre',
    telefono: telefono || null,
    telefono_norm: tel,
    email: mail,
    tipo_cliente: tipo_cliente || 'Particular',
    lead_origen_id: lead_origen_id || null,
  });
}

// Deja el lead vinculado a su cliente (idempotente). Devuelve el cliente.
async function vincularClienteAlLead(Cliente, lead, datos = {}) {
  const cliente = await buscarOCrearCliente(Cliente, {
    cliente_id: datos.cliente_id || lead.cliente_id,
    nombre: lead.nombre,
    telefono: lead.telefono,
    email: lead.email,
    tipo_cliente: lead.tipo_cliente,
    lead_origen_id: lead.id,
  });
  if (lead.cliente_id !== cliente.id) await lead.update({ cliente_id: cliente.id });
  return cliente;
}

// Titular del evento = cliente del lead (idempotente).
async function vincularTitularAlEvento(EventoCliente, event, clienteId) {
  if (!clienteId) return null;
  const [fila] = await EventoCliente.findOrCreate({
    where: { evento_id: event.id, cliente_id: clienteId },
    defaults: { evento_id: event.id, cliente_id: clienteId, rol: 'titular' },
  });
  return fila;
}

module.exports = { normTelefono, normEmail, buscarOCrearCliente, vincularClienteAlLead, vincularTitularAlEvento };
