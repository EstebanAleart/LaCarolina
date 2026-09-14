const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Leer LOCAL_DB_URL del .env.local
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

const encodedUrl = localDbUrl.replace(
  'Pedito1986!',
  encodeURIComponent('Pedito1986!')
);

const pool = new Pool({
  connectionString: encodedUrl
});

async function checkData() {
  try {
    console.log('📊 Contando registros en la BD local...\n');
    
    const tables = [
      'users',
      'leads',
      'events',
      'proposals',
      'calendar_dates',
      'interactions',
      'visits',
      'tasks',
      'lead_status_history',
      'reservations',
      'payments'
    ];

    let total = 0;
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = parseInt(result.rows[0].count);
      total += count;
      console.log(`  ${table}: ${count} registros`);
    }

    console.log(`\n✅ TOTAL: ${total} registros en BD local`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkData();
