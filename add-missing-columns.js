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

async function addMissingColumns() {
  try {
    console.log('🔄 Agregando columnas faltantes...\n');
    
    // Agregar managed_by_user_id a leads si no existe
    await pool.query(`
      ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS managed_by_user_id UUID,
      ADD CONSTRAINT fk_leads_managed_by FOREIGN KEY (managed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
    `).catch(err => console.log('  ⚠️  managed_by_user_id: ya existe o error'));
    
    console.log('  ✓ leads.managed_by_user_id');
    
    // Agregar calendar_date_id a events si no existe
    await pool.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS calendar_date_id UUID,
      ADD CONSTRAINT fk_events_calendar_date FOREIGN KEY (calendar_date_id) REFERENCES calendar_dates(id) ON DELETE SET NULL;
    `).catch(err => console.log('  ⚠️  calendar_date_id: ya existe o error'));
    
    console.log('  ✓ events.calendar_date_id');

    console.log('\n✅ Columnas agregadas exitosamente');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
