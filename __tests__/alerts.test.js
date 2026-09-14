const { diasHasta, bucketDe, hoyISO, fechaISO } = require('@/lib/alerts');

describe('alertas', () => {
  const hoy = new Date('2026-06-30T10:00:00Z');

  test('días hasta el evento', () => {
    expect(diasHasta('2026-06-30', hoy)).toBe(0);
    expect(diasHasta('2026-07-07', hoy)).toBe(7);
    expect(diasHasta('2026-06-25', hoy)).toBe(-5);
  });

  test('acepta Date (lo que devuelve Sequelize) y string ISO del API', () => {
    expect(diasHasta(new Date('2026-07-07T00:00:00Z'), hoy)).toBe(7);
    expect(diasHasta('2026-07-07T00:00:00.000Z', hoy)).toBe(7);
    expect(diasHasta('2026-07-07', '2026-06-30')).toBe(7);
    expect(fechaISO(new Date('2026-07-07T00:00:00Z'))).toBe('2026-07-07');
  });

  test('hoy es el día de Argentina, no el de UTC', () => {
    const nocheAR = new Date('2026-07-01T02:30:00Z'); // 30/06 23:30 en Argentina
    expect(hoyISO(nocheAR)).toBe('2026-06-30');
    expect(diasHasta('2026-07-01', nocheAR)).toBe(1);
  });

  test('bucket por días restantes', () => {
    expect(bucketDe(-3)).toBe('vencido');
    expect(bucketDe(0)).toBe('vencido');
    expect(bucketDe(5)).toBe('d7');
    expect(bucketDe(12)).toBe('d15');
    expect(bucketDe(25)).toBe('d30');
    expect(bucketDe(45)).toBe(null); // fuera de rango
    expect(bucketDe(NaN)).toBe(null);
  });
});
