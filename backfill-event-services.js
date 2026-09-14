// ============================================================
// backfill-event-services.js
// Crea event_services para los eventos existentes a partir de servicios_contratados.
// SIEMPRE apunta a la base LOCAL (LOCAL_DB_URL). Dry-run por defecto.
//   node backfill-event-services.js           → muestra el plan, NO escribe
//   node backfill-event-services.js --apply   → escribe en LOCAL
//
// Reglas conservadoras:
//  - Idempotente: saltea eventos que ya tienen event_services.
//  - total_contratado: salón = valor_total_evento; resto = 0 (se completan a mano).
//  - NO toca pagos (quedan "sin asignar"; se asignan desde la ficha). No inventa saldos.
//  - Cotillón se crea SIN combo (combo_id null) → no reserva stock hasta elegir combo.
// ============================================================
require('dotenv').config({ path: '.env.local' });
process.env.DATABASE_URL = process.env.LOCAL_DB_URL; // candado: siempre local
process.env.DIRECT_URL = process.env.LOCAL_DB_URL;

if (!process.env.LOCAL_DB_URL) { console.error('Falta LOCAL_DB_URL en .env.local'); process.exit(1); }

const APPLY = process.argv.includes('--apply');
const sequelize = require('./lib/models/index');
const { Event, EventService, ServiceType } = require('./lib/models/associations');

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const NAME_TO_CODIGO = {
  'salon': 'salon',
  'catering': 'catering', 'tarjetas': 'catering', 'tarjetas / catering': 'catering',
  'cotillon': 'cotillon',
  'mesa dulce': 'mesa_dulce',
  'fotografia': 'fotografia',
  'decoracion': 'decoracion', 'decoracion especial': 'decoracion', 'decoracion y mobiliario': 'decoracion',
  'mobiliario': 'mobiliario',
  'pantalla': 'pantalla',
  'cabana': 'cabana',
};
const codigoDe = (nombre) => NAME_TO_CODIGO[norm(nombre)] || 'adicional';

function parseServicios(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

async function main() {
  const tipos = await ServiceType.findAll();
  if (!tipos.length) { console.error('No hay service_types. Corré 002b_seed_service_types.sql primero.'); process.exit(1); }
  const byCodigo = Object.fromEntries(tipos.map(t => [t.codigo, t]));

  const events = await Event.findAll({ include: [{ model: EventService, as: 'services' }] });
  let creados = 0, saltados = 0;
  const plan = [];

  for (const ev of events) {
    if ((ev.services || []).length > 0) { saltados++; continue; }
    const servicios = parseServicios(ev.servicios_contratados);
    if (!servicios.length) { saltados++; continue; }

    const rows = [];
    const vistos = new Set();
    for (const nombre of servicios) {
      const codigo = codigoDe(nombre);
      if (vistos.has(codigo)) continue; // un servicio por tipo
      vistos.add(codigo);
      const st = byCodigo[codigo];
      const total = codigo === 'salon' ? (ev.valor_total_evento || 0) : 0;
      rows.push({ event_id: ev.id, service_type_id: st.id, total_contratado: total, _codigo: codigo, _nombre: nombre });
    }
    plan.push({ event: ev.lead_id, fecha: ev.fecha_confirmada, rows });
    creados += rows.length;
  }

  console.log(`\nEventos: ${events.length} | con servicios a crear: ${plan.length} | ya tenían (saltados): ${saltados}`);
  console.log(`event_services a crear: ${creados}\n`);
  for (const p of plan.slice(0, 15)) {
    console.log(`• evento ${p.event} (${p.fecha}): ${p.rows.map(r => `${r._codigo}${r.total_contratado ? ' $' + r.total_contratado : ''}`).join(', ')}`);
  }
  if (plan.length > 15) console.log(`… y ${plan.length - 15} eventos más.`);

  if (!APPLY) {
    console.log('\n(DRY-RUN) No se escribió nada. Volvé a correr con --apply para aplicar en LOCAL.');
    await sequelize.close();
    return;
  }

  await sequelize.transaction(async (t) => {
    for (const p of plan) {
      for (const r of p.rows) {
        await EventService.create({
          event_id: r.event_id, service_type_id: r.service_type_id,
          total_contratado: r.total_contratado, estado: 'Contratado',
        }, { transaction: t });
      }
    }
  });
  console.log(`\n✅ Aplicado en LOCAL: ${creados} event_services creados.`);
  await sequelize.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
