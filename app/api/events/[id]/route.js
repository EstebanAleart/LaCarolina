import { NextResponse } from 'next/server';
const { Event } = require('@/lib/models/associations');

// PUT /api/events/:id - Actualizar evento
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const event = await Event.findByPk(id);
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    await event.update(body);

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
