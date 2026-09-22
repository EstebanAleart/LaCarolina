import { NextResponse } from 'next/server';
import { MOTIVOS_PERDIDA } from '@/lib/api';
const { Lead, LeadStatusHistory, Proposal } = require('@/lib/models/associations');
const { confirmarReservaSiCorresponde } = require('@/lib/reserva');

// PUT /api/leads/:id/status - Cambiar estado del lead con historial
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado, motivo, user_id, detalle } = body;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // E15-02: "Perdido" exige un motivo de la lista; "Otro" exige descripción.
    if (estado === 'Perdido') {
      if (!motivo || !MOTIVOS_PERDIDA.includes(motivo)) {
        return NextResponse.json(
          { error: `Motivo obligatorio para marcar como Perdido (${MOTIVOS_PERDIDA.join(' / ')})` },
          { status: 400 }
        );
      }
      if (motivo === 'Otro' && !(detalle || '').trim()) {
        return NextResponse.json({ error: 'Describí el motivo cuando elegís "Otro"' }, { status: 400 });
      }
    }

    // E15-03 / E15-04: "Reserva confirmada" solo con seña registrada + fecha reservada + contrato firmado.
    // Si se cumple, lib/reserva registra el cambio y crea el Evento; si no, se rechaza diciendo qué falta.
    if (estado === 'Reserva confirmada') {
      const r = await confirmarReservaSiCorresponde(id, { user_id: user_id || null });
      if (!r.confirmada) {
        return NextResponse.json({ error: `Para confirmar la reserva falta: ${r.faltantes.join(', ')}` }, { status: 400 });
      }
      return NextResponse.json(await Lead.findByPk(id));
    }

    const estadoAnterior = lead.estado_actual;
    const motivoHistorial = estado === 'Perdido' && motivo === 'Otro' ? `Otro: ${detalle.trim()}` : (motivo || null);

    // Crear registro de historial
    await LeadStatusHistory.create({
      lead_id: id,
      estado_anterior: estadoAnterior,
      estado_nuevo: estado,
      motivo: motivoHistorial,
      changed_by_user_id: user_id || null,
    });

    // Actualizar el lead (motivo_perdida: categoría reporteable; se limpia si sale de Perdido)
    await lead.update({
      estado_actual: estado,
      motivo_perdida: estado === 'Perdido' ? motivo : null,
      updated_at: new Date(),
    });

    // Auto-crear propuesta si no existe, para que Contratos tenga con qué trabajar.
    // El estado del contrato se gestiona exclusivamente desde la sección Contratos.
    const PROPOSAL_STATES = ['Visita realizada'];
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
