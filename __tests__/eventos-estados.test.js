/**
 * E15-06 / E15-07: estados del evento por fecha y tareas post-evento.
 */
const { Op } = require('sequelize');
const { actualizarEstadosEventos, crearTareasPostEvento, ESTADOS_EVENTO: EV } = require('@/lib/automations');

jest.mock('@/lib/models/associations', () => require('./__mocks__/models'));
const { PUT } = require('../app/api/events/[id]/route');
const models = require('./__mocks__/models');

const mk = (over = {}) => ({ id: 'evt-1', lead_id: 'lead-1', fecha_confirmada: '2026-09-10', estado_operativo: EV.PLAN, update: jest.fn().mockResolvedValue(true), ...over });

beforeEach(() => jest.clearAllMocks());

describe('actualizarEstadosEventos', () => {
  test('fecha pasada en planificación/próximo → Evento realizado + tareas post-evento', async () => {
    const ev = mk({ estado_operativo: EV.PROXIMO });
    const Event = { findAll: jest.fn().mockResolvedValueOnce([ev]).mockResolvedValueOnce([]), update: jest.fn().mockResolvedValue([0]) };
    const Task = { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({}), findAll: jest.fn().mockResolvedValue([]) };

    const n = await actualizarEstadosEventos({ Event, Task }, '2026-09-14');

    expect(n).toBe(1);
    expect(ev.update).toHaveBeenCalledWith({ estado_operativo: EV.REALIZADO });
    expect(Task.create).toHaveBeenCalledTimes(5);
    const titulos = Task.create.mock.calls.map((c) => c[0].titulo);
    expect(titulos).toEqual([
      '[Post-evento] Verificar saldos',
      '[Post-evento] Verificar devoluciones',
      '[Post-evento] Registrar incidencias y observaciones',
      '[Post-evento] Mensaje de agradecimiento',
      '[Post-evento] Pedir feedback y reseña de Google',
    ]);
    // plazos desde la fecha del evento: agradecimiento +1, feedback +2
    const due = Task.create.mock.calls.map((c) => c[0].due_date.toISOString().substring(0, 10));
    expect(due).toEqual(['2026-09-10', '2026-09-10', '2026-09-10', '2026-09-11', '2026-09-12']);
    expect(Task.create.mock.calls[0][0]).toEqual(expect.objectContaining({ evento_id: 'evt-1', lead_id: 'lead-1', estado: 'Pendiente' }));
  });

  test('en planificación a ≤30 días → Próximo evento (UPDATE con ventana hoy..hoy+30)', async () => {
    const Event = { findAll: jest.fn().mockResolvedValue([]), update: jest.fn().mockResolvedValue([3]) };
    const Task = { count: jest.fn(), create: jest.fn(), findAll: jest.fn().mockResolvedValue([]) };

    await actualizarEstadosEventos({ Event, Task }, '2026-09-14');

    const [values, opts] = Event.update.mock.calls[0];
    expect(values).toEqual({ estado_operativo: EV.PROXIMO });
    expect(opts.where.estado_operativo).toBe(EV.PLAN);
    expect(opts.where.fecha_confirmada[Op.gte]).toEqual(new Date('2026-09-14T00:00:00Z'));
    expect(opts.where.fecha_confirmada[Op.lte]).toEqual(new Date('2026-10-14T00:00:00Z'));
  });

  test('realizado con todas las tareas post-evento Hecho/Cancelado → Post-evento / cerrado; con una pendiente no cierra', async () => {
    const listo = mk({ id: 'evt-listo', estado_operativo: EV.REALIZADO });
    const pendiente = mk({ id: 'evt-pend', estado_operativo: EV.REALIZADO });
    const Event = { findAll: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([listo, pendiente]), update: jest.fn().mockResolvedValue([0]) };
    const Task = {
      count: jest.fn(), create: jest.fn(),
      findAll: jest.fn().mockResolvedValue([
        { evento_id: 'evt-listo', titulo: '[Post-evento] A', estado: 'Hecho' },
        { evento_id: 'evt-listo', titulo: '[Post-evento] B', estado: 'Cancelado' },
        { evento_id: 'evt-pend', titulo: '[Post-evento] A', estado: 'Hecho' },
        { evento_id: 'evt-pend', titulo: '[Post-evento] B', estado: 'Pendiente' },
      ]),
    };

    await actualizarEstadosEventos({ Event, Task }, '2026-09-14');

    expect(listo.update).toHaveBeenCalledWith({ estado_operativo: EV.CERRADO });
    expect(pendiente.update).not.toHaveBeenCalled();
  });

  test('si falla no rompe el listado: devuelve 0', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Event = { findAll: jest.fn().mockRejectedValue(new Error('db down')), update: jest.fn() };
    await expect(actualizarEstadosEventos({ Event, Task: {} }, '2026-09-14')).resolves.toBe(0);
    spy.mockRestore();
  });
});

describe('crearTareasPostEvento', () => {
  test('es idempotente: si el evento ya tiene tareas post-evento no crea más', async () => {
    const Task = { count: jest.fn().mockResolvedValue(5), create: jest.fn() };
    const n = await crearTareasPostEvento({ Task }, mk());
    expect(n).toBe(0);
    expect(Task.create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/events/:id (estado manual)', () => {
  const req = (body) => ({ json: jest.fn().mockResolvedValue(body) });
  const params = (id) => ({ params: { id } });

  test('no permite "Evento realizado" antes de la fecha', async () => {
    models.Event.findByPk.mockResolvedValue(mk({ fecha_confirmada: '2099-01-01' }));
    const res = await PUT(req({ estado_operativo: EV.REALIZADO }), params('evt-1'));
    expect(res.status).toBe(400);
  });

  test('permite "Evento realizado" después de la fecha y crea las tareas post-evento', async () => {
    const ev = mk({ fecha_confirmada: '2020-01-01' });
    models.Event.findByPk.mockResolvedValue(ev);
    models.Task.count.mockResolvedValue(0);
    models.Task.create.mockResolvedValue({});
    const res = await PUT(req({ estado_operativo: EV.REALIZADO }), params('evt-1'));
    expect(res.status).toBe(200);
    expect(ev.update).toHaveBeenCalledWith({ estado_operativo: EV.REALIZADO });
    expect(models.Task.create).toHaveBeenCalledTimes(5);
  });

  test('no permite cerrar si no está realizado', async () => {
    models.Event.findByPk.mockResolvedValue(mk({ estado_operativo: EV.PROXIMO }));
    const res = await PUT(req({ estado_operativo: EV.CERRADO }), params('evt-1'));
    expect(res.status).toBe(400);
  });

  test('otros cambios (p. ej. En planificación → Próximo evento) pasan', async () => {
    const ev = mk();
    models.Event.findByPk.mockResolvedValue(ev);
    const res = await PUT(req({ estado_operativo: EV.PROXIMO }), params('evt-1'));
    expect(res.status).toBe(200);
    expect(ev.update).toHaveBeenCalledWith({ estado_operativo: EV.PROXIMO });
    expect(models.Task.create).not.toHaveBeenCalled();
  });
});
