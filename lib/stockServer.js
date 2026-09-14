// Helpers de stock que tocan la DB (combos ↔ reservas), para usar dentro de una transacción.
// La lógica pura de signos vive en lib/stock.js; acá aplicamos sobre todos los
// productos de un combo (reservar al contratar, liberar al cancelar, egresar al entregar).
const { Product, ComboProduct, StockMovement } = require('./models/associations');

// movimientos: [{ tipo, field, sign }] — se aplican a cada producto del combo (cantidad × sign).
async function aplicarCombo(t, { eventId, comboId, movimientos }) {
  if (!comboId) return;
  const items = await ComboProduct.findAll({ where: { combo_id: comboId }, transaction: t });
  for (const it of items) {
    const product = await Product.findByPk(it.product_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!product) continue;
    for (const m of movimientos) {
      const delta = m.sign * it.cantidad;
      const nuevo = (product[m.field] || 0) + delta;
      if (nuevo < 0) throw new Error(`Stock insuficiente: ${product.nombre} (${m.field} quedaría en ${nuevo})`);
      await product.update({ [m.field]: nuevo }, { transaction: t });
      await StockMovement.create({
        product_id: it.product_id, tipo: m.tipo, cantidad: delta,
        event_id: eventId || null, combo_id: comboId,
      }, { transaction: t });
    }
  }
}

// Contratar combo: reserva stock (no descuenta).
const RESERVAR = [{ tipo: 'reserva', field: 'stock_reservado', sign: 1 }];
// Cancelar/cambiar: libera la reserva.
const LIBERAR = [{ tipo: 'liberacion', field: 'stock_reservado', sign: -1 }];
// Entregar (evento realizado): descuenta del stock real y libera la reserva.
const ENTREGAR = [
  { tipo: 'egreso', field: 'stock_actual', sign: -1 },
  { tipo: 'liberacion', field: 'stock_reservado', sign: -1 },
];

module.exports = { aplicarCombo, RESERVAR, LIBERAR, ENTREGAR };
