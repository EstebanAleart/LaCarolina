import { NextResponse } from 'next/server';

export async function GET() {
  const info = {
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: (process.env.DATABASE_URL || '').length,
    DATABASE_URL_PREVIEW: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.substring(0, 30) + '...'
      : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    env_keys: Object.keys(process.env).filter(k =>
      k.includes('DATABASE') || k.includes('SUPABASE') || k.includes('NEXT_PUBLIC')
    ),
  };

  // Intentar conectar a la BD
  try {
    const sequelize = require('@/lib/models/index');
    await sequelize.authenticate();
    info.DB_CONNECTION = 'OK';
  } catch (err) {
    info.DB_CONNECTION = 'FAILED';
    info.DB_ERROR = err.message;
  }

  return NextResponse.json(info);
}
