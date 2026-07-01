// ============================================================
// compare-schema.js — Compara el esquema LOCAL vs PROD (Supabase)
// 100% SOLO LECTURA: solo consulta information_schema. No escribe nada.
// Uso: node compare-schema.js
// ============================================================
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// --- leer URLs del .env.local ---
const envPath = path.join(__dirname, '.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
function readVar(name) {
  const m = env.match(new RegExp(`^${name}=(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
}
let prodUrl = readVar('DATABASE_URL');
let localUrl = readVar('LOCAL_DB_URL');
// encode '!' del password local si aparece sin codificar
localUrl = localUrl.replace('Pedito1986!', encodeURIComponent('Pedito1986!'));

if (!prodUrl || !localUrl) {
  console.error('Falta DATABASE_URL o LOCAL_DB_URL en .env.local');
  process.exit(1);
}

function poolFor(url) {
  const ssl = url.includes('supabase.com') ? { ssl: { require: true, rejectUnauthorized: false } } : {};
  return new Pool({ connectionString: url, ...ssl });
}

const Q_TABLES = `
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name;`;

const Q_COLUMNS = `
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;`;

async function snapshot(url) {
  const pool = poolFor(url);
  try {
    const tables = (await pool.query(Q_TABLES)).rows.map(r => r.table_name);
    const cols = (await pool.query(Q_COLUMNS)).rows;
    const byTable = {};
    for (const c of cols) {
      (byTable[c.table_name] ||= {})[c.column_name] = c.data_type;
    }
    return { tables, byTable };
  } finally {
    await pool.end();
  }
}

(async () => {
  console.log('🔍 Comparando esquemas (solo lectura)…\n');
  const [prod, local] = await Promise.all([snapshot(prodUrl), snapshot(localUrl)]);

  const setP = new Set(prod.tables);
  const setL = new Set(local.tables);

  const soloProd = prod.tables.filter(t => !setL.has(t));
  const soloLocal = local.tables.filter(t => !setP.has(t));
  const comunes = prod.tables.filter(t => setL.has(t));

  console.log(`PROD : ${prod.tables.length} tablas`);
  console.log(`LOCAL: ${local.tables.length} tablas\n`);

  if (soloProd.length) console.log('⚠️  Tablas SOLO en PROD (faltan en local):\n   - ' + soloProd.join('\n   - ') + '\n');
  if (soloLocal.length) console.log('⚠️  Tablas SOLO en LOCAL (no están en prod):\n   - ' + soloLocal.join('\n   - ') + '\n');
  if (!soloProd.length && !soloLocal.length) console.log('✅ Mismo conjunto de tablas.\n');

  let colDiffs = 0;
  for (const t of comunes) {
    const cp = prod.byTable[t] || {};
    const cl = local.byTable[t] || {};
    const faltanLocal = Object.keys(cp).filter(c => !(c in cl));
    const faltanProd = Object.keys(cl).filter(c => !(c in cp));
    const tipoDistinto = Object.keys(cp).filter(c => c in cl && cp[c] !== cl[c]).map(c => `${c} (prod:${cp[c]} / local:${cl[c]})`);
    if (faltanLocal.length || faltanProd.length || tipoDistinto.length) {
      colDiffs++;
      console.log(`• ${t}`);
      if (faltanLocal.length) console.log(`    faltan en local: ${faltanLocal.join(', ')}`);
      if (faltanProd.length) console.log(`    de más en local: ${faltanProd.join(', ')}`);
      if (tipoDistinto.length) console.log(`    tipo distinto: ${tipoDistinto.join(', ')}`);
    }
  }
  if (!colDiffs) console.log('✅ Columnas idénticas en todas las tablas comunes.');
  else console.log(`\n⚠️  ${colDiffs} tabla(s) con diferencias de columnas.`);
})().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
