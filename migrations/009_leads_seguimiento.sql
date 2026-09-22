-- ============================================================
-- C2-02 — Seguimiento por lead (ALTER aditivo, no destructivo)
-- Agrega leads.proximo_paso (texto) y leads.proximo_paso_fecha (vencimiento / SLA).
-- El responsable ya existe (leads.managed_by_user_id) y el último contacto sale de interactions.
-- Idempotente.
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS proximo_paso VARCHAR(255),
  ADD COLUMN IF NOT EXISTS proximo_paso_fecha DATE;

-- Rollback:
-- ALTER TABLE leads DROP COLUMN IF EXISTS proximo_paso, DROP COLUMN IF EXISTS proximo_paso_fecha;
