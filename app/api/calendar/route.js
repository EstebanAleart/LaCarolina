import { NextResponse } from 'next/server';
const { Op } = require('sequelize');
const { CalendarDate, Lead, LeadStatusHistory, Reservation, Event, Proposal } = require('@/lib/models/associations');
let createGoogleEvent, updateGoogleEvent, deleteGoogleEvent;
try {
  const gc = require('@/lib/googleCalendar');
  createGoogleEvent = gc.createGoogleEvent;
  updateGoogleEvent = gc.updateGoogleEvent;
  deleteGoogleEvent = gc.deleteGoogleEvent;
} catch (e) {
  console.warn('Google Calendar module not available:', e.message);
  createGoogleEvent = async () => null;
  updateGoogleEvent = async () => {};
  deleteGoogleEvent = async () => {};
}

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

    let result;
    let isNew = false;

    if (existing) {
      await existing.update({
        estado_fecha: body.estado_fecha || existing.estado_fecha,
        fuente: body.fuente || existing.fuente,
        lead_id: body.lead_id !== undefined ? body.lead_id : existing.lead_id,
        evento_id: body.evento_id !== undefined ? body.evento_id : existing.evento_id,
        nota: body.nota !== undefined ? body.nota : existing.nota,
      });
      result = existing;
    } else {
      result = await CalendarDate.create({
        fecha: body.fecha,
        estado_fecha: body.estado_fecha || 'Bloqueada',
        fuente: body.fuente || 'CRM',
        lead_id: body.lead_id || null,
        evento_id: body.evento_id || null,
        nota: body.nota || '',
      });
      isNew = true;
    }

    // Sync bidireccional: actualizar estado del lead según estado del calendario
    const finalLeadId = body.lead_id !== undefined ? body.lead_id : (existing?.lead_id || null);
    const finalEstado = body.estado_fecha || (existing?.estado_fecha) || 'Bloqueada';

    if (finalLeadId && (finalEstado === 'Reservada' || finalEstado === 'Confirmada')) {
      const lead = await Lead.findByPk(finalLeadId);
      if (lead) {
        const nuevoEstadoLead = finalEstado === 'Reservada' ? 'Reserva tomada' : 'Evento confirmado';

        if (lead.estado_actual !== nuevoEstadoLead) {
          await LeadStatusHistory.create({
            lead_id: lead.id,
            estado_anterior: lead.estado_actual,
            estado_nuevo: nuevoEstadoLead,
            motivo: `Fecha ${finalEstado.toLowerCase()} desde calendario`,
            changed_by_user_id: null,
          });

          await lead.update({
            estado_actual: nuevoEstadoLead,
            fecha_tentativa: null,
            updated_at: new Date(),
          });
        } else if (lead.fecha_tentativa) {
          // Mismo estado pero limpiar tentativa si existe
          await lead.update({ fecha_tentativa: null, updated_at: new Date() });
        }

        // Auto-crear Reservation si no existe para este lead
        if (finalEstado === 'Reservada') {
          const existingRes = await Reservation.findOne({ where: { lead_id: lead.id } });
          if (!existingRes) {
            await Reservation.create({
              lead_id: lead.id,
              calendar_date_id: result.id,
              estado: 'Pendiente',
            });
          }
        }

        // Auto-crear Event si no existe para este lead
        if (finalEstado === 'Confirmada') {
          const existingEvt = await Event.findOne({ where: { lead_id: lead.id } });
          if (!existingEvt) {
            const evt = await Event.create({
              lead_id: lead.id,
              fecha_confirmada: body.fecha,
              tipo_evento: lead.tipo_evento || '',
              estado_operativo: 'Pendiente',
            });
            // Asociar evento_id al CalendarDate
            await result.update({ evento_id: evt.id });
          }
        }

        // Auto-actualizar última propuesta del lead
        const lastProposal = await Proposal.findOne({
          where: { lead_id: lead.id },
          order: [['created_at', 'DESC']],
        });
        if (lastProposal && lastProposal.estado !== 'Aceptada') {
          await lastProposal.update({
            estado: 'Aceptada',
            fecha_envio: lastProposal.fecha_envio || new Date(),
          });
        }
      }
    }

    // === Google Calendar Sync ===
    try {
      const syncEstado = body.estado_fecha || (existing?.estado_fecha) || 'Bloqueada';
      const syncLeadId = body.lead_id !== undefined ? body.lead_id : (existing?.lead_id || null);

      if (syncEstado === 'Reservada' || syncEstado === 'Confirmada') {
        const syncLead = syncLeadId ? await Lead.findByPk(syncLeadId) : null;
        if (result.google_event_id) {
          await updateGoogleEvent(result.google_event_id, result, syncLead);
        } else {
          const googleId = await createGoogleEvent(result, syncLead);
          if (googleId) {
            await result.update({ google_event_id: googleId });
          }
        }
      } else if (syncEstado === 'Disponible' || syncEstado === 'Bloqueada') {
        if (result.google_event_id) {
          await deleteGoogleEvent(result.google_event_id);
          await result.update({ google_event_id: null });
        }
      }
    } catch (googleErr) {
      console.error('Google Calendar sync error:', googleErr.message);
    }

    return NextResponse.json(result, { status: isNew ? 201 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
