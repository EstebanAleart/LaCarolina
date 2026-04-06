const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
let localDbUrl = '';

envContent.split('\n').forEach(line => {
  if (line.includes('LOCAL_DB_URL=')) {
    const match = line.match(/LOCAL_DB_URL=(.+)/);
    if (match) {
      localDbUrl = match[1].trim();
    }
  }
});

const encodedUrl = localDbUrl.replace('Pedito1986!', encodeURIComponent('Pedito1986!'));
const pool = new Pool({ connectionString: encodedUrl });

async function cleanDatabase() {
  try {
    console.log('🗑️  Limpiando la base de datos...\n');
    
    // Limpiar en orden inverso de dependencias
    const tables = [
      'payments',
      'reservations',
      'lead_status_history',
      'tasks',
      'visits',
      'interactions',
      'proposals',
      'events',
      'calendar_dates',
      'leads',
      'users'
    ];

    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`✓ ${table} limpiado`);
      } catch (err) {
        console.log(`⚠️  ${table}: ${err.message.substring(0, 50)}`);
      }
    }

    console.log('\n✅ Base de datos limpiada');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

cleanDatabase();
