import { NextResponse } from 'next/server';
const { Interaction, Lead, LeadStatusHistory } = require('@/lib/models/associations');

// GET /api/leads/:id/interactions
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const interactions = await Interaction.findAll({
      where: { lead_id: id },
      order: [['fecha', 'DESC']],
    });

    return NextResponse.json(interactions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/leads/:id/interactions
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const canal = body.canal || body.tipo || 'WhatsApp';
    const direction = body.direction || 'OUT';

    const interaction = await Interaction.create({
      lead_id: id,
      tipo: canal,
      canal: canal,
      direction,
      descripcion: body.descripcion || '',
      fecha: body.fecha || new Date(),
      created_by_user_id: body.created_by_user_id || null,
    });

    // Auto-avanzar estado a "Contactado" si es una interacción saliente y el lead está en "Lead nuevo"
    if (direction === 'OUT') {
      const lead = await Lead.findByPk(id);
      if (lead && lead.estado_actual === 'Lead nuevo') {
        await LeadStatusHistory.create({
          lead_id: lead.id,
          estado_anterior: lead.estado_actual,
          estado_nuevo: 'Contactado',
          motivo: `Primera interacción saliente (${canal})`,
          changed_by_user_id: body.created_by_user_id || null,
        });
        await lead.update({ estado_actual: 'Contactado', updated_at: new Date() });
      }
    }

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
