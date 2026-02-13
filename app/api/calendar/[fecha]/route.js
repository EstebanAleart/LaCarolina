import { NextResponse } from 'next/server';
import { deleteGoogleEvent } from '@/lib/googleCalendar';
const { CalendarDate, Reservation } = require('@/lib/models/associations');

// DELETE /api/calendar/:fecha - Liberar/eliminar una fecha
export async function DELETE(request, { params }) {
  try {
    const { fecha } = await params;

    // Buscar por fecha exacta o por substring (por si hay timestamp)
    let record = await CalendarDate.findOne({ where: { fecha } });

    if (!record) {
      // Fallback: buscar todas y comparar por substring YYYY-MM-DD
      const all = await CalendarDate.findAll();
      record = all.find(d => d.fecha && d.fecha.toString().substring(0, 10) === fecha);
    }

    if (!record) {
      return NextResponse.json({ error: 'Fecha no encontrada' }, { status: 404 });
    }

    // Sync: eliminar de Google Calendar si existe
    if (record.google_event_id) {
      try { await deleteGoogleEvent(record.google_event_id); } catch (e) { console.error('Google delete error:', e.message); }
    }

    // Limpiar reservations que referencian este calendar_date
    await Reservation.destroy({ where: { calendar_date_id: record.id } });

    await record.destroy();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
