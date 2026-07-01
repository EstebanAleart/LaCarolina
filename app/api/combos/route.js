import { NextResponse } from 'next/server';
const { Combo, ComboProduct, Product } = require('@/lib/models/associations');

// GET /api/combos — combos con su composición (productos + cantidades)
export async function GET() {
  try {
    const combos = await Combo.findAll({
      include: [{
        model: ComboProduct,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo', 'unidad'] }],
      }],
      order: [['numero', 'ASC']],
    });
    return NextResponse.json(combos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
