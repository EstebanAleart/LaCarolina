import { NextResponse } from 'next/server';
const { Reservation } = require('@/lib/models/associations');

// GET /api/reservations - Todas las reservas
export async function GET() {
  try {
    const reservations = await Reservation.findAll({
      include: [
        { association: 'lead' },
        { association: 'calendar_date' },
      ],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/reservations - Crear reserva
export async function POST(request) {
  try {
    const body = await request.json();

    // Regla: un lead solo puede tener una reserva
    const existing = await Reservation.findOne({
      where: { lead_id: body.lead_id },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Este lead ya tiene una reserva' },
        { status: 409 }
      );
    }

    const reservation = await Reservation.create({
      lead_id: body.lead_id,
      calendar_date_id: body.calendar_date_id || null,
      monto_senia: body.monto_senia || 0,
      fecha_pago: body.fecha_pago || new Date(),
      metodo_pago: body.metodo_pago || 'Efectivo',
      comprobante_url: body.comprobante_url || '',
      estado: 'Pendiente',
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
