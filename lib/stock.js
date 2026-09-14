// Lógica pura de proyección de stock (sin DB), testeable y reutilizable.
// stock_movements es el libro mayor; products.stock_actual/reservado son proyecciones.

const TIPOS = ['ingreso', 'egreso', 'reserva', 'liberacion', 'ajuste'];

// Signo de la cantidad según tipo (robusto ante el signo que mande la UI).
// ingreso/reserva: +   egreso/liberacion: -   ajuste: tal cual (+/-)
function signed(tipo, cantidad) {
  const n = Math.abs(Number(cantidad));
  if (tipo === 'egreso' || tipo === 'liberacion') return -n;
  if (tipo === 'ajuste') return Number(cantidad);
  return n; // ingreso, reserva
}

// Aplica un movimiento sobre la proyección de un producto.
// Devuelve { field, delta, stock_actual, stock_reservado } o lanza si quedaría negativo.
function applyMovement(product, tipo, cantidad) {
  if (!TIPOS.includes(tipo)) throw new Error(`tipo inválido (${TIPOS.join(', ')})`);
  const delta = signed(tipo, cantidad);
  if (!delta) throw new Error('cantidad debe ser distinta de 0');

  const actual = product.stock_actual || 0;
  const reservado = product.stock_reservado || 0;
  const field = (tipo === 'reserva' || tipo === 'liberacion') ? 'stock_reservado' : 'stock_actual';
  const nuevo = (field === 'stock_reservado' ? reservado : actual) + delta;
  if (nuevo < 0) throw new Error(`El movimiento dejaría ${field} en negativo (${nuevo})`);

  return {
    field,
    delta,
    stock_actual: field === 'stock_actual' ? nuevo : actual,
    stock_reservado: field === 'stock_reservado' ? nuevo : reservado,
  };
}

module.exports = { TIPOS, signed, applyMovement };
