import { NextResponse } from 'next/server';
const { Payment, Event } = require('@/lib/models/associations');

// Helper: recalcular event.estado_pago a partir de los pagos confirmados
async function recalcularEstadoPago(eventId) {
  const event = await Event.findByPk(eventId);
  if (!event) return;

  const pagos = await Payment.findAll({
    where: { event_id: eventId, estado: 'confirmado' },
  });

  let totalCobrado = 0;
  for (const p of pagos) {
    if (p.tipo === 'devolucion') {
      totalCobrado -= p.monto;
    } else {
      totalCobrado += p.monto;
    }
  }

  let nuevoEstado = 'Pendiente';
  const total = event.valor_total_evento || 0;
  if (totalCobrado > 0 && totalCobrado < total) {
    nuevoEstado = 'Parcial';
  } else if (total > 0 && totalCobrado >= total) {
    nuevoEstado = 'Completo';
  }

  await event.update({ estado_pago: nuevoEstado });
}

// PUT /api/payments/:id - Solo actualizar estado (inmutabilidad: no editar monto/tipo)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    const estadosValidos = ['pendiente', 'confirmado', 'anulado'];
    if (body.estado && !estadosValidos.includes(body.estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    // Solo se permite cambiar el estado y observacion
    const updates = {};
    if (body.estado) updates.estado = body.estado;
    if (body.observacion !== undefined) updates.observacion = body.observacion;

    await payment.update(updates);

    // Recalcular estado_pago del evento siempre que cambie el estado del pago
    await recalcularEstadoPago(payment.event_id);

    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
