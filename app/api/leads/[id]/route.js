import { NextResponse } from 'next/server';
import { deleteGoogleEvent } from '@/lib/googleCalendar';
const { Lead, Interaction, Proposal, Visit, Reservation, Event, LeadStatusHistory, Task, CalendarDate } = require('@/lib/models/associations');
const { Op } = require('sequelize');

// GET /api/leads/:id - Detalle de un lead con todas sus relaciones
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const lead = await Lead.findByPk(id, {
      include: [
        { association: 'interactions', order: [['fecha', 'DESC']] },
        { association: 'visits', order: [['fecha_visita', 'DESC']] },
        { association: 'proposals', order: [['version', 'DESC']] },
        { association: 'status_history', order: [['changed_at', 'DESC']] },
        { association: 'reservation' },
        { association: 'event' },
      ],
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/leads/:id - Actualizar un lead
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Sanitizar: solo campos editables, limpiar strings vacios en campos DATE
    const { id: _id, created_at, updated_at, estado_actual, ...updateData } = body;
    if (updateData.fecha_tentativa === '') updateData.fecha_tentativa = null;
    if (updateData.fecha_visita_salon === '') updateData.fecha_visita_salon = null;
    if (updateData.fecha_firma_contrato === '') updateData.fecha_firma_contrato = null;
    if (updateData.fecha_limite_pago_total === '') updateData.fecha_limite_pago_total = null;

    // Auto-calcular fecha límite de pago (fecha evento - 30 días)
    if (updateData.fecha_tentativa) {
      const fechaLimite = new Date(updateData.fecha_tentativa);
      fechaLimite.setDate(fechaLimite.getDate() - 30);
      updateData.fecha_limite_pago_total = fechaLimite.toISOString().substring(0, 10);
    }

    await lead.update({
      ...updateData,
      updated_at: new Date(),
    });

    // Auto-avanzar estado a "Esperando visita" si se agrega fecha_visita_salon
    if (updateData.fecha_visita_salon) {
      const ESTADOS_PREVIOS_VISITA = ['Lead nuevo', 'Contactado'];
      if (ESTADOS_PREVIOS_VISITA.includes(lead.estado_actual)) {
        await LeadStatusHistory.create({
          lead_id: lead.id,
          estado_anterior: lead.estado_actual,
          estado_nuevo: 'Esperando visita',
          motivo: 'Fecha de visita al salón agendada',
          changed_by_user_id: null,
        });
        await lead.update({ estado_actual: 'Esperando visita', updated_at: new Date() });
      }
    }

    // Sync: si se estableció fecha_visita_salon, crear/actualizar CalendarDate como "Visita"
    if (updateData.fecha_visita_salon) {
      const fechaVisita = updateData.fecha_visita_salon.toString().substring(0, 10);
      // Buscar la entrada de calendario de este lead en esta fecha (no la de otros leads)
      const existingCalDate = await CalendarDate.findOne({ where: { fecha: fechaVisita, lead_id: lead.id } });
      if (!existingCalDate) {
        await CalendarDate.create({
          fecha: fechaVisita,
          estado_fecha: 'Visita',
          fuente: 'CRM',
          lead_id: lead.id,
          nota: `Visita al salón: ${lead.nombre}`,
        });
      } else {
        await existingCalDate.update({
          estado_fecha: 'Visita',
          nota: `Visita al salón: ${lead.nombre}`,
        });
      }
    }

    // Sync propuesta asociada: actualizar precio_total si cambio valor_estimado
    if (updateData.valor_estimado !== undefined) {
      const lastProposal = await Proposal.findOne({
        where: { lead_id: id },
        order: [['created_at', 'DESC']],
      });
      if (lastProposal) {
        await lastProposal.update({ precio_senia: updateData.valor_estimado });
      }
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/leads/:id - Eliminar lead con cascade manual
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Cascade manual
    await Interaction.destroy({ where: { lead_id: id } });
    await Visit.destroy({ where: { lead_id: id } });
    await Proposal.destroy({ where: { lead_id: id } });
    await LeadStatusHistory.destroy({ where: { lead_id: id } });
    await Reservation.destroy({ where: { lead_id: id } });
    await Task.destroy({ where: { lead_id: id } });
    await Event.destroy({ where: { lead_id: id } });

    // Eliminar fechas del calendario asociadas al lead + borrar de Google Calendar
    const calDates = await CalendarDate.findAll({ where: { lead_id: id } });
    for (const cd of calDates) {
      if (cd.google_event_id) {
        try { await deleteGoogleEvent(cd.google_event_id); } catch (e) { /* ignore */ }
      }
      await cd.destroy();
    }

    await lead.destroy();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
