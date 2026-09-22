import { NextResponse } from 'next/server';
const { Op } = require('sequelize');
const { Lead, Reservation, CalendarDate } = require('@/lib/models/associations');
const { confirmarReservaSiCorresponde } = require('@/lib/reserva');

const fechaISO = (d) => (d ? new Date(d).toISOString().substring(0, 10) : null);

// POST /api/leads/:id/senia — Registrar la seña de un lead (E15-03).
// body: { monto, fecha_pago?, metodo_pago?, user_id? }
// - Reserva la fecha del lead en el calendario (Reservada) si todavía no está.
// - Guarda la seña en reservations (estado Pagada).
// - Si además hay contrato firmado → Reserva confirmada + Evento (lib/reserva).
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const monto = Number(body.monto);
    if (!monto || monto <= 0) {
      return NextResponse.json({ error: 'El monto de la seña debe ser mayor a 0' }, { status: 400 });
    }

    const lead = await Lead.findByPk(id);
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

    // Fecha del evento: la que ya tenga en el calendario o, si no, la tentativa del lead
    let calDate = await CalendarDate.findOne({ where: { lead_id: id, estado_fecha: ['Reservada', 'Confirmada'] }, order: [['fecha', 'ASC']] });
    if (!calDate) {
      const fecha = fechaISO(lead.fecha_tentativa);
      if (!fecha) {
        return NextResponse.json({ error: 'Cargá la fecha tentativa del evento antes de registrar la seña' }, { status: 400 });
      }
      const ocupada = await CalendarDate.findOne({
        where: { fecha, lead_id: { [Op.ne]: id }, estado_fecha: { [Op.in]: ['Reservada', 'Confirmada'] } },
      });
      if (ocupada) {
        return NextResponse.json({ error: `La fecha ${fecha} ya está reservada o confirmada para otro cliente` }, { status: 409 });
      }
      const propia = await CalendarDate.findOne({ where: { fecha, lead_id: id } });
      calDate = propia
        ? await propia.update({ estado_fecha: 'Reservada', nota: `Seña: ${lead.nombre}` })
        : await CalendarDate.create({ fecha, estado_fecha: 'Reservada', fuente: 'CRM', lead_id: id, evento_id: null, nota: `Seña: ${lead.nombre}` });
    }

    const datos = {
      calendar_date_id: calDate.id,
      monto_senia: monto,
      fecha_pago: body.fecha_pago || new Date(),
      metodo_pago: body.metodo_pago || 'efectivo',
      estado: 'Pagada',
    };
    let reservation = await Reservation.findOne({ where: { lead_id: id } });
    reservation = reservation ? await reservation.update(datos) : await Reservation.create({ lead_id: id, ...datos });

    const r = await confirmarReservaSiCorresponde(id, { user_id: body.user_id || null });

    return NextResponse.json({ reservation, calendar_date: calDate, confirmada: r.confirmada, faltantes: r.faltantes, event: r.event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
