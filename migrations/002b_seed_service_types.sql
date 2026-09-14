-- ============================================================
-- Etapa 2 — Seed de tipos de servicio. Idempotente.
-- ============================================================
SET client_encoding TO 'UTF8';  -- evitar mojibake en acentos

INSERT INTO service_types (codigo, nombre, icono, color, usa_stock, usa_combo, orden) VALUES
  ('salon',      'Salón',             'Building2',   'violet', false, false, 1),
  ('catering',   'Tarjetas / Catering','Utensils',   'amber',  false, false, 2),
  ('cotillon',   'Cotillón',          'PartyPopper', 'rose',   true,  true,  3),
  ('decoracion', 'Decoración',        'Flower2',     'pink',   false, false, 4),
  ('mobiliario', 'Mobiliario',        'Armchair',    'stone',  false, false, 5),
  ('pantalla',   'Pantalla',          'MonitorPlay', 'sky',    false, false, 6),
  ('mesa_dulce', 'Mesa Dulce',        'CakeSlice',   'fuchsia',false, false, 7),
  ('cabana',     'Cabaña',            'Home',        'emerald',false, false, 8),
  ('fotografia', 'Fotografía',        'Camera',      'indigo', false, false, 9),
  ('adicional',  'Adicional',         'Plus',        'gray',   false, false, 10)
ON CONFLICT (codigo) DO NOTHING;
