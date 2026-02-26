import { NextResponse } from 'next/server';
const { Proposal, Lead, LeadStatusHistory } = require('@/lib/models/associations');

// Mapa: estado de propuesta → nuevo estado del lead
const PROPOSAL_TO_LEAD_STATE = {
  'Enviada':   'Propuesta enviada',
  'Aceptada':  'Propuesta Aceptada',
  'Rechazada': 'Propuesta Rechazada',
};

// PUT /api/proposals/:id - Actualizar propuesta
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
    }

    return NextResponse.json(proposal);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
