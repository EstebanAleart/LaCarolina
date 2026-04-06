const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

const encodedUrl = localDbUrl.replace('Pedito1986!', encodeURIComponent('Pedito1986!'));
const pool = new Pool({ connectionString: encodedUrl });

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

async function backupLocalDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups-local');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {};
  
  try {
    console.log('🔄 Haciendo backup de BD local...\n');
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM "${table}"`);
        backup[table] = result.rows;
        console.log(`✅ ${table}: ${result.rows.length} registros`);
      } catch (err) {
        console.warn(`⚠️  ${table}: Error`);
      }
    }

    const backupFile = path.join(backupDir, `backup-local-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    const totalRecords = Object.values(backup).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n✅ Backup guardado en: backups-local/backup-local-${timestamp}.json`);
    console.log(`📊 Total: ${totalRecords} registros`);
    
  } catch (err) {
    console.error('❌ Error durante backup:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

backupLocalDatabase();
