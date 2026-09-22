import { NextResponse } from 'next/server';
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from '@/lib/googleCalendar';
const { Op } = require('sequelize');
const { CalendarDate, Lead, LeadStatusHistory, Reservation, Event, Proposal } = require('@/lib/models/associations');
const { confirmarReservaSiCorresponde } = require('@/lib/reserva');

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

    // Regla: no puede haber dos leads distintos en la misma fecha Reservada/Confirmada
    if (
      body.lead_id &&
      (body.estado_fecha === 'Reservada' || body.estado_fecha === 'Confirmada')
    ) {
      const conflictWhere = {
        fecha: body.fecha,
        lead_id: { [Op.ne]: body.lead_id },
        estado_fecha: { [Op.in]: ['Reservada', 'Confirmada'] },
      };
      if (body.id) conflictWhere.id = { [Op.ne]: body.id };
      const conflict = await CalendarDate.findOne({ where: conflictWhere });

      if (conflict) {
        return NextResponse.json(
          { error: 'Ya existe una reserva o confirmación para esta fecha' },
          { status: 409 }
        );
      }
    }

    // Buscar entrada existente: por id, por (fecha+lead), o por (fecha sin lead)
    let existing = null;
    if (body.id) {
      existing = await CalendarDate.findByPk(body.id);
    } else if (body.lead_id) {
      existing = await CalendarDate.findOne({ where: { fecha: body.fecha, lead_id: body.lead_id } });
    } else {
      existing = await CalendarDate.findOne({ where: { fecha: body.fecha, lead_id: null } });
    }

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
        // E15-03: reservar/confirmar la fecha desde el calendario NO cambia el estado del lead por sí solo.
        // La confirmación (seña + fecha + contrato) la decide lib/reserva al final de este handler.
        // Se limpia la fecha tentativa: la fecha real ahora vive en el calendario.
        if (lead.fecha_tentativa) {
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

        // E15-04: el Evento ya no se crea desde el calendario; lo crea lib/reserva al confirmar.

        // Auto-crear propuesta solo si no existe ninguna (estado inicial: Creada)
        // El estado del contrato se gestiona exclusivamente desde la sección Contratos
        const existingProposal = await Proposal.findOne({ where: { lead_id: lead.id } });
        if (!existingProposal) {
          await Proposal.create({
            lead_id: lead.id,
            version: 1,
            estado: 'Creada',
            precio_total: lead.valor_estimado || 0,
            precio_senia: lead.valor_estimado || 0,
            invitados_estimados: lead.invitados_estimados || 0,
          });
        }
      }
    }

    // E15-03: si con esta fecha el lead ya tiene seña + fecha + contrato firmado → Reserva confirmada + Evento
    if (finalLeadId && (finalEstado === 'Reservada' || finalEstado === 'Confirmada')) {
      await confirmarReservaSiCorresponde(finalLeadId);
    }

    // === Google Calendar Sync ===
    let googleSync = null;
    try {
      const syncEstado = body.estado_fecha || (existing?.estado_fecha) || 'Bloqueada';
      const syncLeadId = body.lead_id !== undefined ? body.lead_id : (existing?.lead_id || null);
      console.log('[GCal] estado:', syncEstado, '| lead:', syncLeadId, '| existing_gid:', result.google_event_id);

      if (syncEstado === 'Reservada' || syncEstado === 'Confirmada') {
        const syncLead = syncLeadId ? await Lead.findByPk(syncLeadId) : null;
        if (result.google_event_id) {
          await updateGoogleEvent(result.google_event_id, result, syncLead);
          googleSync = 'updated';
        } else {
          const googleId = await createGoogleEvent(result, syncLead);
          console.log('[GCal] createGoogleEvent →', googleId);
          if (googleId) {
            await result.update({ google_event_id: googleId });
            googleSync = 'created: ' + googleId;
          } else {
            googleSync = 'skipped: createGoogleEvent returned null (check GOOGLE_ env vars)';
          }
        }
      } else if (syncEstado === 'Disponible' || syncEstado === 'Bloqueada') {
        if (result.google_event_id) {
          await deleteGoogleEvent(result.google_event_id);
          await result.update({ google_event_id: null });
          googleSync = 'deleted';
        }
      }
    } catch (googleErr) {
      console.error('[GCal] ERROR:', googleErr.message, googleErr.stack);
      googleSync = 'error: ' + googleErr.message;
    }
    console.log('[GCal] sync result:', googleSync);

    // Incluir info de sync en la respuesta para debug
    const responseData = result.toJSON ? result.toJSON() : { ...result };
    responseData._googleSync = googleSync;

    return NextResponse.json(responseData, { status: isNew ? 201 : 200 });
  } catch (error) {
    console.error('[Calendar POST] ERROR:', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
