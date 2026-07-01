import { NextResponse } from 'next/server';
const { Event, Lead, EventService, ServiceType, Combo, Payment } = require('@/lib/models/associations');
const { diasHasta, bucketDe } = require('@/lib/alerts');
const { resumenEvento, cobradoDe } = require('@/lib/services');

// GET /api/alerts — eventos próximos (≤30 días) o recién vencidos, con servicios, combo y saldo.
export async function GET() {
  try {
    const hoy = new Date();
    const events = await Event.findAll({
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'nombre', 'telefono'] },
        {
          model: EventService, as: 'services',
          include: [
            { model: ServiceType, as: 'service_type', attributes: ['nombre', 'usa_combo'] },
            { model: Combo, as: 'combo', attributes: ['numero', 'nombre'] },
            { model: Payment, as: 'payments' },
          ],
        },
        { model: Payment, as: 'payments' },
      ],
    });

    const alertas = [];
    for (const ev of events) {
      if (ev.estado_operativo === 'Realizado' || ev.estado_operativo === 'Cancelado') continue;
      const dias = diasHasta(ev.fecha_confirmada, hoy);
      if (dias == null || dias > 30 || dias < -30) continue;
      const bucket = bucketDe(dias);
      if (!bucket) continue;

      const services = ev.services || [];
      const serviciosNombres = services.length
        ? services.map(s => s.service_type?.nombre).filter(Boolean)
        : (Array.isArray(ev.servicios_contratados) ? ev.servicios_contratados : []);

      const cotillon = services.find(s => s.service_type?.usa_combo && s.combo);
      const combo = cotillon?.combo ? `${cotillon.combo.nombre}` : null;

      // Saldo: por servicio si hay desglose, si no el total general (fallback)
      let saldo;
      if (services.length) {
        const withPagos = services.map(s => ({ ...s.toJSON(), payments: s.payments || [] }));
        const sinAsignar = (ev.payments || []).filter(p => !p.service_id);
        saldo = resumenEvento(withPagos, sinAsignar).saldoTotal;
      } else {
        saldo = (ev.valor_total_evento || 0) - cobradoDe(ev.payments || []);
      }

      alertas.push({
        event_id: ev.id,
        cliente: ev.lead?.nombre || 'Sin cliente',
        telefono: ev.lead?.telefono || null,
        fecha: ev.fecha_confirmada,
        dias,
        bucket,
        servicios: serviciosNombres,
        combo,
        saldo,
      });
    }

    alertas.sort((a, b) => a.dias - b.dias);
    return NextResponse.json(alertas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
