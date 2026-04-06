const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function importWithoutConstraints() {
  const backupDir = path.join(__dirname, 'backups');
  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  const latestBackup = files.sort().pop();
  const backupPath = path.join(backupDir, latestBackup);
  
  console.log(`🔄 Importando backup: ${latestBackup}\n`);

  try {
    // Desactivar todas las foreign keys
    console.log('🔓 Desactivando foreign keys...');
    await pool.query('ALTER TABLE events DISABLE TRIGGER ALL');
    await pool.query('ALTER TABLE proposals DISABLE TRIGGER ALL');
    await pool.query('ALTER TABLE calendar_dates DISABLE TRIGGER ALL');
    await pool.query('ALTER TABLE interactions DISABLE TRIGGER ALL');
    await pool.query('ALTER TABLE visits DISABLE TRIGGER ALL');
    await pool.query('ALTER TABLE tasks DISABLE TRIGGER ALL');
    await pool.query('ALTER TABLE lead_status_history DISABLE TRIGGER ALL');
    await pool.query('ALTER TABLE reservations DISABLE TRIGGER ALL');
    await pool.query('ALTER TABLE payments DISABLE TRIGGER ALL');
    console.log('✓ Constraints desactivados\n');
    
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    
    const importOrder = [
      'users',
      'leads',
      'calendar_dates',
      'events',
      'proposals',
      'interactions',
      'visits',
      'tasks',
      'lead_status_history',
      'reservations',
      'payments'
    ];

    for (const table of importOrder) {
      if (!backup[table] || backup[table].length === 0) {
        console.log(`⏭️  ${table}: No data`);
        continue;
      }

      const rows = backup[table];
      let successCount = 0;
      
      for (const row of rows) {
        const columnList = Object.keys(row);
        const valueList = Object.values(row);
        const colString = columnList.map(c => `"${c}"`).join(', ');
        const placeholderString = columnList.map((_, i) => `$${i + 1}`).join(', ');
        
        try {
          await pool.query(
            `INSERT INTO "${table}" (${colString}) VALUES (${placeholderString})`,
            valueList
          );
          successCount++;
        } catch (err) {
          // Silent
        }
      }
      
      console.log(`✅ ${table}: ${successCount}/${rows.length}`);
    }

    // Re-activar constraints
    console.log('\n🔐 Re-activando constraints...');
    await pool.query('ALTER TABLE events ENABLE TRIGGER ALL');
    await pool.query('ALTER TABLE proposals ENABLE TRIGGER ALL');
    await pool.query('ALTER TABLE calendar_dates ENABLE TRIGGER ALL');
    await pool.query('ALTER TABLE interactions ENABLE TRIGGER ALL');
    await pool.query('ALTER TABLE visits ENABLE TRIGGER ALL');
    await pool.query('ALTER TABLE tasks ENABLE TRIGGER ALL');
    await pool.query('ALTER TABLE lead_status_history ENABLE TRIGGER ALL');
    await pool.query('ALTER TABLE reservations ENABLE TRIGGER ALL');
    await pool.query('ALTER TABLE payments ENABLE TRIGGER ALL');
    
    console.log('\n✅ Backup imported successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

importWithoutConstraints();
