const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión a Supabase
const supabaseUrl = 'postgresql://postgres.cqnpimynuytqvhfddxwn:Pedito32356776@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: supabaseUrl,
  ssl: { rejectUnauthorized: false }
});

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

async function backupData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups');
  
  // Crear directorio de backups si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {};
  
  try {
    console.log('🔄 Iniciando backup de Supabase...\n');
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM "${table}"`);
        backup[table] = result.rows;
        console.log(`✅ ${table}: ${result.rows.length} registros`);
      } catch (err) {
        console.warn(`⚠️  ${table}: No existe o error al leer`);
      }
    }

    // Guardar backup en JSON
    const backupFile = path.join(backupDir, `backup-supabase-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ Backup completado en: ${backupFile}`);
    console.log(`📊 Total de registros: ${Object.values(backup).reduce((sum, arr) => sum + arr.length, 0)}`);
    
  } catch (err) {
    console.error('❌ Error durante backup:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

backupData();
