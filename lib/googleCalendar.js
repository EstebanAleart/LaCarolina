import { google } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

// Color IDs de Google Calendar
const COLOR_MAP = {
  Reservada: '9',    // Blueberry (azul)
  Confirmada: '10',  // Basil (verde)
  Bloqueada: '5',    // Banana (amarillo)
};

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    console.warn('[GCal] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY');
    return null;
  }

  const parsedKey = key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;

  return new google.auth.JWT({
    email: email,
    key: parsedKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

function getCalendar() {
  const auth = getAuthClient();
  if (!auth) return null;
  return google.calendar({ version: 'v3', auth });
}

// Crear evento en Google Calendar
export async function createGoogleEvent(calendarDate, lead) {
  const calendar = getCalendar();
  if (!calendar || !CALENDAR_ID) {
    console.warn('[GCal] createGoogleEvent skipped: calendar=', !!calendar, 'CALENDAR_ID=', !!CALENDAR_ID);
    return null;
  }

  const summary = lead
    ? `${lead.nombre}${lead.tipo_evento ? ' - ' + lead.tipo_evento : ''}`
    : calendarDate.nota || 'Fecha bloqueada';

  const description = lead
    ? [
        lead.telefono ? `Tel: ${lead.telefono}` : '',
        lead.email ? `Email: ${lead.email}` : '',
        `Estado: ${lead.estado_actual || ''}`,
        lead.notas ? `Notas: ${lead.notas}` : '',
      ].filter(Boolean).join('\n')
    : calendarDate.nota || '';

  const fecha = new Date(calendarDate.fecha).toISOString().substring(0, 10);
  const endDate = new Date(fecha + 'T12:00:00');
  endDate.setDate(endDate.getDate() + 1);
  const endStr = endDate.toISOString().substring(0, 10);

  const event = {
    summary,
    description,
    start: { date: fecha },
    end: { date: endStr },
    colorId: COLOR_MAP[calendarDate.estado_fecha] || COLOR_MAP.Bloqueada,
    extendedProperties: {
      private: {
        carolinaId: String(calendarDate.id),
        leadId: lead ? String(lead.id) : '',
      },
    },
    status: calendarDate.estado_fecha === 'Confirmada' ? 'confirmed' : 'tentative',
  };

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: event,
  });

  return res.data.id;
}

// Actualizar evento existente en Google Calendar
export async function updateGoogleEvent(googleEventId, calendarDate, lead) {
  const calendar = getCalendar();
  if (!calendar || !CALENDAR_ID || !googleEventId) return;

  const summary = lead
    ? `${lead.nombre}${lead.tipo_evento ? ' - ' + lead.tipo_evento : ''}`
    : calendarDate.nota || 'Fecha bloqueada';

  const description = lead
    ? [
        lead.telefono ? `Tel: ${lead.telefono}` : '',
        lead.email ? `Email: ${lead.email}` : '',
        `Estado: ${lead.estado_actual || ''}`,
        lead.notas ? `Notas: ${lead.notas}` : '',
      ].filter(Boolean).join('\n')
    : calendarDate.nota || '';

  const fecha = new Date(calendarDate.fecha).toISOString().substring(0, 10);
  const endDate = new Date(fecha + 'T12:00:00');
  endDate.setDate(endDate.getDate() + 1);
  const endStr = endDate.toISOString().substring(0, 10);

  await calendar.events.update({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
    requestBody: {
      summary,
      description,
      start: { date: fecha },
      end: { date: endStr },
      colorId: COLOR_MAP[calendarDate.estado_fecha] || COLOR_MAP.Bloqueada,
      extendedProperties: {
        private: {
          carolinaId: String(calendarDate.id),
          leadId: lead ? String(lead.id) : '',
        },
      },
      status: calendarDate.estado_fecha === 'Confirmada' ? 'confirmed' : 'tentative',
    },
  });
}

// Eliminar evento de Google Calendar
export async function deleteGoogleEvent(googleEventId) {
  const calendar = getCalendar();
  if (!calendar || !CALENDAR_ID || !googleEventId) return;

  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: googleEventId,
    });
  } catch (err) {
    if (err.code !== 404 && err.code !== 410) throw err;
  }
}

// Listar eventos de Google Calendar
export async function listGoogleEvents(options = {}) {
  const calendar = getCalendar();
  if (!calendar || !CALENDAR_ID) return { items: [] };

  const params = {
    calendarId: CALENDAR_ID,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 2500,
    ...options,
  };

  const res = await calendar.events.list(params);
  return {
    items: res.data.items || [],
    nextSyncToken: res.data.nextSyncToken || null,
  };
}

// Registrar webhook para push notifications
export async function setupWebhook(webhookUrl, channelId) {
  const calendar = getCalendar();
  if (!calendar || !CALENDAR_ID) return null;

  const res = await calendar.events.watch({
    calendarId: CALENDAR_ID,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
    },
  });

  return {
    channelId: res.data.id,
    resourceId: res.data.resourceId,
    expiration: res.data.expiration,
  };
}

// Detener webhook
export async function stopWebhook(channelId, resourceId) {
  const calendar = getCalendar();
  if (!calendar) return;

  await calendar.channels.stop({
    requestBody: {
      id: channelId,
      resourceId: resourceId,
    },
  });
}

export { CALENDAR_ID, getCalendar };
