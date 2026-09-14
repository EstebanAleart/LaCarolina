-- ============================================================
-- Etapa 1 — ROLLBACK del stock de cotillón
-- Revierte 001_stock.sql + 001b_seed_combos.sql.
-- ⚠️ DESTRUCTIVO: borra las tablas de stock y sus datos.
--    Solo correr si querés deshacer la Etapa 1. Hacer backup antes.
-- ============================================================

DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS combo_products;
DROP TABLE IF EXISTS combos;
DROP TABLE IF EXISTS products;
