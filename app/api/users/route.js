import { NextResponse } from 'next/server';
const { User } = require('@/lib/models/associations');

// GET /api/users - Listar todos los usuarios
export async function GET() {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nombre', 'email', 'rol', 'activo'],
      order: [['nombre', 'ASC']],
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
