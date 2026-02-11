import { NextResponse } from 'next/server';
const { CalendarDate } = require('@/lib/models/associations');

// DELETE /api/calendar/:fecha - Liberar/eliminar una fecha
export async function DELETE(request, { params }) {
  try {
    const { fecha } = await params;

    const deleted = await CalendarDate.destroy({
      where: { fecha },
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Fecha no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
