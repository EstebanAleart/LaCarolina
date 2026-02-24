import { NextResponse } from 'next/server';
const { Payment, Event, Lead } = require('@/lib/models/associations');
const { Op } = require('sequelize');

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

// GET /api/payments - Listar todos los pagos
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    const where = {};
    if (eventId) where.event_id = eventId;

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Event,
          as: 'event',
          include: [{ model: Lead, as: 'lead', attributes: ['id', 'nombre', 'tipo_evento'] }],
          attributes: ['id', 'fecha_confirmada', 'tipo_evento', 'valor_total_evento', 'estado_pago'],
        },
      ],
      order: [['fecha_pago', 'DESC']],
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/payments - Crear nuevo pago
export async function POST(request) {
  try {
    const body = await request.json();
    const { event_id, lead_id, monto, tipo, metodo_pago, fecha_pago, estado, observacion, created_by_user_id } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id es requerido' }, { status: 400 });
    }
    if (!monto || monto <= 0) {
      return NextResponse.json({ error: 'monto debe ser mayor a 0' }, { status: 400 });
    }

    const payment = await Payment.create({
      event_id,
      lead_id: lead_id || null,
      monto,
      tipo: tipo || 'pago_parcial',
      metodo_pago: metodo_pago || 'efectivo',
      fecha_pago: fecha_pago || new Date().toISOString().substring(0, 10),
      estado: estado || 'pendiente',
      observacion: observacion || null,
      created_by_user_id: created_by_user_id || null,
    });

    // Si se crea como confirmado directo, recalcular estado_pago del evento
    if (payment.estado === 'confirmado') {
      await recalcularEstadoPago(event_id);
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
