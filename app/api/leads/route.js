import { NextResponse } from 'next/server';
const { Lead, Interaction, Proposal, Visit, Reservation, Event, LeadStatusHistory } = require('@/lib/models/associations');

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

    const lead = await Lead.create({
      nombre: body.nombre,
      telefono: body.telefono || '',
      email: body.email || '',
      canal_origen: body.canal_origen || 'WhatsApp',
      tipo_evento: body.tipo_evento || 'Fiesta de 15',
      tipo_cliente: body.tipo_cliente || 'Particular',
      fecha_tentativa: body.fecha_tentativa || null,
      anio_evento: body.anio_evento || new Date().getFullYear(),
      estado_actual: 'Lead nuevo',
      valor_estimado: body.valor_estimado || 0,
      notas: body.notas || '',
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
