import { NextResponse } from 'next/server';

// GET /api/google-calendar - Test de conexion
export async function GET() {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    const calId = process.env.GOOGLE_CALENDAR_ID;

    if (!email || !rawKey || !calId) {
      return NextResponse.json({ ok: false, error: 'Missing env vars' }, { status: 500 });
    }

    const { google } = require('googleapis');

    // Next.js ya convierte \n a newlines reales en .env.local
    // Pero por si acaso, manejar ambos casos
    const key = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

    const auth = new google.auth.JWT({
      email: email,
      key: key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    await auth.authorize();

    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.list({
      calendarId: calId,
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
