import { NextResponse } from 'next/server';
const sequelize = require('@/lib/models/index');
const { EventService } = require('@/lib/models/associations');
const { aplicarCombo, RESERVAR, LIBERAR, ENTREGAR } = require('@/lib/stockServer');

// PUT /api/event-services/:id — editar servicio. Maneja reservas de stock del combo:
//   estado Entregado → descuenta y libera | Cancelado → libera | cambio de combo → re-reserva.
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const svc = await EventService.findByPk(id);
    if (!svc) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

    const body = await request.json();

    await sequelize.transaction(async (t) => {
      const meta = { ...(svc.metadata || {}) };
      const nuevoEstado = body.estado ?? svc.estado;
      const yaEntregado = meta.stock_estado === 'entregado';
      const comboCambia = ('combo_id' in body) && (body.combo_id || null) !== (svc.combo_id || null);

      if (nuevoEstado === 'Entregado' && meta.stock_estado === 'reservado' && svc.combo_id) {
        await aplicarCombo(t, { eventId: svc.event_id, comboId: svc.combo_id, movimientos: ENTREGAR });
        meta.stock_estado = 'entregado';
      } else if (nuevoEstado === 'Cancelado' && meta.stock_estado === 'reservado' && svc.combo_id) {
        await aplicarCombo(t, { eventId: svc.event_id, comboId: svc.combo_id, movimientos: LIBERAR });
        meta.stock_estado = 'liberado';
      } else if (comboCambia && !yaEntregado) {
        if (svc.combo_id && meta.stock_estado === 'reservado') {
          await aplicarCombo(t, { eventId: svc.event_id, comboId: svc.combo_id, movimientos: LIBERAR });
        }
        if (body.combo_id) {
          await aplicarCombo(t, { eventId: svc.event_id, comboId: body.combo_id, movimientos: RESERVAR });
          meta.stock_estado = 'reservado';
        } else {
          meta.stock_estado = 'liberado';
        }
      }

      const update = { metadata: meta };
      for (const f of ['estado', 'total_contratado', 'combo_id', 'observaciones']) {
        if (f in body) update[f] = body[f];
      }
      await svc.update(update, { transaction: t });
    });

    return NextResponse.json(svc);
  } catch (error) {
    const status = /no encontrado|insuficiente/.test(error.message) ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

// DELETE /api/event-services/:id — quita el servicio (libera reserva si la tenía).
// Los pagos asociados quedan sin asignar (FK ON DELETE SET NULL).
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const svc = await EventService.findByPk(id);
    if (!svc) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

    await sequelize.transaction(async (t) => {
      const meta = svc.metadata || {};
      if (svc.combo_id && meta.stock_estado === 'reservado') {
        await aplicarCombo(t, { eventId: svc.event_id, comboId: svc.combo_id, movimientos: LIBERAR });
      }
      await svc.destroy({ transaction: t });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
