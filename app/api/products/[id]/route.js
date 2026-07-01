import { NextResponse } from 'next/server';
const sequelize = require('@/lib/models/index');
const { Product, StockMovement } = require('@/lib/models/associations');

// PUT /api/products/:id — editar producto (metadata + stock actual a mano).
// Si cambia stock_actual, se registra un movimiento 'ajuste' por la diferencia,
// para que el libro mayor (stock_movements) siempre cuadre con la proyección.
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const product = await Product.findByPk(id);
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const body = await request.json();
    const campos = ['nombre', 'codigo', 'categoria', 'unidad', 'stock_minimo', 'activo'];
    const update = {};
    for (const c of campos) if (c in body) update[c] = body[c];

    let nuevoStock = null;
    if ('stock_actual' in body) {
      nuevoStock = Number(body.stock_actual);
      if (Number.isNaN(nuevoStock) || nuevoStock < 0) {
        return NextResponse.json({ error: 'stock_actual inválido' }, { status: 400 });
      }
    }

    await sequelize.transaction(async (t) => {
      if (nuevoStock !== null && nuevoStock !== product.stock_actual) {
        const delta = nuevoStock - product.stock_actual;
        update.stock_actual = nuevoStock;
        await StockMovement.create({
          product_id: id,
          tipo: 'ajuste',
          cantidad: delta,
          observacion: body.ajuste_observacion || 'Ajuste manual de stock',
        }, { transaction: t });
      }
      await product.update(update, { transaction: t });
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
