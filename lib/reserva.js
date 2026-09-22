// Confirmación de reserva (E15-03 / E15-04 / C2-05): UNA sola puerta para pasar un lead a
// "Reserva confirmada" y crear el Evento, venga de donde venga (ficha del lead, contrato firmado,
// calendario o cambio manual de estado).
//
// Condiciones (las tres): seña registrada · fecha del evento reservada/confirmada en el calendario
// a nombre del lead · contrato firmado.
//
// Al cumplirse: lead → "Reserva confirmada"; Evento creado (si no existe) con los datos del contrato;
// la seña queda como primer pago confirmado; la fecha del calendario pasa a "Confirmada" ligada al evento.
const { Lead, Reservation, CalendarDate, Proposal, Event, Payment, LeadStatusHistory, EventoCliente } = require('@/lib/models/associations');
const { getEventDataFromProposal } = require('./automations');
const { vincularTitularAlEvento } = require('./clientes');

const fechaISO = (d) => (d ? new Date(d).toISOString().substring(0, 10) : null);

// Solo lectura: qué falta para confirmar. Devuelve { lead, faltantes, fecha, reservation, calDate, contrato }.
async function evaluarReserva(leadId) {
  const lead = await Lead.findByPk(leadId);
  if (!lead) return { lead: null, faltantes: ['lead inexistente'] };

  const [reservation, calDate, contrato] = await Promise.all([
    Reservation.findOne({ where: { lead_id: leadId } }),
    CalendarDate.findOne({ where: { lead_id: leadId, estado_fecha: ['Reservada', 'Confirmada'] }, order: [['fecha', 'ASC']] }),
    Proposal.findOne({ where: { lead_id: leadId, estado: 'Firmada' }, order: [['created_at', 'DESC']] }),
  ]);

  const faltantes = [];
  if (!reservation || reservation.estado !== 'Pagada' || !(Number(reservation.monto_senia) > 0)) faltantes.push('seña registrada');
  if (!calDate) faltantes.push('fecha del evento reservada en el calendario');
  if (!contrato) faltantes.push('contrato firmado');

  return { lead, faltantes, fecha: calDate ? fechaISO(calDate.fecha) : fechaISO(lead.fecha_tentativa), reservation, calDate, contrato };
}

// Escribe solo si se cumplen las tres condiciones. Idempotente: se puede llamar varias veces.
// Devuelve { confirmada, faltantes, event }.
async function confirmarReservaSiCorresponde(leadId, { user_id = null } = {}) {
  const ev = await evaluarReserva(leadId);
  if (!ev.lead || ev.faltantes.length) return { confirmada: false, faltantes: ev.faltantes, event: null };
  const { lead, fecha, reservation, calDate, contrato } = ev;

  // 1) Evento con los datos del contrato (E15-04)
  let event = await Event.findOne({ where: { lead_id: leadId } });
  if (!event) {
    event = await Event.create({
      lead_id: leadId,
      fecha_confirmada: fecha,
      tipo_evento: lead.tipo_evento || '',
      invitados_estimados: lead.invitados_estimados || 0,
      valor_total_evento: lead.valor_estimado || null,
      estado_operativo: 'En planificación',
      estado_pago: 'Pendiente',
      ...getEventDataFromProposal(contrato),
    });
  }
  // E15-08: el cliente del lead queda como titular del evento (vínculo Cliente ↔ Evento)
  await vincularTitularAlEvento(EventoCliente, event, lead.cliente_id);

  // 2) La seña pasa a ser el primer pago confirmado del evento (una sola vez)
  const seniaExistente = await Payment.findOne({ where: { event_id: event.id, tipo: 'seña' } });
  if (!seniaExistente) {
    await Payment.create({
      event_id: event.id,
      lead_id: leadId,
      monto: Number(reservation.monto_senia),
      tipo: 'seña',
      metodo_pago: String(reservation.metodo_pago || 'efectivo').toLowerCase(),
      fecha_pago: fechaISO(reservation.fecha_pago) || fechaISO(new Date()),
      estado: 'confirmado',
      concepto: 'Salon',
      observacion: 'Seña registrada al reservar',
    });
    const total = Number(event.valor_total_evento) || 0;
    await event.update({ estado_pago: total > 0 && Number(reservation.monto_senia) >= total ? 'Completo' : 'Parcial' });
  }

  // 3) Fecha confirmada en el calendario, ligada al evento
  if (calDate.estado_fecha !== 'Confirmada' || calDate.evento_id !== event.id) {
    await calDate.update({ estado_fecha: 'Confirmada', evento_id: event.id });
  }

  // 4) Estado del lead
  if (lead.estado_actual !== 'Reserva confirmada') {
    await LeadStatusHistory.create({
      lead_id: leadId,
      estado_anterior: lead.estado_actual,
      estado_nuevo: 'Reserva confirmada',
      motivo: 'Seña registrada + fecha reservada + contrato firmado',
      changed_by_user_id: user_id,
    });
    await lead.update({ estado_actual: 'Reserva confirmada', motivo_perdida: null, updated_at: new Date() });
  }

  return { confirmada: true, faltantes: [], event };
}

module.exports = { evaluarReserva, confirmarReservaSiCorresponde };
