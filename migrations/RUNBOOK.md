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

## R-03 — Cartera histórica en leads (`004_leads_historico.sql`)
Agrega `leads.es_historico` y marca los 72 leads de la carga inicial (marzo 2026). Aditivo e idempotente.
**Correr en prod ANTES de desplegar la rama `sep-mant`**: el modelo `Lead` ya lee la columna y sin ella Leads da error.
```powershell
& $PSQL $LOCAL -f "$M\004_leads_historico.sql"     # local
& $PSQL $PROD  -f "$M\004_leads_historico.sql"     # prod ($PROD = DIRECT_URL de .env.local)
& $PSQL $PROD  -c "SELECT es_historico, count(*) FROM leads GROUP BY 1;"   # esperado: true 72 / false 36
```
Rollback: `ALTER TABLE leads DROP COLUMN IF EXISTS es_historico;`

## Staging (develop) — Supabase compartido
Proyecto Supabase `djzmmzqlmfxckranftov` (eu-west-1), compartido con otra app de pruebas (tablas `agent_*`, `ai_logs`, `jarvis_embeddings`: NO tocarlas).
Credenciales en `.env.develop` (ignorado por git): `DIRECT_URL` = session pooler 5432 (restore/migraciones), `DATABASE_URL` = transaction pooler 6543 (la app).
Estado: restaurado `backups-local/prod_sept2026.dump` + `004` aplicada (14/09/2026).

Refrescar staging desde prod (solo nuestras tablas; el resto del schema queda):
```powershell
$STG = ((Get-Content .env.develop | Where-Object { $_ -match '^DIRECT_URL=' }) -replace '^DIRECT_URL=','')
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" $PROD --schema=public --no-owner --no-privileges -Fc -f "backups-local/prod_$(Get-Date -Format yyyyMMdd).dump"
& $PSQL $STG -c "DROP TABLE IF EXISTS event_services, service_types, stock_movements, combo_products, combos, products, payments, tasks, visits, interactions, lead_status_history, reservations, proposals, calendar_dates, events, leads, users CASCADE;"
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --no-owner --no-privileges --schema=public -d $STG "backups-local/prod_<fecha>.dump"
& $PSQL $STG -f "$M\004_leads_historico.sql"     # y las migraciones que prod aún no tenga
```

## E15-01 — Pipeline de 4 estados (`005_pipeline_4_estados.sql`)
Solo datos: remapea `leads.estado_actual` a Lead nuevo / Visita agendada / Visita realizada / Reserva confirmada / Perdido. Idempotente. Ya aplicada en LOCAL.
**Correr en la base de develop (staging) y en prod ANTES de desplegar la rama**: el código ya no conoce los estados viejos.
```powershell
& $PSQL $STG  -f "$M\005_pipeline_4_estados.sql"   # develop/staging
& $PSQL $PROD -f "$M\005_pipeline_4_estados.sql"   # prod
& $PSQL $PROD -c "SELECT estado_actual, count(*) FROM leads GROUP BY 1 ORDER BY 2 DESC;"   # esperado: Reserva confirmada 103 · Visita realizada 3 · Lead nuevo 1 · Perdido 1
```
