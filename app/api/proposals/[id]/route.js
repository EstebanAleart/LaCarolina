import { NextResponse } from 'next/server';
const { Proposal, Lead, LeadStatusHistory, Event, CalendarDate } = require('@/lib/models/associations');
const { PROPOSAL_TO_LEAD_STATE, getEventDataFromProposal } = require('@/lib/automations');

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

      // Si se Firmó: sincronizar campos del contrato al Event (solo al firmar)
      if (body.estado === 'Firmada' && lead) {
        // Auto-set fecha_firma_contrato
        if (!lead.fecha_firma_contrato) {
          await lead.update({ fecha_firma_contrato: new Date(), updated_at: new Date() });
        }

        const eventData = getEventDataFromProposal(proposal);

        // Buscar o crear Event
        let evt = await Event.findOne({ where: { lead_id: proposal.lead_id } });
        if (evt) {
          if (Object.keys(eventData).length > 0) {
            await evt.update(eventData);
          }
        } else if (lead.fecha_tentativa) {
          // Crear Event solo si hay fecha confirmada
          evt = await Event.create({
            lead_id: proposal.lead_id,
            fecha_confirmada: new Date(lead.fecha_tentativa).toISOString().substring(0, 10),
            estado_operativo: 'Pendiente',
            estado_pago: 'Pendiente',
            ...eventData,
          });
        }

        // Crear/actualizar CalendarDate como Confirmada si hay fecha
        if (lead.fecha_tentativa) {
          const fechaEvento = new Date(lead.fecha_tentativa).toISOString().substring(0, 10);
          const calDate = await CalendarDate.findOne({ where: { fecha: fechaEvento, lead_id: proposal.lead_id } });
          if (calDate) {
            await calDate.update({ estado_fecha: 'Confirmada', evento_id: evt?.id || calDate.evento_id });
          } else {
            await CalendarDate.create({
              fecha: fechaEvento,
              estado_fecha: 'Confirmada',
              fuente: 'CRM',
              lead_id: proposal.lead_id,
              evento_id: evt?.id || null,
            });
          }
        }
      }
    }

    return NextResponse.json(proposal);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
