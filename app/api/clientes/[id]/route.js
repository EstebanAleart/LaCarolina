import { NextResponse } from 'next/server';
const { Cliente, Lead, Event } = require('@/lib/models/associations');
const { normTelefono, normEmail } = require('@/lib/clientes');

// GET /api/clientes/:id — ficha del cliente con sus leads y sus eventos (E15-08)
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cliente = await Cliente.findByPk(id, {
      include: [
        { model: Lead, as: 'leads', attributes: ['id', 'nombre', 'tipo_evento', 'estado_actual', 'fecha_tentativa', 'created_at'] },
        { model: Event, as: 'eventos', attributes: ['id', 'fecha_confirmada', 'tipo_evento', 'estado_operativo', 'estado_pago', 'valor_total_evento'], through: { attributes: ['rol'] } },
      ],
      order: [[{ model: Lead, as: 'leads' }, 'created_at', 'DESC']],
    });
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    return NextResponse.json(cliente);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/clientes/:id — editar datos del cliente
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    const { id: _id, created_at, lead_origen_id, ...data } = body;
    if (data.telefono !== undefined) data.telefono_norm = normTelefono(data.telefono);
    if (data.email !== undefined) data.email = normEmail(data.email);
    await cliente.update({ ...data, updated_at: new Date() });
    return NextResponse.json(cliente);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
