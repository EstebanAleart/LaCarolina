-- ============================================================
-- E15-02 — Motivo de pérdida reporteable (ALTER aditivo, no destructivo)
-- Agrega leads.motivo_perdida: categoría fija elegida al pasar a "Perdido"
-- (Precio · Fecha no disponible · Eligió otro salón · Canceló el evento · No respondió · Otro).
-- El detalle libre de "Otro" queda en lead_status_history.motivo ("Otro: ...").
-- Idempotente.
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS motivo_perdida VARCHAR(50);

-- Leads ya perdidos sin categoría: quedan como "Otro" (el texto original está en el historial).
UPDATE leads
   SET motivo_perdida = 'Otro'
 WHERE estado_actual = 'Perdido'
   AND motivo_perdida IS NULL;

-- Control:
-- SELECT motivo_perdida, count(*) FROM leads WHERE estado_actual = 'Perdido' GROUP BY 1;

-- Rollback:
-- ALTER TABLE leads DROP COLUMN IF EXISTS motivo_perdida;
