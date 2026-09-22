import { NextResponse } from 'next/server';
const { Op } = require('sequelize');
const { Cliente } = require('@/lib/models/associations');
const { buscarOCrearCliente, normTelefono } = require('@/lib/clientes');

// GET /api/clientes?q=texto — buscar clientes por nombre, teléfono o email (E15-08)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const where = {};
    if (q) {
      const tel = normTelefono(q);
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q.toLowerCase()}%` } },
        ...(tel ? [{ telefono_norm: { [Op.like]: `%${tel}%` } }] : []),
      ];
    }
    const clientes = await Cliente.findAll({ where, order: [['nombre', 'ASC']], limit: q ? 20 : 500 });
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clientes — crear (o devolver el existente si coincide teléfono/email)
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.nombre) return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
    const cliente = await buscarOCrearCliente(Cliente, body);
    if (body.dni || body.direccion || body.notas) {
      await cliente.update({ dni: body.dni ?? cliente.dni, direccion: body.direccion ?? cliente.direccion, notas: body.notas ?? cliente.notas, updated_at: new Date() });
    }
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
