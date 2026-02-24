import { NextResponse } from 'next/server';
const { Interaction, Lead } = require('@/lib/models/associations');

// GET /api/interactions - Todas las interacciones (para reportes)
export async function GET() {
  try {
    const interactions = await Interaction.findAll({
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'nombre', 'tipo_evento'] },
      ],
      order: [['fecha', 'DESC']],
    });

    return NextResponse.json(interactions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
