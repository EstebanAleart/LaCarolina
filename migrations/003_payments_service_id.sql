-- ============================================================
-- Etapa 3 — Pagos por servicio (ALTER aditivo, no destructivo)
-- Agrega payments.service_id (nullable). NULL = pago a nivel evento
-- (sin asignar a un servicio). Compatible 100% hacia atrás.
-- ============================================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES event_services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_service_id ON payments(service_id);
