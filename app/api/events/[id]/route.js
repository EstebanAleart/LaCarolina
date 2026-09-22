import { NextResponse } from 'next/server';
const { Event, Task } = require('@/lib/models/associations');
const { hoyISO } = require('@/lib/alerts');
const { ESTADOS_EVENTO, crearTareasPostEvento } = require('@/lib/automations');

const fechaISO = (d) => (d ? new Date(d).toISOString().substring(0, 10) : null);

// PUT /api/events/:id - Actualizar evento
// E15-06: "Evento realizado" no se puede marcar antes de la fecha del evento (lo hace el sistema al pasar
// la fecha). "Post-evento / cerrado" solo desde "Evento realizado". Al pasar a realizado se crean las
// tareas post-evento (E15-07).
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const event = await Event.findByPk(id);
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const nuevo = body.estado_operativo;
    if (nuevo && nuevo !== event.estado_operativo) {
      const hoy = hoyISO();
      const fecha = fechaISO(event.fecha_confirmada);
      if (nuevo === ESTADOS_EVENTO.REALIZADO && fecha && fecha >= hoy) {
        return NextResponse.json(
          { error: `No se puede marcar como realizado antes de la fecha del evento (${fecha}). El sistema lo hace solo al día siguiente.` },
          { status: 400 }
        );
      }
      if (nuevo === ESTADOS_EVENTO.CERRADO && event.estado_operativo !== ESTADOS_EVENTO.REALIZADO) {
        return NextResponse.json({ error: 'Solo se puede cerrar un evento que ya está realizado.' }, { status: 400 });
      }
    }

    await event.update(body);

    if (nuevo === ESTADOS_EVENTO.REALIZADO) {
      await crearTareasPostEvento({ Task }, event);
    }

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
