import { NextResponse } from 'next/server';
const { Lead, LeadStatusHistory, Task, Proposal } = require('@/lib/models/associations');

// PUT /api/leads/:id/status - Cambiar estado del lead con historial
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado, motivo, user_id } = body;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Regla: motivo obligatorio para "Perdido"
    if (estado === 'Perdido' && !motivo) {
      return NextResponse.json(
        { error: 'Motivo obligatorio para marcar como Perdido' },
        { status: 400 }
      );
    }

    const estadoAnterior = lead.estado_actual;

    // Crear registro de historial
    await LeadStatusHistory.create({
      lead_id: id,
      estado_anterior: estadoAnterior,
      estado_nuevo: estado,
      motivo: motivo || null,
      changed_by_user_id: user_id || null,
    });

    // Actualizar el lead
    await lead.update({
      estado_actual: estado,
      updated_at: new Date(),
    });

    // Automatización: si pasa a "Propuesta enviada", crear task de seguimiento
    if (estado === 'Propuesta enviada') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      await Task.create({
        titulo: `Seguimiento propuesta - ${lead.nombre}`,
        descripcion: 'Hacer seguimiento de propuesta enviada',
        lead_id: id,
        assigned_to_user_id: user_id || null,
        estado: 'Pendiente',
        prioridad: 'Alta',
        due_date: dueDate,
      });
    }

    // Auto-actualizar última propuesta según nuevo estado del lead
    if (estado === 'Reserva tomada' || estado === 'Evento confirmado') {
      const lastProposal = await Proposal.findOne({
        where: { lead_id: id },
        order: [['created_at', 'DESC']],
      });
      if (lastProposal && lastProposal.estado !== 'Aceptada') {
        await lastProposal.update({
          estado: 'Aceptada',
          fecha_envio: lastProposal.fecha_envio || new Date(),
        });
      }
    }

    if (estado === 'Perdido') {
      const lastProposal = await Proposal.findOne({
        where: { lead_id: id },
        order: [['created_at', 'DESC']],
      });
      if (lastProposal && lastProposal.estado !== 'Rechazada' && lastProposal.estado !== 'Aceptada') {
        await lastProposal.update({ estado: 'Rechazada' });
      }
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
