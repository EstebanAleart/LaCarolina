# Runbook de migraciones — CarolinaOS

Reglas: la DB la aplica el dueño. Backup antes. Primero LOCAL, validar, y recién después prod.
`psql`/`pg_dump` están en `C:\Program Files\PostgreSQL\18\bin\` (llamar por ruta completa con `&`).
Seeds con acentos: setear `$env:PGCLIENTENCODING="UTF8"` antes (si no, mojibake).

Atajos (PowerShell):
```powershell
$PSQL = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$LOCAL = "postgresql://postgres:Pedito1986%21@localhost:5432/lacarolina"
$M = "C:\Users\esteb\Desktop\proyectos\LaCarolina\migrations"
```

## Etapa 1 — Stock (YA APLICADA en local)
- `001_stock.sql` (tablas products/combos/combo_products/stock_movements)
- `001b_seed_combos.sql` (combos 1=200, 2=330, 3=341) — correr con PGCLIENTENCODING=UTF8
- Rollback: `001_stock_rollback.sql`

## Etapa 2 + 3 — Motor de servicios + pagos/saldos por servicio
Backup local opcional (el `backups-local/prod_public.dump` sirve de punto de restauración):
```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" $LOCAL -Fc -f "backups-local/local_pre_etapa2.dump"
```

1) Tablas del motor de servicios:
```powershell
& $PSQL $LOCAL -f "$M\002_service_engine.sql"
```
2) Seed de tipos de servicio (UTF-8):
```powershell
$env:PGCLIENTENCODING="UTF8"; & $PSQL $LOCAL -f "$M\002b_seed_service_types.sql"
```
3) Columna service_id en pagos:
```powershell
& $PSQL $LOCAL -f "$M\003_payments_service_id.sql"
```
4) (OPCIONAL — por defecto NO se corre) Backfill de servicios para eventos viejos.
   Decisión actual: los eventos ya creados se dejan tal cual (la ficha muestra su total
   general como fallback). El desglose por servicio se usa de los eventos NUEVOS en adelante.
   Si algún día querés desglosar también los viejos:
```powershell
node backfill-event-services.js          # dry-run, no escribe
node backfill-event-services.js --apply  # aplica en local
```
5) Validar: `pnpm dev:local` → Eventos → abrir un evento → "Ficha del evento".
   - Evento viejo: muestra el total general (fallback). Evento nuevo: agregás servicios y se desglosa.

Rollback Etapa 2-3 (destructivo, solo si hace falta):
```sql
ALTER TABLE payments DROP COLUMN IF EXISTS service_id;
DROP TABLE IF EXISTS event_services;
DROP TABLE IF EXISTS service_types;
```
