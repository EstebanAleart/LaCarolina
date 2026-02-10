import { NextResponse } from 'next/server';
const { Op } = require('sequelize');
const { CalendarDate } = require('@/lib/models/associations');

// GET /api/calendar - Todas las fechas del calendario
export async function GET() {
  try {
    const dates = await CalendarDate.findAll({
      order: [['fecha', 'ASC']],
    });

    return NextResponse.json(dates);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/calendar - Crear o actualizar una fecha
export async function POST(request) {
  try {
    const body = await request.json();

    // Regla: no puede haber dos leads en la misma fecha Reservada/Confirmada
    if (
      body.lead_id &&
      (body.estado_fecha === 'Reservada' || body.estado_fecha === 'Confirmada')
    ) {
      const conflict = await CalendarDate.findOne({
        where: {
          fecha: body.fecha,
          lead_id: { [Op.ne]: body.lead_id },
          estado_fecha: { [Op.in]: ['Reservada', 'Confirmada'] },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: 'Ya existe una reserva o confirmación para esta fecha' },
          { status: 409 }
        );
      }
    }

    // Buscar si ya existe la fecha
    const existing = await CalendarDate.findOne({
      where: { fecha: body.fecha },
    });

    if (existing) {
      await existing.update({
        estado_fecha: body.estado_fecha || existing.estado_fecha,
        fuente: body.fuente || existing.fuente,
        lead_id: body.lead_id !== undefined ? body.lead_id : existing.lead_id,
        evento_id: body.evento_id !== undefined ? body.evento_id : existing.evento_id,
        nota: body.nota !== undefined ? body.nota : existing.nota,
      });
      return NextResponse.json(existing);
    }

    const calendarDate = await CalendarDate.create({
      fecha: body.fecha,
      estado_fecha: body.estado_fecha || 'Bloqueada',
      fuente: body.fuente || 'CRM',
      lead_id: body.lead_id || null,
      evento_id: body.evento_id || null,
      nota: body.nota || '',
    });

    return NextResponse.json(calendarDate, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
