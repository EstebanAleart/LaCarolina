const { applyMovement } = require('@/lib/stock');

// Invariantes de stock (proyección pura, sin DB).
describe('stock applyMovement', () => {
  test('ingreso suma a stock_actual', () => {
    const r = applyMovement({ stock_actual: 0, stock_reservado: 0 }, 'ingreso', 200);
    expect(r.stock_actual).toBe(200);
    expect(r.stock_reservado).toBe(0);
  });

  test('egreso resta de stock_actual (signo robusto aunque venga positivo)', () => {
    expect(applyMovement({ stock_actual: 200, stock_reservado: 0 }, 'egreso', 50).stock_actual).toBe(150);
  });

  test('reserva mueve stock_reservado, no actual', () => {
    const r = applyMovement({ stock_actual: 200, stock_reservado: 0 }, 'reserva', 200);
    expect(r.stock_actual).toBe(200);
    expect(r.stock_reservado).toBe(200);
  });

  test('reservar y completar evento (egreso + liberacion) → actual 0, reservado 0', () => {
    let p = { stock_actual: 200, stock_reservado: 0 };
    p = { ...p, ...applyMovement(p, 'reserva', 200) };
    expect(p.stock_reservado).toBe(200);
    p = { ...p, ...applyMovement(p, 'egreso', 200) };
    p = { ...p, ...applyMovement(p, 'liberacion', 200) };
    expect(p.stock_actual).toBe(0);
    expect(p.stock_reservado).toBe(0);
  });

  test('cancelar antes del evento: liberacion devuelve la reserva, actual intacto', () => {
    const r = applyMovement({ stock_actual: 200, stock_reservado: 200 }, 'liberacion', 200);
    expect(r.stock_reservado).toBe(0);
    expect(r.stock_actual).toBe(200);
  });

  test('no permite dejar stock en negativo', () => {
    expect(() => applyMovement({ stock_actual: 10, stock_reservado: 0 }, 'egreso', 50)).toThrow(/negativo/);
  });

  test('ajuste acepta cantidad negativa', () => {
    expect(applyMovement({ stock_actual: 10, stock_reservado: 0 }, 'ajuste', -3).stock_actual).toBe(7);
  });

  test('tipo inválido y cantidad 0 fallan', () => {
    expect(() => applyMovement({ stock_actual: 0 }, 'foo', 1)).toThrow(/tipo inválido/);
    expect(() => applyMovement({ stock_actual: 0 }, 'ingreso', 0)).toThrow(/distinta de 0/);
  });
});
