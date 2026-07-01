const { diasHasta, bucketDe } = require('@/lib/alerts');

describe('alertas', () => {
  const hoy = new Date('2026-06-30T10:00:00Z');

  test('días hasta el evento', () => {
    expect(diasHasta('2026-06-30', hoy)).toBe(0);
    expect(diasHasta('2026-07-07', hoy)).toBe(7);
    expect(diasHasta('2026-06-25', hoy)).toBe(-5);
  });

  test('bucket por días restantes', () => {
    expect(bucketDe(-3)).toBe('vencido');
    expect(bucketDe(0)).toBe('vencido');
    expect(bucketDe(5)).toBe('d7');
    expect(bucketDe(12)).toBe('d15');
    expect(bucketDe(25)).toBe('d30');
    expect(bucketDe(45)).toBe(null); // fuera de rango
  });
});
