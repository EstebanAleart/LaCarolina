-- ============================================================
-- Etapa 2 — Motor genérico de servicios (DDL)
-- Correr DESPUÉS de backup. Aditivo: solo crea tablas nuevas.
-- ============================================================

-- Registro parametrizable de tipos de servicio
CREATE TABLE IF NOT EXISTS service_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo     VARCHAR(255) NOT NULL UNIQUE,
  nombre     VARCHAR(255) NOT NULL,
  icono      VARCHAR(255),
  color      VARCHAR(255),
  usa_stock  BOOLEAN DEFAULT false,
  usa_combo  BOOLEAN DEFAULT false,
  activo     BOOLEAN DEFAULT true,
  orden      INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servicios contratados por evento (cada uno con su cuenta corriente vía payments.service_id)
CREATE TABLE IF NOT EXISTS event_services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  service_type_id  UUID NOT NULL REFERENCES service_types(id),
  estado           VARCHAR(255) DEFAULT 'Contratado',
  total_contratado DOUBLE PRECISION DEFAULT 0,
  combo_id         UUID REFERENCES combos(id) ON DELETE SET NULL,
  metadata         JSONB DEFAULT '{}'::jsonb,
  observaciones    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_services_event_id ON event_services(event_id);
CREATE INDEX IF NOT EXISTS idx_event_services_type     ON event_services(service_type_id);
