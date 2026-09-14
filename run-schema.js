const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer `.env.local` manualmente para evitar parseo incorrecto
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line.includes('LOCAL_DB_URL=')) {
    const match = line.match(/LOCAL_DB_URL=(.+)/);
    if (match) {
      envVars.LOCAL_DB_URL = match[1].trim();
    }
  }
});

async function runSchema() {
  if (!envVars.LOCAL_DB_URL) {
    console.error('❌ LOCAL_DB_URL not found in .env.local');
    process.exit(1);
  }

  // URL-encode la contraseña
  const encodedUrl = envVars.LOCAL_DB_URL.replace(
    'Pedito1986!',
    encodeURIComponent('Pedito1986!')
  );

  const pool = new Pool({
    connectionString: encodedUrl
  });

  try {
    const schema = fs.readFileSync('schema.sql', 'utf-8');
    await pool.query(schema);
    console.log('✅ Schema created successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSchema();
