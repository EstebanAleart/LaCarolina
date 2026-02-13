import { NextResponse } from 'next/server';
import { getCalendar, CALENDAR_ID } from '@/lib/googleCalendar';

// GET /api/google-calendar - Test de conexion
export async function GET() {
  try {
    if (!CALENDAR_ID) {
      return NextResponse.json({ ok: false, error: 'Missing GOOGLE_CALENDAR_ID' }, { status: 500 });
    }

    const calendar = getCalendar();
    if (!calendar) {
      return NextResponse.json({ ok: false, error: 'Google Calendar auth failed (check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY)' }, { status: 500 });
    }

    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      maxResults: 10,
    });

    return NextResponse.json({
      ok: true,
      total: (res.data.items || []).length,
      events: (res.data.items || []).map(e => ({
        id: e.id,
        summary: e.summary,
        start: e.start,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
