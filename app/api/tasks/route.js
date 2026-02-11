import { NextResponse } from 'next/server';
const { Task } = require('@/lib/models/associations');

// GET /api/tasks - Todas las tareas
export async function GET() {
  try {
    const tasks = await Task.findAll({
      include: [
        { association: 'lead' },
        { association: 'event' },
        { association: 'assigned_user' },
      ],
      order: [['created_at', 'DESC']],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks - Crear tarea
export async function POST(request) {
  try {
    const body = await request.json();

    const task = await Task.create({
      titulo: body.titulo || '',
      descripcion: body.descripcion || '',
      lead_id: body.lead_id || null,
      evento_id: body.evento_id || null,
      assigned_to_user_id: body.assigned_to_user_id || null,
      estado: 'Pendiente',
      prioridad: body.prioridad || 'Media',
      due_date: body.due_date || null,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
