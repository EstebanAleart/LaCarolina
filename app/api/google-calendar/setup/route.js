import { NextResponse } from 'next/server';
const { v4: uuidv4 } = require('uuid');
const { setupWebhook, stopWebhook } = require('@/lib/googleCalendar');

// POST /api/google-calendar/setup - Registrar webhook para push notifications
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const baseUrl = body.baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Se necesita baseUrl o NEXT_PUBLIC_APP_URL en env vars' },
        { status: 400 }
      );
    }

    const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const webhookUrl = `${url}/api/google-calendar/webhook`;
    const channelId = uuidv4();

    const result = await setupWebhook(webhookUrl, channelId);

    if (!result) {
      return NextResponse.json(
        { error: 'Google Calendar no configurado. Verificar env vars.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      webhookUrl,
      channelId: result.channelId,
      resourceId: result.resourceId,
      expiration: result.expiration,
      expiresAt: new Date(Number(result.expiration)).toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/google-calendar/setup - Detener webhook existente
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { channelId, resourceId } = body;

    if (!channelId || !resourceId) {
      return NextResponse.json(
        { error: 'Se necesita channelId y resourceId' },
        { status: 400 }
      );
    }

    await stopWebhook(channelId, resourceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
