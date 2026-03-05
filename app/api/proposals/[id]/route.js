import { NextResponse } from 'next/server';
const { Proposal, Lead, LeadStatusHistory, Event } = require('@/lib/models/associations');

// Mapa: estado de propuesta → nuevo estado del lead
const PROPOSAL_TO_LEAD_STATE = {
  'Enviada':   'Propuesta enviada',
  'Aceptada':  'Propuesta Aceptada',
  'Rechazada': 'Propuesta Rechazada',
};

// Extrae los campos de contrato de una propuesta para sincronizar con el evento
function getEventDataFromProposal(proposal) {
  const serviciosBase = proposal.servicios_base || [];
  const adicionalesElegidos = (proposal.adicionales || [])
    .filter(a => a.opcion_elegida !== null && a.opcion_elegida !== undefined)
    .map(a => a.nombre);
  const servicios = [...serviciosBase, ...adicionalesElegidos];
  const data = {};
  if (proposal.tipo_evento) data.tipo_evento = proposal.tipo_evento;
  if (proposal.invitados_estimados) data.invitados_estimados = proposal.invitados_estimados;
  if (proposal.valor_total_evento) data.valor_total_evento = proposal.valor_total_evento;
  if (proposal.modalidad_actualizacion_precios) data.modalidad_actualizacion_precios = proposal.modalidad_actualizacion_precios;
  if (servicios.length > 0) data.servicios_contratados = servicios;
  if (proposal.menu_seleccionado) data.menu_seleccionado = proposal.menu_seleccionado;
  if (proposal.minimo_tarjetas) data.minimo_tarjetas = proposal.minimo_tarjetas;
  if (proposal.valor_tarjeta_adulto) data.valor_tarjeta_adulto = proposal.valor_tarjeta_adulto;
  if (proposal.valor_tarjeta_adolescente) data.valor_tarjeta_adolescente = proposal.valor_tarjeta_adolescente;
  if (proposal.valor_tarjeta_nino) data.valor_tarjeta_nino = proposal.valor_tarjeta_nino;
  return data;
}

// PUT /api/proposals/:id - Actualizar propuesta/contrato
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const proposal = await Proposal.findByPk(id);
    if (!proposal) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    }

    // Si cambia a "Enviada", registrar fecha_envio automáticamente
    if (body.estado === 'Enviada' && !proposal.fecha_envio) {
      body.fecha_envio = new Date();
    }

    await proposal.update(body);

    // Sync: actualizar estado del lead cuando cambia el estado de la propuesta
    if (body.estado && PROPOSAL_TO_LEAD_STATE[body.estado] && proposal.lead_id) {
      const lead = await Lead.findByPk(proposal.lead_id);
      const nuevoEstadoLead = PROPOSAL_TO_LEAD_STATE[body.estado];
      if (lead && lead.estado_actual !== nuevoEstadoLead) {
        await LeadStatusHistory.create({
          lead_id: lead.id,
          estado_anterior: lead.estado_actual,
          estado_nuevo: nuevoEstadoLead,
          motivo: `Propuesta ${body.estado.toLowerCase()} automáticamente`,
          changed_by_user_id: null,
        });
        await lead.update({ estado_actual: nuevoEstadoLead, updated_at: new Date() });
      }

      // Si se Aceptó: sincronizar campos del contrato al Event (si ya existe)
      if (body.estado === 'Aceptada') {
        const evt = await Event.findOne({ where: { lead_id: proposal.lead_id } });
        if (evt) {
          const eventData = getEventDataFromProposal(proposal);
          if (Object.keys(eventData).length > 0) {
            await evt.update(eventData);
          }
        }
      }
    }

    return NextResponse.json(proposal);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
