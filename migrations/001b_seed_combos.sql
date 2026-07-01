-- ============================================================
-- Etapa 1 — Seed de combos de cotillón (DATOS)
-- Correr DESPUÉS de 001_stock.sql.  Idempotente (ON CONFLICT DO NOTHING).
-- Fuente: "lo que hay que hacer.md" → sección COMBOS COTILLÓN.
--
-- COMBO 3: el dueño confirmó que lleva "Tubo pulsera neon x100" → total 341
--    (los 18 ítems listados en el doc sumaban 241; el doc declaraba 341).
--    Al final hay un SELECT de verificación de totales (1=200, 2=330, 3=341).
-- ============================================================

-- IMPORTANTE: el archivo está en UTF-8. Sin esto, psql en Windows lee los
-- acentos con el codepage local y los guarda corruptos (mojibake).
SET client_encoding TO 'UTF8';

-- ---------- PRODUCTOS (unión de los 3 combos, 20 productos) ----------
INSERT INTO products (nombre, codigo, categoria, unidad) VALUES
  ('Sombrero Bombin Fluo',                          'COT-SOMB-BOMBIN',  'Cotillón', 'unidad'),
  ('Antifaz fluo',                                   'COT-ANTIFAZ',      'Cotillón', 'unidad'),
  ('Tiara hawaiana',                                 'COT-TIARA-HAW',    'Cotillón', 'unidad'),
  ('Asusta suegra',                                  'COT-ASUSTA',       'Cotillón', 'unidad'),
  ('Moño fluo / estampado',                          'COT-MONO',         'Cotillón', 'unidad'),
  ('Corbata Fluo',                                   'COT-CORBATA',      'Cotillón', 'unidad'),
  ('Silbato pelota fluo',                            'COT-SILBATO',      'Cotillón', 'unidad'),
  ('Anteojos plásticos mariposas/manos surtidos',   'COT-ANT-MARIPOSA', 'Cotillón', 'unidad'),
  ('Anteojos plásticos circulos',                    'COT-ANT-CIRCULO',  'Cotillón', 'unidad'),
  ('Collar hawaiano fluo',                           'COT-COLLAR-HAW',   'Cotillón', 'unidad'),
  ('Maraca choclo',                                  'COT-MARACA',       'Cotillón', 'unidad'),
  ('Rompecoco luminoso',                             'COT-ROMPECOCO',    'Cotillón', 'unidad'),
  ('Tubo pulsera neon',                              'COT-TUBO-NEON',    'Cotillón', 'unidad'),
  ('Sombrero tanguero',                              'COT-SOMB-TANGO',   'Cotillón', 'unidad'),
  ('Sombreros cowboy fluo',                          'COT-SOMB-COWBOY',  'Cotillón', 'unidad'),
  ('Sombreros vaquero',                              'COT-SOMB-VAQUERO', 'Cotillón', 'unidad'),
  ('Tiara Luminosa',                                 'COT-TIARA-LUM',    'Cotillón', 'unidad'),
  ('Capa Luminosa ala led 110 cm',                  'COT-CAPA-LED',     'Cotillón', 'unidad'),
  ('Anteojos acrílicos estrellas',                   'COT-ANT-ESTRELLA', 'Cotillón', 'unidad'),
  ('Anteojos acrílicos corazón',                     'COT-ANT-CORAZON',  'Cotillón', 'unidad')
ON CONFLICT (codigo) DO NOTHING;

-- ---------- COMBOS ----------
INSERT INTO combos (numero, nombre, precio, descripcion) VALUES
  (1, 'Combo 1', 130000, 'Combo cotillón 1 — 200 unidades'),
  (2, 'Combo 2', 250000, 'Combo cotillón 2 — 330 unidades'),
  (3, 'Combo 3', 380000, 'Combo cotillón 3 — 341 unidades')
ON CONFLICT (numero) DO NOTHING;

-- ---------- COMBO 1 (suma 200) ----------
INSERT INTO combo_products (combo_id, product_id, cantidad)
SELECT c.id, p.id, v.cantidad
FROM (VALUES
  ('COT-SOMB-BOMBIN', 20), ('COT-ANTIFAZ', 15), ('COT-TIARA-HAW', 25),
  ('COT-ASUSTA', 45), ('COT-MONO', 15), ('COT-CORBATA', 10),
  ('COT-SILBATO', 15), ('COT-ANT-MARIPOSA', 10), ('COT-ANT-CIRCULO', 25),
  ('COT-COLLAR-HAW', 20)
) AS v(codigo, cantidad)
JOIN products p ON p.codigo = v.codigo
JOIN combos   c ON c.numero = 1
ON CONFLICT (combo_id, product_id) DO NOTHING;

-- ---------- COMBO 2 (suma 330) ----------
INSERT INTO combo_products (combo_id, product_id, cantidad)
SELECT c.id, p.id, v.cantidad
FROM (VALUES
  ('COT-SOMB-BOMBIN', 20), ('COT-ANTIFAZ', 10), ('COT-TIARA-HAW', 30),
  ('COT-MARACA', 10), ('COT-ROMPECOCO', 10), ('COT-ASUSTA', 30),
  ('COT-MONO', 25), ('COT-CORBATA', 15), ('COT-SILBATO', 30),
  ('COT-TUBO-NEON', 100), ('COT-ANT-MARIPOSA', 15), ('COT-ANT-CIRCULO', 15),
  ('COT-COLLAR-HAW', 20)
) AS v(codigo, cantidad)
JOIN products p ON p.codigo = v.codigo
JOIN combos   c ON c.numero = 2
ON CONFLICT (combo_id, product_id) DO NOTHING;

-- ---------- COMBO 3 (ítems listados suman 241; doc dice 341) ----------
INSERT INTO combo_products (combo_id, product_id, cantidad)
SELECT c.id, p.id, v.cantidad
FROM (VALUES
  ('COT-SOMB-TANGO', 5), ('COT-SOMB-BOMBIN', 10), ('COT-SOMB-COWBOY', 3),
  ('COT-SOMB-VAQUERO', 2), ('COT-TIARA-HAW', 35), ('COT-TIARA-LUM', 5),
  ('COT-MARACA', 20), ('COT-ROMPECOCO', 20), ('COT-ASUSTA', 20),
  ('COT-MONO', 25), ('COT-CAPA-LED', 1), ('COT-CORBATA', 15),
  ('COT-ANT-ESTRELLA', 5), ('COT-ANT-CORAZON', 5), ('COT-SILBATO', 25),
  ('COT-ANT-MARIPOSA', 25), ('COT-ANT-CIRCULO', 10), ('COT-COLLAR-HAW', 10),
  ('COT-TUBO-NEON', 100)  -- confirmado por el dueño: Combo 3 lleva Tubo pulsera neon x100 → total 341
) AS v(codigo, cantidad)
JOIN products p ON p.codigo = v.codigo
JOIN combos   c ON c.numero = 3
ON CONFLICT (combo_id, product_id) DO NOTHING;

-- ---------- VERIFICACIÓN DE TOTALES ----------
-- Esperado: 1 => 200 | 2 => 330 | 3 => 341
SELECT c.numero, COUNT(*) AS items, SUM(cp.cantidad) AS total_unidades
FROM combos c
JOIN combo_products cp ON cp.combo_id = c.id
GROUP BY c.numero
ORDER BY c.numero;
