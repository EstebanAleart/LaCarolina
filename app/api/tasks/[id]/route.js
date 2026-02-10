import { NextResponse } from 'next/server';
const { Task } = require('@/lib/models/associations');

// PUT /api/tasks/:id - Actualizar tarea
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const task = await Task.findByPk(id);
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    await task.update(body);

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Eliminar tarea
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const task = await Task.findByPk(id);
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    await task.destroy();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
