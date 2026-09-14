#!/usr/bin/env node
// Load .env.local FIRST
require('dotenv').config({ path: '.env.local' });

// Then override with local values
process.env.DATABASE_URL = process.env.LOCAL_DB_URL;
process.env.DIRECT_URL = process.env.LOCAL_DB_URL;
process.env.GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID_DEV;
process.env.NODE_ENV = 'development';

// Verify environment
if (!process.env.LOCAL_DB_URL) {
  console.error('❌ LOCAL_DB_URL not found in .env.local');
  process.exit(1);
}

console.log('✅ Dev Local Environment:');
console.log('   DB:', process.env.DATABASE_URL.split('@')[1]?.split('/')[1]);
console.log('   Calendar:', process.env.GOOGLE_CALENDAR_ID?.substring(0, 20) + '...');

// Use execSync to inherit environment variables to child process
const { execSync } = require('child_process');
try {
  execSync('pnpm next dev', { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}

