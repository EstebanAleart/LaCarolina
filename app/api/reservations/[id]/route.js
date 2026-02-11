import { NextResponse } from 'next/server';
const { Reservation } = require('@/lib/models/associations');

// PUT /api/reservations/:id - Actualizar reserva
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    await reservation.update(body);

    return NextResponse.json(reservation);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
