#!/usr/bin/env node
require('dotenv').config();
// Sobrescribir para desarrollo local
process.env.DATABASE_URL = process.env.LOCAL_DB_URL;
process.env.DIRECT_URL = process.env.LOCAL_DB_URL;
// Usar Google Calendar de pruebas en dev:local
process.env.GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID_DEV;
const { spawn } = require('child_process');

const next = spawn('next', ['dev'], { stdio: 'inherit' });
next.on('exit', (code) => process.exit(code));
