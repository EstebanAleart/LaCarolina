import { NextResponse } from 'next/server';
const { Proposal } = require('@/lib/models/associations');

// GET /api/proposals - Todas las propuestas
export async function GET() {
  try {
    const proposals = await Proposal.findAll({
      include: [
        { association: 'lead' },
        { association: 'creator' },
      ],
      order: [['created_at', 'DESC']],
    });

    return NextResponse.json(proposals);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
