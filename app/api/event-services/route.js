import { NextResponse } from 'next/server';
const sequelize = require('@/lib/models/index');
const { EventService, ServiceType, Combo, Payment } = require('@/lib/models/associations');
const { aplicarCombo, RESERVAR } = require('@/lib/stockServer');

const INCLUDE = [
  { model: ServiceType, as: 'service_type' },
  { model: Combo, as: 'combo', attributes: ['id', 'numero', 'nombre', 'precio'] },
  { model: Payment, as: 'payments' },
];

// GET /api/event-services?event_id=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const where = {};
    if (eventId) where.event_id = eventId;
    const rows = await EventService.findAll({ where, include: INCLUDE, order: [['created_at', 'ASC']] });
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/event-services — agrega un servicio a un evento. Si trae combo, reserva stock.
export async function POST(request) {
  try {
    const body = await request.json();
    const { event_id, service_type_id } = body;
    if (!event_id || !service_type_id) {
      return NextResponse.json({ error: 'event_id y service_type_id son requeridos' }, { status: 400 });
    }

    const created = await sequelize.transaction(async (t) => {
      const meta = body.metadata || {};
      if (body.combo_id) meta.stock_estado = 'reservado';
      const svc = await EventService.create({
        event_id,
        service_type_id,
        estado: body.estado || 'Contratado',
        total_contratado: body.total_contratado || 0,
        combo_id: body.combo_id || null,
        metadata: meta,
        observaciones: body.observaciones || null,
      }, { transaction: t });

      if (body.combo_id) {
        await aplicarCombo(t, { eventId: event_id, comboId: body.combo_id, movimientos: RESERVAR });
      }
      return svc;
    });

    const full = await EventService.findByPk(created.id, { include: INCLUDE });
    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    const status = /requeridos|insuficiente/.test(error.message) ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
