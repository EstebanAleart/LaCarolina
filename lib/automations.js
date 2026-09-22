/**
 * lib/automations.js
 * Lógica de automatizaciones compartida entre routes y testeable de forma aislada.
 */

// E15-01: el estado del contrato ya NO mueve el estado del lead (pipeline de 4 estados).

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

module.exports = { getEventDataFromProposal };

// ─── E15-06 / E15-07: estados del evento por fecha + tareas post-evento ──────────────────────
// Sin cron: se llama al leer eventos/alertas, así que al pasar la fecha la próxima lectura lo acomoda.
const EV = { PLAN: 'En planificación', PROXIMO: 'Próximo evento', REALIZADO: 'Evento realizado', CERRADO: 'Post-evento / cerrado' };
const PROXIMO_DIAS = () => Number(process.env.EVENTO_PROXIMO_DIAS) || 30;
const POST_TAREAS = () => [
  { titulo: 'Verificar saldos', dias: 0, prioridad: 'Alta' },
  { titulo: 'Verificar devoluciones', dias: 0, prioridad: 'Media' },
  { titulo: 'Registrar incidencias y observaciones', dias: 0, prioridad: 'Media' },
  { titulo: 'Mensaje de agradecimiento', dias: Number(process.env.POSTEVENTO_AGRADECIMIENTO_DIAS) || 1, prioridad: 'Alta' },
  { titulo: 'Pedir feedback y reseña de Google', dias: Number(process.env.POSTEVENTO_FEEDBACK_DIAS) || 2, prioridad: 'Media' },
];
const POST_PREFIJO = '[Post-evento] ';
const fechaISO = (d) => (d ? new Date(d).toISOString().substring(0, 10) : null);

/**
 * Crea las tareas post-evento de un evento (E15-07). Idempotente: si ya tiene, no duplica.
 * Los plazos cuentan desde la fecha del evento. Devuelve cuántas creó.
 */
async function crearTareasPostEvento({ Task }, event) {
  const { Op } = require('sequelize');
  const existentes = await Task.count({ where: { evento_id: event.id, titulo: { [Op.like]: `${POST_PREFIJO}%` } } });
  if (existentes > 0) return 0;
  const base = new Date((fechaISO(event.fecha_confirmada) || fechaISO(new Date())) + 'T12:00:00Z');
  let n = 0;
  for (const t of POST_TAREAS()) {
    const due = new Date(base);
    due.setUTCDate(due.getUTCDate() + t.dias);
    await Task.create({
      titulo: `${POST_PREFIJO}${t.titulo}`,
      descripcion: `Evento del ${fechaISO(event.fecha_confirmada) || '—'}`,
      lead_id: event.lead_id,
      evento_id: event.id,
      estado: 'Pendiente',
      prioridad: t.prioridad,
      due_date: due,
    });
    n++;
  }
  return n;
}

/**
 * Acomoda los estados de los eventos según la fecha (E15-06):
 *  1) fecha pasada y todavía En planificación / Próximo → Evento realizado (+ tareas post-evento)
 *  2) En planificación a ≤ EVENTO_PROXIMO_DIAS de la fecha → Próximo evento
 *  3) Evento realizado con todas sus tareas post-evento en Hecho/Cancelado → Post-evento / cerrado
 * Devuelve cuántos pasaron a realizado.
 */
async function actualizarEstadosEventos({ Event, Task }, hoy = require('./alerts').hoyISO()) {
  const { Op } = require('sequelize');
  try {
    const hoyD = new Date(hoy + 'T00:00:00Z');
    const limite = new Date(hoyD);
    limite.setUTCDate(limite.getUTCDate() + PROXIMO_DIAS());

    const vencidos = await Event.findAll({
      where: { fecha_confirmada: { [Op.lt]: hoyD }, estado_operativo: { [Op.in]: [EV.PLAN, EV.PROXIMO] } },
    });
    for (const ev of vencidos) {
      await ev.update({ estado_operativo: EV.REALIZADO });
      await crearTareasPostEvento({ Task }, ev);
    }

    await Event.update(
      { estado_operativo: EV.PROXIMO },
      { where: { estado_operativo: EV.PLAN, fecha_confirmada: { [Op.gte]: hoyD, [Op.lte]: limite } } },
    );

    const realizados = await Event.findAll({ where: { estado_operativo: EV.REALIZADO } });
    if (realizados.length) {
      const tareas = await Task.findAll({
        where: { evento_id: { [Op.in]: realizados.map((e) => e.id) }, titulo: { [Op.like]: `${POST_PREFIJO}%` } },
      });
      for (const ev of realizados) {
        const mias = tareas.filter((t) => t.evento_id === ev.id);
        if (mias.length && mias.every((t) => ['Hecho', 'Cancelado'].includes(t.estado))) {
          await ev.update({ estado_operativo: EV.CERRADO });
        }
      }
    }
    return vencidos.length;
  } catch (e) {
    // ponytail: si falla, el listado sigue funcionando.
    console.error('[actualizarEstadosEventos]', e.message);
    return 0;
  }
}

module.exports.ESTADOS_EVENTO = EV;
module.exports.crearTareasPostEvento = crearTareasPostEvento;
module.exports.actualizarEstadosEventos = actualizarEstadosEventos;
