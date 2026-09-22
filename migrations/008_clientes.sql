-- ============================================================
-- E15-08 — Cliente ≠ Evento (DDL aditivo + backfill conservador)
-- Modelo: clientes (persona/empresa, permanente) ──< leads (una consulta por fiesta) ──1 evento
--         clientes ──< evento_clientes >── events   (muchos a muchos con rol; hoy un "titular" por evento)
-- Backfill: un cliente por lead existente, deduplicando por teléfono (solo dígitos) o email.
--           Lo que quede duplicado (mismo cliente con teléfonos distintos) se une a mano desde la app.
-- Idempotente: solo procesa leads sin cliente_id.
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         VARCHAR(255) NOT NULL,
  telefono       VARCHAR(50),
  telefono_norm  VARCHAR(50),
  email          VARCHAR(255),
  dni            VARCHAR(30),
  direccion      TEXT,
  tipo_cliente   VARCHAR(50) DEFAULT 'Particular',
  notas          TEXT,
  lead_origen_id UUID,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono_norm ON clientes(telefono_norm);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_cliente_id ON leads(cliente_id);

CREATE TABLE IF NOT EXISTS evento_clientes (
  evento_id  UUID NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  rol        VARCHAR(30) NOT NULL DEFAULT 'titular',
  PRIMARY KEY (evento_id, cliente_id)
);

-- ─── Backfill ────────────────────────────────────────────────────────────────
-- Clave de deduplicación por lead: teléfono solo dígitos; si no hay, email; si no hay, el propio id (sin dedupe).
CREATE TEMP TABLE tmp_claves AS
SELECT id AS lead_id, created_at,
       COALESCE(NULLIF(regexp_replace(COALESCE(telefono, ''), '\D', '', 'g'), ''),
                NULLIF(lower(trim(email)), ''),
                id::text) AS clave
  FROM leads
 WHERE cliente_id IS NULL;

-- Un cliente por clave, con los datos del lead más antiguo de esa clave
INSERT INTO clientes (nombre, telefono, telefono_norm, email, tipo_cliente, lead_origen_id, created_at)
SELECT l.nombre, l.telefono,
       NULLIF(regexp_replace(COALESCE(l.telefono, ''), '\D', '', 'g'), ''),
       NULLIF(lower(trim(l.email)), ''),
       COALESCE(l.tipo_cliente, 'Particular'),
       l.id, l.created_at
  FROM (SELECT DISTINCT ON (clave) clave, lead_id FROM tmp_claves ORDER BY clave, created_at ASC) p
  JOIN leads l ON l.id = p.lead_id
 WHERE NOT EXISTS (SELECT 1 FROM clientes c WHERE c.lead_origen_id = l.id);

-- Vincular cada lead al cliente de su clave
UPDATE leads l
   SET cliente_id = c.id
  FROM tmp_claves t
  JOIN tmp_claves o ON o.clave = t.clave
  JOIN clientes c   ON c.lead_origen_id = o.lead_id
 WHERE t.lead_id = l.id
   AND l.cliente_id IS NULL;

-- Titular de cada evento = cliente de su lead
INSERT INTO evento_clientes (evento_id, cliente_id, rol)
SELECT e.id, l.cliente_id, 'titular'
  FROM events e
  JOIN leads l ON l.id = e.lead_id
 WHERE l.cliente_id IS NOT NULL
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS tmp_claves;

-- Control:
-- SELECT count(*) AS clientes FROM clientes;
-- SELECT count(*) AS leads_sin_cliente FROM leads WHERE cliente_id IS NULL;      -- esperado 0
-- SELECT count(*) AS eventos_sin_titular FROM events e WHERE NOT EXISTS (SELECT 1 FROM evento_clientes ec WHERE ec.evento_id = e.id); -- esperado 0
-- Duplicados sospechosos (mismo nombre, distinto cliente): revisar a mano.
-- SELECT lower(nombre), count(*) FROM clientes GROUP BY 1 HAVING count(*) > 1;

-- Rollback (destructivo):
-- ALTER TABLE leads DROP COLUMN IF EXISTS cliente_id;
-- DROP TABLE IF EXISTS evento_clientes;
-- DROP TABLE IF EXISTS clientes;
