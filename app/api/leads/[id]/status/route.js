import { NextResponse } from 'next/server';
const { Lead, LeadStatusHistory, Proposal, CalendarDate, Reservation } = require('@/lib/models/associations');

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

    // E15-01: "Reserva confirmada" = la seña está tomada. Si el lead tiene fecha tentativa y esa fecha
    // todavía no está en el calendario para este lead, se reserva (Reservada + Reservation).
    // El Event y la fecha "Confirmada" los crea el contrato al firmarse (sección Contratos).
    if (estado === 'Reserva confirmada' && lead.fecha_tentativa) {
      const fechaEvento = new Date(lead.fecha_tentativa).toISOString().substring(0, 10);
      let calDate = await CalendarDate.findOne({ where: { fecha: fechaEvento, lead_id: id } });
      if (!calDate) {
        calDate = await CalendarDate.create({
          fecha: fechaEvento,
          estado_fecha: 'Reservada',
          fuente: 'CRM',
          lead_id: id,
          evento_id: null,
        });
      }
      const existingRes = await Reservation.findOne({ where: { lead_id: id } });
      if (!existingRes) {
        await Reservation.create({ lead_id: id, calendar_date_id: calDate.id, estado: 'Pendiente' });
      }
    }

    // Auto-crear propuesta si no existe, para que Contratos tenga con qué trabajar.
    // El estado del contrato se gestiona exclusivamente desde la sección Contratos.
    const PROPOSAL_STATES = ['Visita realizada', 'Reserva confirmada'];
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
