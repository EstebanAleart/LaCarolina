-- ============================================================
-- E15-06 — Estados del evento por fecha (solo datos, sin DDL)
-- Estados nuevos: En planificación → Próximo evento → Evento realizado → Post-evento / cerrado.
-- Remapea events.estado_operativo:
--   Pendiente / En preparacion / Listo → En planificación   (el sistema pasa solos a "Próximo evento"
--                                                            los que estén a ≤30 días, en la próxima lectura)
--   Realizado                          → Post-evento / cerrado (ya pasaron; su gestión post-evento no aplica)
-- Los eventos que se realicen de acá en adelante pasan a "Evento realizado" y generan tareas post-evento.
-- Idempotente.
-- ============================================================

UPDATE events
   SET estado_operativo = CASE estado_operativo
         WHEN 'Pendiente'      THEN 'En planificación'
         WHEN 'En preparacion' THEN 'En planificación'
         WHEN 'Listo'          THEN 'En planificación'
         WHEN 'Realizado'      THEN 'Post-evento / cerrado'
         ELSE estado_operativo
       END
 WHERE estado_operativo IN ('Pendiente', 'En preparacion', 'Listo', 'Realizado');

-- Control:
-- SELECT estado_operativo, count(*) FROM events GROUP BY 1 ORDER BY 2 DESC;
-- Esperado (22/09/2026): En planificación 68 · Post-evento / cerrado 36 (los 68 se reparten entre
-- "En planificación" y "Próximo evento" al abrir Eventos por primera vez).

-- Rollback: no hay (los estados viejos no se reconstruyen). Si hiciera falta volver:
-- UPDATE events SET estado_operativo = 'Pendiente' WHERE estado_operativo IN ('En planificación','Próximo evento');
-- UPDATE events SET estado_operativo = 'Realizado' WHERE estado_operativo IN ('Evento realizado','Post-evento / cerrado');
