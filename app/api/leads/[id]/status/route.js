import { NextResponse } from 'next/server';
const { Lead, LeadStatusHistory, Task, Proposal, Event, CalendarDate } = require('@/lib/models/associations');

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

    // Automatización: si pasa a "Enviar propuesta", crear task para enviar el documento
    if (estado === 'Enviar propuesta') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      await Task.create({
        titulo: `Enviar propuesta - ${lead.nombre}`,
        descripcion: 'Preparar y enviar propuesta al cliente',
        lead_id: id,
        assigned_to_user_id: user_id || null,
        estado: 'Pendiente',
        prioridad: 'Alta',
        due_date: dueDate,
      });
    }

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

    // Auto-set fecha_firma_contrato si no estaba seteada
    if (estado === 'Contrato firmado' && !lead.fecha_firma_contrato) {
      await lead.update({ fecha_firma_contrato: new Date(), updated_at: new Date() });
    }

    // Auto-crear Event + confirmar fecha al firmar contrato
    if (estado === 'Contrato firmado' && lead.fecha_tentativa) {
      const fechaEvento = new Date(lead.fecha_tentativa).toISOString().substring(0, 10);

      // Crear Event si no existe
      let evt = await Event.findOne({ where: { lead_id: id } });
      if (!evt) {
        // Buscar la última propuesta aceptada para copiar datos del contrato
        const contrato = await Proposal.findOne({
          where: { lead_id: id, estado: 'Firmada' },
          order: [['created_at', 'DESC']],
        });
        const serviciosBase = contrato?.servicios_base || [];
        const adicionalesElegidos = (contrato?.adicionales || [])
          .filter(a => a.opcion_elegida !== null && a.opcion_elegida !== undefined)
          .map(a => a.nombre);
        evt = await Event.create({
          lead_id: id,
          fecha_confirmada: fechaEvento,
          tipo_evento: contrato?.tipo_evento || lead.tipo_evento || '',
          invitados_estimados: contrato?.invitados_estimados || lead.invitados_estimados || 0,
          servicios_contratados: [...serviciosBase, ...adicionalesElegidos],
          estado_operativo: 'Pendiente',
          estado_pago: 'Pendiente',
          modalidad_actualizacion_precios: contrato?.modalidad_actualizacion_precios || 'Precio fijo',
          valor_total_evento: contrato?.valor_total_evento || lead.valor_estimado || null,
          menu_seleccionado: contrato?.menu_seleccionado || null,
          minimo_tarjetas: contrato?.minimo_tarjetas || null,
          valor_tarjeta_adulto: contrato?.valor_tarjeta_adulto || null,
          valor_tarjeta_adolescente: contrato?.valor_tarjeta_adolescente || null,
          valor_tarjeta_nino: contrato?.valor_tarjeta_nino || null,
        });
      }

      // Actualizar/crear el CalendarDate de este lead específico a "Confirmada"
      const calDate = await CalendarDate.findOne({ where: { fecha: fechaEvento, lead_id: id } });
      if (calDate) {
        await calDate.update({ estado_fecha: 'Confirmada', evento_id: evt.id });
      } else {
        await CalendarDate.create({
          fecha: fechaEvento,
          estado_fecha: 'Confirmada',
          fuente: 'CRM',
          lead_id: id,
          evento_id: evt.id,
        });
      }
    }

    // Auto-crear propuesta si no existe para estados avanzados del pipeline
    // El estado del contrato se gestiona exclusivamente desde la sección Contratos
    const PROPOSAL_STATES = ['Enviar propuesta', 'Propuesta enviada', 'Visita al salón realizada', 'Reserva tomada', 'Contrato firmado'];
    if (PROPOSAL_STATES.includes(estado)) {
      const existingProposal = await Proposal.findOne({ where: { lead_id: id } });
      if (!existingProposal) {
        await Proposal.create({
          lead_id: id,
          version: 1,
          estado: 'Creada',
          precio_total: lead.valor_estimado || 0,
          precio_senia: lead.valor_estimado || 0,
          invitados_estimados: lead.invitados_estimados || 0,
        });
      }
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
