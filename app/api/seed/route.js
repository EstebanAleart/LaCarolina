import { NextResponse } from 'next/server';
const { User } = require('@/lib/models/associations');

// POST /api/seed - Crear usuarios demo si la tabla está vacía
export async function POST() {
  try {
    const count = await User.count();
    if (count > 0) {
      return NextResponse.json({ message: 'Ya existen usuarios', seeded: false });
    }

    await User.bulkCreate([
      {
        nombre: 'Carolina',
        email: 'admin@carolina.com',
        password_hash: 'admin123',
        rol: 'Admin',
        activo: true,
      },
      {
        nombre: 'Maria',
        email: 'maria@carolina.com',
        password_hash: 'maria123',
        rol: 'Comercial',
        activo: true,
      },
      {
        nombre: 'Luis',
        email: 'luis@carolina.com',
        password_hash: 'luis123',
        rol: 'Operaciones',
        activo: true,
      },
    ]);

    return NextResponse.json({ message: 'Usuarios demo creados', seeded: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
