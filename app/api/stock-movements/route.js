import { NextResponse } from 'next/server';
const sequelize = require('@/lib/models/index');
const { StockMovement, Product } = require('@/lib/models/associations');
const { applyMovement } = require('@/lib/stock');

// GET /api/stock-movements?product_id=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const where = {};
    if (productId) where.product_id = productId;

    const movs = await StockMovement.findAll({
      where,
      include: [{ model: Product, as: 'product', attributes: ['id', 'nombre', 'codigo'] }],
      order: [['created_at', 'DESC']],
    });
    return NextResponse.json(movs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/stock-movements — crea el asiento y actualiza la proyección del producto (atómico)
export async function POST(request) {
  try {
    const body = await request.json();
    const { product_id, tipo, cantidad, event_id, combo_id, observacion, created_by_user_id } = body;
    if (!product_id) return NextResponse.json({ error: 'product_id es requerido' }, { status: 400 });

    const movement = await sequelize.transaction(async (t) => {
      const product = await Product.findByPk(product_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product) throw new Error('Producto no encontrado');

      const { field, delta, stock_actual, stock_reservado } = applyMovement(product, tipo, cantidad);
      await product.update({ [field]: field === 'stock_actual' ? stock_actual : stock_reservado }, { transaction: t });

      return StockMovement.create({
        product_id,
        tipo,
        cantidad: delta,
        event_id: event_id || null,
        combo_id: combo_id || null,
        observacion: observacion || null,
        created_by_user_id: created_by_user_id || null,
      }, { transaction: t });
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    const status = /no encontrado|negativo|tipo inválido|distinta de 0/.test(error.message) ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
