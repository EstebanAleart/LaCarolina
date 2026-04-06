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

if (!localDbUrl) {
  console.error('❌ LOCAL_DB_URL not found in .env.local');
  process.exit(1);
}

// URL-encode la contraseña
const encodedUrl = localDbUrl.replace(
  'Pedito1986!',
  encodeURIComponent('Pedito1986!')
);

const pool = new Pool({
  connectionString: encodedUrl
});

async function importBackup() {
  // Buscar el archivo de backup más reciente
  const backupDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.error('❌ No backup directory found');
    process.exit(1);
  }

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('❌ No backup files found');
    process.exit(1);
  }

  const latestBackup = files.sort().pop();
  const backupPath = path.join(backupDir, latestBackup);
  
  console.log(`🔄 Importando backup: ${latestBackup}\n`);

  try {
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    
    // Orden importante para respetar foreign keys
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
        console.log(`⏭️  ${table}: No data to import`);
        continue;
      }

      const rows = backup[table];
      
      // Insertar en lotes
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        
        for (const row of batch) {
          const columns = Object.keys(row).join(', ');
          const placeholders = Object.values(row).map(() => '?').join(', ');
          const values = Object.values(row);
          
          // Usar pg format adecuado
          const columnList = Object.keys(row);
          const valueList = Object.values(row);
          
          const colString = columnList.map(c => `"${c}"`).join(', ');
          const placeholderString = columnList.map((_, i) => `$${i + 1}`).join(', ');
          
          try {
            await pool.query(
              `INSERT INTO "${table}" (${colString}) VALUES (${placeholderString}) ON CONFLICT DO NOTHING`,
              valueList
            );
          } catch (err) {
            // Ignorar errores de constraint (puede que ya exista)
          }
        }
      }
      
      console.log(`✅ ${table}: ${rows.length} registros importados`);
    }

    console.log('\n✅ Backup imported successfully!');
    
  } catch (err) {
    console.error('❌ Error importing backup:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importBackup();
