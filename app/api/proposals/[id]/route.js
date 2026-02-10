import { NextResponse } from 'next/server';
const { Proposal } = require('@/lib/models/associations');

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

    return NextResponse.json(proposal);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
