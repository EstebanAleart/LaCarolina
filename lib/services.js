// Lógica pura de saldos por servicio (sin DB), testeable.
// Regla: saldo de un servicio = total_contratado − Σ(pagos confirmados; devolución resta).
// Los saldos NUNCA se mezclan entre servicios. El evento muestra el consolidado.

function cobradoDe(payments = []) {
  let total = 0;
  for (const p of payments) {
    if (p.estado !== 'confirmado') continue;
    if (p.tipo === 'devolucion') total -= p.monto;
    else total += p.monto;
  }
  return total;
}

// svc: { total_contratado, payments: [...] } → { total, cobrado, saldo }
function saldoServicio(svc) {
  const total = svc.total_contratado || 0;
  const cobrado = cobradoDe(svc.payments || []);
  return { total, cobrado, saldo: total - cobrado };
}

// Consolidado del evento: servicios + pagos sin asignar (service_id null).
function resumenEvento(services = [], pagosSinAsignar = []) {
  const porServicio = services.map((s) => ({ id: s.id, ...saldoServicio(s) }));
  const totalContratado = porServicio.reduce((a, s) => a + s.total, 0);
  const cobradoServicios = porServicio.reduce((a, s) => a + s.cobrado, 0);
  const cobradoSinAsignar = cobradoDe(pagosSinAsignar);
  const cobradoTotal = cobradoServicios + cobradoSinAsignar;
  return {
    porServicio,
    totalContratado,
    cobradoTotal,
    cobradoSinAsignar,
    saldoTotal: totalContratado - cobradoTotal,
  };
}

module.exports = { cobradoDe, saldoServicio, resumenEvento };
