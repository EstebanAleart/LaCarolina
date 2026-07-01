// Lógica pura de alertas previas al evento (sin DB). Se calcula al vuelo.
// Buckets por días restantes: vencido/hoy, 7, 15, 30 días.

const BUCKETS = [
  { key: 'vencido', label: 'Hoy y vencidos', max: 0 },
  { key: 'd7', label: 'Próximos 7 días', max: 7 },
  { key: 'd15', label: 'En 8 a 15 días', max: 15 },
  { key: 'd30', label: 'En 16 a 30 días', max: 30 },
];

function diasHasta(fechaStr, hoy = new Date()) {
  if (!fechaStr) return null;
  const f = new Date(fechaStr.toString().substring(0, 10) + 'T12:00:00');
  const h = new Date(hoy.toISOString().substring(0, 10) + 'T12:00:00');
  return Math.round((f - h) / 86400000);
}

// Devuelve la clave de bucket, o null si está a más de 30 días.
function bucketDe(dias) {
  if (dias == null) return null;
  if (dias <= 0) return 'vencido';
  if (dias <= 7) return 'd7';
  if (dias <= 15) return 'd15';
  if (dias <= 30) return 'd30';
  return null;
}

module.exports = { BUCKETS, diasHasta, bucketDe };
