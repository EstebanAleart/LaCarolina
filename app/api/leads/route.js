import { NextResponse } from 'next/server';
const { Lead, Interaction, Proposal, Visit, Reservation, Event, LeadStatusHistory, CalendarDate } = require('@/lib/models/associations');

// GET /api/leads - Listar todos los leads (con filtros opcionales)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const anio = searchParams.get('anio');

    const where = {};
    if (estado) where.estado_actual = estado;
    if (anio) where.anio_evento = parseInt(anio);

    const leads = await Lead.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/leads - Crear nuevo lead
export async function POST(request) {
  try {
    const body = await request.json();

    // Auto-calcular fecha_limite_pago_total si se provee fecha_tentativa
    let fechaLimitePago = null;
    if (body.fecha_tentativa) {
      const fl = new Date(body.fecha_tentativa);
      fl.setDate(fl.getDate() - 30);
      fechaLimitePago = fl.toISOString().substring(0, 10);
    }

    const lead = await Lead.create({
      nombre: body.nombre,
      telefono: body.telefono || '',
      email: body.email || '',
      canal_origen: body.canal_origen || 'WhatsApp',
      tipo_evento: body.tipo_evento || 'Fiesta de 15',
      tipo_cliente: body.tipo_cliente || 'Particular',
      fecha_tentativa: body.fecha_tentativa || null,
      fecha_visita_salon: body.fecha_visita_salon || null,
      fecha_limite_pago_total: fechaLimitePago,
      anio_evento: body.anio_evento || new Date().getFullYear(),
      estado_actual: 'Lead nuevo',
      valor_estimado: body.valor_estimado || 0,
      notas: body.notas || '',
    });

    // Sync: si se estableció fecha_visita_salon, crear CalendarDate como "Visita"
    if (body.fecha_visita_salon) {
      const fechaVisita = body.fecha_visita_salon.toString().substring(0, 10);
      const existingCalDate = await CalendarDate.findOne({ where: { fecha: fechaVisita } });
      if (!existingCalDate) {
        await CalendarDate.create({
          fecha: fechaVisita,
          estado_fecha: 'Visita',
          fuente: 'CRM',
          lead_id: lead.id,
          nota: `Visita al salón: ${lead.nombre}`,
        });
      } else if (existingCalDate.estado_fecha === 'Disponible' || existingCalDate.estado_fecha === 'Visita') {
        await existingCalDate.update({
          estado_fecha: 'Visita',
          lead_id: lead.id,
          nota: `Visita al salón: ${lead.nombre}`,
        });
      }
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
