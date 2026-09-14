const { cobradoDe, saldoServicio, resumenEvento } = require('@/lib/services');

const pago = (monto, estado = 'confirmado', tipo = 'pago_parcial') => ({ monto, estado, tipo });

describe('saldos por servicio', () => {
  test('cobrado solo cuenta confirmados; devolución resta', () => {
    expect(cobradoDe([pago(100), pago(50, 'pendiente'), pago(30, 'confirmado', 'devolucion')])).toBe(70);
  });

  test('saldo de un servicio = total − cobrado', () => {
    const r = saldoServicio({ total_contratado: 1000, payments: [pago(400), pago(100)] });
    expect(r).toEqual({ total: 1000, cobrado: 500, saldo: 500 });
  });

  test('saldos NO se mezclan entre servicios', () => {
    const salon = { id: 'a', total_contratado: 1000, payments: [pago(1000)] };       // saldado
    const cotillon = { id: 'b', total_contratado: 200, payments: [pago(50)] };        // debe 150
    const r = resumenEvento([salon, cotillon]);
    expect(r.porServicio.find(s => s.id === 'a').saldo).toBe(0);
    expect(r.porServicio.find(s => s.id === 'b').saldo).toBe(150);
  });

  test('consolidado = suma de totales − todo lo cobrado (incluye sin asignar)', () => {
    const salon = { id: 'a', total_contratado: 1000, payments: [pago(600)] };
    const cotillon = { id: 'b', total_contratado: 200, payments: [pago(200)] };
    const sinAsignar = [pago(100)];
    const r = resumenEvento([salon, cotillon], sinAsignar);
    expect(r.totalContratado).toBe(1200);
    expect(r.cobradoTotal).toBe(900);      // 600 + 200 + 100
    expect(r.cobradoSinAsignar).toBe(100);
    expect(r.saldoTotal).toBe(300);
  });
});
