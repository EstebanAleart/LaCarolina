import { NextResponse } from 'next/server';
const { Product } = require('@/lib/models/associations');

// Proyección de stock disponible + flag de bajo mínimo
function withComputed(p) {
  const o = p.toJSON ? p.toJSON() : p;
  const disponible = (o.stock_actual || 0) - (o.stock_reservado || 0);
  const minimo = o.stock_minimo || 0;
  // Solo alertamos si hay un mínimo DEFINIDO (>0); con mínimo 0 no se marca.
  return { ...o, stock_disponible: disponible, bajo_minimo: minimo > 0 && disponible <= minimo };
}

// GET /api/products
export async function GET() {
  try {
    const products = await Product.findAll({ order: [['categoria', 'ASC'], ['nombre', 'ASC']] });
    return NextResponse.json(products.map(withComputed));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.nombre) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
    }
    const product = await Product.create({
      nombre: body.nombre,
      codigo: body.codigo || null,
      categoria: body.categoria || null,
      unidad: body.unidad || 'unidad',
      stock_actual: body.stock_actual || 0,
      stock_minimo: body.stock_minimo || 0,
      stock_reservado: body.stock_reservado || 0,
    });
    return NextResponse.json(withComputed(product), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
