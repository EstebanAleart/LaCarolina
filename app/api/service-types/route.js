import { NextResponse } from 'next/server';
const { ServiceType } = require('@/lib/models/associations');

// GET /api/service-types — catálogo parametrizable de tipos de servicio
export async function GET() {
  try {
    const tipos = await ServiceType.findAll({ where: { activo: true }, order: [['orden', 'ASC']] });
    return NextResponse.json(tipos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
