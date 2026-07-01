-- ============================================================
-- Etapa 1 — Stock de cotillón (DDL)
-- Correr DESPUÉS de: node backup-local-db.js
-- La base de datos la aplica el dueño. El agente NO la toca.
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(255) NOT NULL,
  codigo          VARCHAR(255) UNIQUE,
  categoria       VARCHAR(255),
  unidad          VARCHAR(255) DEFAULT 'unidad',
  stock_actual    INTEGER NOT NULL DEFAULT 0,
  stock_minimo    INTEGER NOT NULL DEFAULT 0,
  stock_reservado INTEGER NOT NULL DEFAULT 0,
  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero      SMALLINT UNIQUE,
  nombre      VARCHAR(255) NOT NULL,
  precio      FLOAT,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combo_products (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id   UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cantidad   INTEGER NOT NULL,
  UNIQUE (combo_id, product_id)
);

-- Libro mayor de stock (append-only). cantidad va CON SIGNO.
-- ingreso/reserva: +   |   egreso/liberacion: -   |   ajuste: +/-
CREATE TABLE IF NOT EXISTS stock_movements (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tipo               VARCHAR(255) NOT NULL, -- ingreso | egreso | reserva | liberacion | ajuste
  cantidad           INTEGER NOT NULL,
  event_id           UUID REFERENCES events(id) ON DELETE SET NULL,
  combo_id           UUID REFERENCES combos(id) ON DELETE SET NULL,
  observacion        TEXT,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_combo_products_combo_id   ON combo_products(combo_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_event_id   ON stock_movements(event_id);
