import { NextResponse } from 'next/server';
const { Event, Lead, CalendarDate, LeadStatusHistory } = require('@/lib/models/associations');

// GET /api/events - Todos los eventos
export async function GET() {
  try {
    const events = await Event.findAll({
      include: [
        { association: 'lead' },
        { association: 'calendar_date' },
      ],
      order: [['created_at', 'DESC']],
    });

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/events - Crear evento (con lógica automática)
export async function POST(request) {
  try {
    const body = await request.json();

    // Regla: un lead solo puede tener un evento
    const existing = await Event.findOne({
      where: { lead_id: body.lead_id },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Este lead ya fue convertido en evento' },
        { status: 409 }
      );
    }

    // Crear el evento
    const event = await Event.create({
      lead_id: body.lead_id,
      fecha_confirmada: body.fecha_confirmada,
      tipo_evento: body.tipo_evento || '',
      invitados_estimados: body.invitados_estimados || 0,
      servicios_contratados: body.servicios_contratados || [],
      estado_operativo: 'Pendiente',
      contrato_url: body.contrato_url || '',
    });

    // Automatización: actualizar CalendarDate a "Confirmada"
    if (body.fecha_confirmada) {
      const calDate = await CalendarDate.findOne({
        where: { fecha: body.fecha_confirmada },
      });

      if (calDate) {
        await calDate.update({
          estado_fecha: 'Confirmada',
          lead_id: body.lead_id,
          evento_id: event.id,
        });
      } else {
        await CalendarDate.create({
          fecha: body.fecha_confirmada,
          estado_fecha: 'Confirmada',
          fuente: 'CRM',
          lead_id: body.lead_id,
          evento_id: event.id,
        });
      }
    }

    // Automatización: cambiar estado del lead a "Evento confirmado"
    const lead = await Lead.findByPk(body.lead_id);
    if (lead) {
      await LeadStatusHistory.create({
        lead_id: body.lead_id,
        estado_anterior: lead.estado_actual,
        estado_nuevo: 'Evento confirmado',
        motivo: null,
        changed_by_user_id: body.user_id || null,
      });

      await lead.update({
        estado_actual: 'Evento confirmado',
        updated_at: new Date(),
      });
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
