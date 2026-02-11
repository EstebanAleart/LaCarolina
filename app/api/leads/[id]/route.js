import { NextResponse } from 'next/server';
const { Lead, Interaction, Proposal, Visit, Reservation, Event, LeadStatusHistory, Task } = require('@/lib/models/associations');

// GET /api/leads/:id - Detalle de un lead con todas sus relaciones
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const lead = await Lead.findByPk(id, {
      include: [
        { association: 'interactions', order: [['fecha', 'DESC']] },
        { association: 'visits', order: [['fecha_visita', 'DESC']] },
        { association: 'proposals', order: [['version', 'DESC']] },
        { association: 'status_history', order: [['changed_at', 'DESC']] },
        { association: 'reservation' },
        { association: 'event' },
      ],
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/leads/:id - Actualizar un lead
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    await lead.update({
      ...body,
      updated_at: new Date(),
    });

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/leads/:id - Eliminar lead con cascade manual
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Cascade manual
    await Interaction.destroy({ where: { lead_id: id } });
    await Visit.destroy({ where: { lead_id: id } });
    await Proposal.destroy({ where: { lead_id: id } });
    await LeadStatusHistory.destroy({ where: { lead_id: id } });
    await Reservation.destroy({ where: { lead_id: id } });
    await Task.destroy({ where: { lead_id: id } });
    await Event.destroy({ where: { lead_id: id } });
    await lead.destroy();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
