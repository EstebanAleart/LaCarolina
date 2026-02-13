import { NextResponse } from 'next/server';
import { listGoogleEvents } from '@/lib/googleCalendar';
const { CalendarDate } = require('@/lib/models/associations');

// POST /api/google-calendar/webhook - Recibe push notifications de Google Calendar
export async function POST(request) {
  try {
    const resourceState = request.headers.get('x-goog-resource-state');

    // Handshake inicial de Google
    if (resourceState === 'sync') {
      return NextResponse.json({ ok: true });
    }

    // Solo procesar cuando hay cambios
    if (resourceState !== 'exists') {
      return NextResponse.json({ ok: true });
    }

    // Buscar eventos actualizados en los ultimos 5 minutos
    const updatedMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { items } = await listGoogleEvents({
      updatedMin,
      showDeleted: true,
    });

    for (const gEvent of items) {
      const carolinaId = gEvent.extendedProperties?.private?.carolinaId;
      const isDeleted = gEvent.status === 'cancelled';

      if (carolinaId) {
        // Evento que fue creado desde nuestra app
        const record = await CalendarDate.findByPk(carolinaId);
        if (!record) continue;

        if (isDeleted) {
          // Eliminado en Google → liberar en nuestra DB
          await record.update({
            estado_fecha: 'Disponible',
            lead_id: null,
            google_event_id: null,
            nota: (record.nota || '') + ' [Liberado desde Google Calendar]',
          });
        } else {
          // Actualizado en Google → actualizar fecha si cambio
          const googleFecha = gEvent.start?.date || (gEvent.start?.dateTime ? gEvent.start.dateTime.substring(0, 10) : null);
          if (googleFecha && googleFecha !== record.fecha?.toString().substring(0, 10)) {
            // La fecha cambio en Google - buscar si ya existe esa fecha en DB
            const existingDate = await CalendarDate.findOne({ where: { fecha: googleFecha } });
            if (!existingDate) {
              await record.update({ fecha: googleFecha });
            }
          }
        }
      } else if (!isDeleted) {
        // Evento creado directamente en Google (sin carolinaId)
        const googleFecha = gEvent.start?.date || (gEvent.start?.dateTime ? gEvent.start.dateTime.substring(0, 10) : null);
        if (!googleFecha) continue;

        // Verificar si ya existe un CalendarDate para esa fecha
        const existing = await CalendarDate.findOne({ where: { fecha: googleFecha } });
        if (existing) {
          // Ya existe, asociar google_event_id si no tiene
          if (!existing.google_event_id) {
            await existing.update({ google_event_id: gEvent.id });
          }
        } else {
          // Crear CalendarDate como Bloqueada
          await CalendarDate.create({
            fecha: googleFecha,
            estado_fecha: 'Bloqueada',
            fuente: 'Google Calendar',
            nota: gEvent.summary || '',
            google_event_id: gEvent.id,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, processed: items.length });
  } catch (error) {
    console.error('Webhook error:', error.message);
    // Siempre devolver 200 a Google para evitar retries infinitos
    return NextResponse.json({ ok: false, error: error.message });
  }
}
