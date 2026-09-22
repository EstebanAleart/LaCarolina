const { Op } = require('sequelize');
const { cerrarEventosVencidos } = require('@/lib/automations');

describe('cerrarEventosVencidos', () => {
  test('pasa a Realizado los eventos con fecha anterior a hoy que no estén Realizado/Cancelado', async () => {
    const Event = { update: jest.fn().mockResolvedValue([36]) };
    const n = await cerrarEventosVencidos(Event, '2026-09-14');

    expect(n).toBe(36);
    const [values, opts] = Event.update.mock.calls[0];
    expect(values).toEqual({ estado_operativo: 'Realizado' });
    // estricto: el evento de HOY (00:00Z) no se cierra, el de ayer sí
    expect(opts.where.fecha_confirmada[Op.lt]).toEqual(new Date('2026-09-14T00:00:00Z'));
    expect(opts.where[Op.or][1].estado_operativo[Op.notIn]).toEqual(['Realizado', 'Cancelado']);
  });
});

test('si el UPDATE falla, no tira el GET: devuelve 0', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const Event = { update: jest.fn().mockRejectedValue(new Error('db down')) };
  await expect(cerrarEventosVencidos(Event, '2026-09-14')).resolves.toBe(0);
  spy.mockRestore();
});
