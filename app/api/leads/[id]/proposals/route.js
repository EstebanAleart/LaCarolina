import { NextResponse } from 'next/server';
const { Proposal } = require('@/lib/models/associations');

// GET /api/leads/:id/proposals
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const proposals = await Proposal.findAll({
      where: { lead_id: id },
      order: [['version', 'DESC']],
    });

    return NextResponse.json(proposals);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/leads/:id/proposals - Crear propuesta (version auto-incrementa)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Calcular versión automáticamente
    const existingCount = await Proposal.count({ where: { lead_id: id } });

    const proposal = await Proposal.create({
      lead_id: id,
      version: existingCount + 1,
      contenido_html: body.contenido_html || body.contenido || '',
      precio_total: body.precio_total || 0,
      estado: 'Creada',
      fecha_envio: null,
      created_by_user_id: body.created_by_user_id || null,
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
