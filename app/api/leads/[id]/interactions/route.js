import { NextResponse } from 'next/server';
const { Interaction } = require('@/lib/models/associations');

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

    const interaction = await Interaction.create({
      lead_id: id,
      tipo: body.tipo || 'WhatsApp',
      descripcion: body.descripcion || '',
      fecha: body.fecha || new Date(),
      created_by_user_id: body.created_by_user_id || null,
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
