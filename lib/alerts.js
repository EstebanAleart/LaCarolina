// Lógica pura de alertas previas al evento (sin DB). Se calcula al vuelo.
// Buckets por días restantes: vencido/hoy, 7, 15, 30 días.

const TZ = 'America/Argentina/Buenos_Aires';

const BUCKETS = [
  { key: 'vencido', label: 'Hoy y vencidos', max: 0 },
  { key: 'd7', label: 'Próximos 7 días', max: 7 },
  { key: 'd15', label: 'En 8 a 15 días', max: 15 },
  { key: 'd30', label: 'En 16 a 30 días', max: 30 },
];

// 'YYYY-MM-DD' de una fecha de evento. Sequelize devuelve Date (guardado a las 00:00 UTC)
// y el JSON del API devuelve string ISO: en los dos casos el día es el de UTC.
function fechaISO(fecha) {
  return fecha instanceof Date ? fecha.toISOString().substring(0, 10) : fecha.toString().substring(0, 10);
}

// 'YYYY-MM-DD' de hoy en Argentina (el server corre en UTC; de noche cambia el día antes).
function hoyISO(ahora = new Date()) {
  return ahora.toLocaleDateString('en-CA', { timeZone: TZ });
}

function diasHasta(fecha, hoy = new Date()) {
  if (!fecha) return null;
  const f = new Date(fechaISO(fecha) + 'T12:00:00Z');
  const h = new Date((typeof hoy === 'string' ? hoy : hoyISO(hoy)) + 'T12:00:00Z');
  return Math.round((f - h) / 86400000);
}

// Devuelve la clave de bucket, o null si está a más de 30 días.
function bucketDe(dias) {
  if (dias == null || Number.isNaN(dias)) return null;
  if (dias <= 0) return 'vencido';
  if (dias <= 7) return 'd7';
  if (dias <= 15) return 'd15';
  if (dias <= 30) return 'd30';
  return null;
}

module.exports = { BUCKETS, fechaISO, hoyISO, diasHasta, bucketDe };
