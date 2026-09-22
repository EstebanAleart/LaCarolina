import { NextResponse } from 'next/server';
const { Proposal, Lead, LeadStatusHistory, Event, CalendarDate } = require('@/lib/models/associations');
const { getEventDataFromProposal } = require('@/lib/automations');
const { confirmarReservaSiCorresponde } = require('@/lib/reserva');

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

    // E15-03 / E15-04: al firmar se registra la fecha de firma y, si ya hay seña y fecha reservada,
    // lib/reserva pasa el lead a "Reserva confirmada" y crea el Evento con los datos del contrato.
    // Si el Evento ya existía, se le sincronizan los datos del contrato.
    if (body.estado === 'Firmada' && proposal.lead_id) {
      const lead = await Lead.findByPk(proposal.lead_id);
      if (lead) {
        if (!lead.fecha_firma_contrato) {
          await lead.update({ fecha_firma_contrato: new Date(), updated_at: new Date() });
        }
        const evt = await Event.findOne({ where: { lead_id: proposal.lead_id } });
        if (evt) {
          const eventData = getEventDataFromProposal(proposal);
          if (Object.keys(eventData).length > 0) await evt.update(eventData);
        }
        await confirmarReservaSiCorresponde(proposal.lead_id);
      }
    }

    return NextResponse.json(proposal);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
