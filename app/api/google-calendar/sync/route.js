import { NextResponse } from 'next/server';
const { Op } = require('sequelize');
const { CalendarDate } = require('@/lib/models/associations');
const { listGoogleEvents, createGoogleEvent, CALENDAR_ID } = require('@/lib/googleCalendar');

// POST /api/google-calendar/sync - Sync manual/completo entre app y Google Calendar
export async function POST() {
  try {
    if (!CALENDAR_ID) {
      return NextResponse.json(
        { error: 'GOOGLE_CALENDAR_ID no configurado' },
        { status: 500 }
      );
    }

    const stats = { created_in_app: 0, created_in_google: 0, linked: 0, cleaned: 0 };

    // 1. Traer todos los eventos de Google Calendar
    const { items: googleEvents } = await listGoogleEvents({
      timeMin: new Date(new Date().getFullYear(), 0, 1).toISOString(),
      timeMax: new Date(new Date().getFullYear() + 2, 0, 1).toISOString(),
    });

    // Mapa de google events por carolinaId
    const googleByCarolinaId = {};
    const googleByDate = {};
    for (const gEvent of googleEvents) {
      const cId = gEvent.extendedProperties?.private?.carolinaId;
      if (cId) {
        googleByCarolinaId[cId] = gEvent;
      }
      const fecha = gEvent.start?.date || (gEvent.start?.dateTime ? gEvent.start.dateTime.substring(0, 10) : null);
      if (fecha) {
        googleByDate[fecha] = gEvent;
      }
    }

    // 2. Traer todos los CalendarDate de nuestra DB
    const allDates = await CalendarDate.findAll();

    for (const cd of allDates) {
      const fecha = cd.fecha?.toString().substring(0, 10);

      if (cd.google_event_id) {
        // Tiene referencia a Google - verificar que existe
        const exists = googleEvents.some(e => e.id === cd.google_event_id && e.status !== 'cancelled');
        if (!exists) {
          // El evento ya no existe en Google → limpiar referencia
          await cd.update({ google_event_id: null });
          stats.cleaned++;
        }
      } else if (cd.estado_fecha === 'Reservada' || cd.estado_fecha === 'Confirmada') {
        // No tiene google_event_id pero deberia → verificar si hay evento en Google para esa fecha
        const matching = googleByDate[fecha];
        if (matching) {
          // Ya existe en Google → linkear
          await cd.update({ google_event_id: matching.id });
          stats.linked++;
        } else {
          // No existe en Google → crear
          try {
            const Lead = require('@/lib/models/associations').Lead;
            const lead = cd.lead_id ? await Lead.findByPk(cd.lead_id) : null;
            const googleId = await createGoogleEvent(cd, lead);
            if (googleId) {
              await cd.update({ google_event_id: googleId });
              stats.created_in_google++;
            }
          } catch (e) {
            console.error(`Error syncing date ${fecha} to Google:`, e.message);
          }
        }
      }
    }

    // 3. Eventos en Google que no existen en nuestra DB
    const dbFechas = new Set(allDates.map(d => d.fecha?.toString().substring(0, 10)));

    for (const gEvent of googleEvents) {
      if (gEvent.status === 'cancelled') continue;
      const carolinaId = gEvent.extendedProperties?.private?.carolinaId;
      if (carolinaId) continue; // Ya manejado arriba

      const fecha = gEvent.start?.date || (gEvent.start?.dateTime ? gEvent.start.dateTime.substring(0, 10) : null);
      if (!fecha || dbFechas.has(fecha)) continue;

      // Crear en nuestra DB
      await CalendarDate.create({
        fecha,
        estado_fecha: 'Bloqueada',
        fuente: 'Google Calendar',
        nota: gEvent.summary || '',
        google_event_id: gEvent.id,
      });
      stats.created_in_app++;
    }

    return NextResponse.json({
      ok: true,
      stats,
      google_events_total: googleEvents.length,
      app_dates_total: allDates.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
