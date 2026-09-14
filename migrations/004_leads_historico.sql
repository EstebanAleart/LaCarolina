-- ============================================================
-- R-03 — Cartera histórica en leads (ALTER aditivo, no destructivo)
-- Agrega leads.es_historico (default false) y marca como históricos los
-- leads cargados en la puesta en marcha (marzo 2026): clientes que ya
-- tenían contrato firmado antes de usar la app. El dashboard y reportes
-- calculan conversión y pipeline SIN estos leads. Los eventos y pagos de
-- esos clientes no cambian.
-- Idempotente: se puede correr dos veces.
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS es_historico BOOLEAN NOT NULL DEFAULT false;

-- Carga inicial: todo lead creado hasta el 25 de marzo de 2026 inclusive (hora Argentina),
-- última jornada de carga masiva. Los 3 del 31/03 quedan operativos (uno firmó recién en mayo).
UPDATE leads
   SET es_historico = true
 WHERE created_at < TIMESTAMPTZ '2026-03-26 00:00:00-03'
   AND es_historico = false;

-- Control: debería dar 72 históricos / 36 operativos (al 14/09/2026).
-- SELECT es_historico, count(*) FROM leads GROUP BY 1;

-- Rollback:
-- ALTER TABLE leads DROP COLUMN IF EXISTS es_historico;
