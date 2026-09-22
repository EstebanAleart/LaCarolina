-- ============================================================
-- E15-01 — Pipeline comercial de 4 estados (solo datos, sin DDL)
-- Estados nuevos: Lead nuevo → Visita agendada → Visita realizada → Reserva confirmada, más Perdido.
-- Remapea leads.estado_actual de los estados viejos a los nuevos. El historial
-- (lead_status_history) conserva los nombres viejos: es historia, no se toca.
-- Idempotente: se puede correr dos veces.
-- ============================================================

UPDATE leads
   SET estado_actual = CASE estado_actual
         WHEN 'Contactado'                THEN 'Lead nuevo'
         WHEN 'Esperando visita'          THEN 'Visita agendada'
         WHEN 'Visita al salón realizada' THEN 'Visita realizada'
         WHEN 'Enviar propuesta'          THEN 'Visita realizada'
         WHEN 'Propuesta enviada'         THEN 'Visita realizada'
         WHEN 'Propuesta Aceptada'        THEN 'Visita realizada'
         WHEN 'Propuesta Rechazada'       THEN 'Visita realizada'
         WHEN 'Esperando Reserva'         THEN 'Visita realizada'
         WHEN 'Reserva tomada'            THEN 'Reserva confirmada'
         WHEN 'Contrato firmado'          THEN 'Reserva confirmada'
         WHEN 'Cliente activo'            THEN 'Reserva confirmada'
         WHEN 'Evento realizado'          THEN 'Reserva confirmada'
         WHEN 'Post-evento / cerrado'     THEN 'Reserva confirmada'
         ELSE estado_actual
       END,
       updated_at = now()
 WHERE estado_actual NOT IN ('Lead nuevo', 'Visita agendada', 'Visita realizada', 'Reserva confirmada', 'Perdido');

-- Control: no debe quedar ningún estado fuera de los 5.
-- SELECT estado_actual, count(*) FROM leads GROUP BY 1 ORDER BY 2 DESC;
-- Esperado al 22/09/2026: Reserva confirmada 103 · Visita realizada 3 · Lead nuevo 1 · Perdido 1

-- Rollback: no hay (los estados viejos no se pueden reconstruir desde el estado actual;
-- están en lead_status_history si hiciera falta).
