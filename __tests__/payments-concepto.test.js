jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));

const { POST } = require('../app/api/payments/route');
const models = require('./__mocks__/models');

test('POST /api/payments guarda el concepto (antes se descartaba)', async () => {
  models.Payment.create.mockResolvedValue({ id: 'p1', estado: 'pendiente' });
  const req = { json: jest.fn().mockResolvedValue({ event_id: 'e1', monto: 150000, tipo: 'seña', concepto: 'Tarjeta', estado: 'pendiente' }) };

  const res = await POST(req);

  expect(res.status).toBe(201);
  expect(models.Payment.create).toHaveBeenCalledWith(expect.objectContaining({ concepto: 'Tarjeta', monto: 150000 }));
});
