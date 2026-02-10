import { NextResponse } from 'next/server';
const { Visit } = require('@/lib/models/associations');

// GET /api/leads/:id/visits
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const visits = await Visit.findAll({
      where: { lead_id: id },
      order: [['fecha_visita', 'DESC']],
    });

    return NextResponse.json(visits);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/leads/:id/visits
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const visit = await Visit.create({
      lead_id: id,
      fecha_visita: body.fecha_visita || new Date(),
      resultado: body.resultado || 'neutral',
      notas: body.notas || '',
      created_by_user_id: body.created_by_user_id || null,
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
