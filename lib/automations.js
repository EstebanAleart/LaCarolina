/**
 * lib/automations.js
 * Lógica de automatizaciones compartida entre routes y testeable de forma aislada.
 */

/**
 * Mapeo de estado de propuesta/contrato → estado del lead.
 */
const PROPOSAL_TO_LEAD_STATE = {
  'Enviada':   'Propuesta enviada',
  'Aprobada':  'Propuesta Aceptada',
  'Rechazada': 'Propuesta Rechazada',
  'Firmada':   'Contrato firmado',
};

/**
 * Extrae los campos del contrato para sincronizar al Event cuando se firma.
 * Solo se llama al pasar a estado "Firmada".
 *
 * @param {object} proposal - instancia de Proposal (o plain object)
 * @returns {object} campos listos para Event.update() / Event.create()
 */
function parseJsonField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch { return []; } }
  return [];
}

function getEventDataFromProposal(proposal) {
  const serviciosBase = parseJsonField(proposal.servicios_base);
  const adicionalesElegidos = parseJsonField(proposal.adicionales)
    .filter(a => a.opcion_elegida !== null && a.opcion_elegida !== undefined)
    .map(a => a.nombre);
  const servicios = [...serviciosBase, ...adicionalesElegidos];

  const data = {};
  if (proposal.tipo_evento)                   data.tipo_evento = proposal.tipo_evento;
  if (proposal.invitados_estimados)           data.invitados_estimados = proposal.invitados_estimados;
  if (proposal.valor_total_evento)            data.valor_total_evento = proposal.valor_total_evento;
  if (proposal.precio_senia)                  data.precio_senia = proposal.precio_senia;
  if (proposal.modalidad_actualizacion_precios) data.modalidad_actualizacion_precios = proposal.modalidad_actualizacion_precios;
  if (servicios.length > 0)                   data.servicios_contratados = servicios;
  if (proposal.adicionales?.length)           data.adicionales = proposal.adicionales;
  if (proposal.menu_seleccionado)             data.menu_seleccionado = proposal.menu_seleccionado;
  if (proposal.minimo_tarjetas)               data.minimo_tarjetas = proposal.minimo_tarjetas;
  if (proposal.valor_tarjeta_adulto)          data.valor_tarjeta_adulto = proposal.valor_tarjeta_adulto;
  if (proposal.valor_tarjeta_adolescente)     data.valor_tarjeta_adolescente = proposal.valor_tarjeta_adolescente;
  if (proposal.valor_tarjeta_nino)            data.valor_tarjeta_nino = proposal.valor_tarjeta_nino;
  return data;
}

module.exports = { PROPOSAL_TO_LEAD_STATE, getEventDataFromProposal };
