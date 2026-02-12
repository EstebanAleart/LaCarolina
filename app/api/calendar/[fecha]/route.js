import { NextResponse } from 'next/server';
const { CalendarDate } = require('@/lib/models/associations');
let deleteGoogleEvent;
try {
  deleteGoogleEvent = require('@/lib/googleCalendar').deleteGoogleEvent;
} catch (e) {
  deleteGoogleEvent = async () => {};
}

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

    await record.destroy();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
