# Guía de Desarrollo Local - CarolinaOS

Instrucciones para configurar y ejecutar el proyecto en desarrollo local con base de datos PostgreSQL separada de producción.

---

## Setup Inicial

### 1. Clonar y dependencias
```bash
git clone [repo-url]
cd LaCarolina
pnpm install
```

### 2. Variables de entorno (.env.local)
Crear archivo `.env.local` en la raíz con tus credenciales:

```env
# ─── Producción (Supabase) ───
DATABASE_URL=postgresql://[tu-usuario]:[tu-contraseña]@[tu-host]:5432/[tu-bd]
DIRECT_URL=postgresql://[tu-usuario]:[tu-contraseña]@[tu-host]:5432/[tu-bd]

# ─── Desarrollo Local (PostgreSQL) ───
LOCAL_DB_URL=postgresql://postgres:[tu-password]@localhost:5432/lacarolina

# ─── Google Calendar ───
GOOGLE_CALENDAR_ID=[tu-calendar-id-produccion]
GOOGLE_CALENDAR_ID_DEV=[tu-calendar-id-testing]
GOOGLE_SERVICE_ACCOUNT_KEY=[tu-json-de-google]
```

### 3. Base de Datos Local
Instalar PostgreSQL 14+ localmente. En Windows:
- Descargar desde https://www.postgresql.org/download/windows/
- Default: localhost:5432, usuario `postgres`

Crear la base de datos:
```bash
createdb -U postgres lacarolina
```

Inicializar esquema:
```bash
node run-schema.js
```

---

## Ejecución

### Opción 1: Desarrollo con Supabase (producción)
```bash
pnpm run dev
```
- Conecta a la BD remota (DATABASE_URL)
- Usa Google Calendar IDs de producción
- No afecta datos reales

### Opción 2: Desarrollo Local
```bash
pnpm run dev:local
```
- Conecta a BD local (LOCAL_DB_URL → localhost:5432)
- Usa Google Calendar ID de testing (GOOGLE_CALENDAR_ID_DEV)
- Datos completamente aislados

El script `dev-local.js` inyecta las variables de entorno correctas antes de ejecutar Next.js.

---

## Manejo de Datos

### Respaldar BD Local a JSON
```bash
node backup-local-db.js
```
Crea archivo en `backups-local/backup-[timestamp].json` con todos los registros.

### Respaldar Supabase a JSON
```bash
node backup-supabase.js
```
Crea archivo en `backups/backup-[timestamp].json` con todos los registros de producción.

### Restaurar desde Backup
```bash
node import-no-constraints.js
```
Lee el último backup disponible e importa los datos a la BD local.

### Limpiar BD Local
```bash
node clean-database.js
```
Trunca todas las tablas (no borra la estructura, solo datos).

---

## Estructura de Base de Datos

La BD local usa el mismo esquema que Supabase:

| Tabla | Registros | Propósito |
|---|---|---|
| `users` | Usuarios del sistema | Cuentas con roles |
| `leads` | Contactos | Clientes potenciales |
| `events` | Eventos | Fechas confirmadas en calendario |
| `proposals` | Propuestas | Cotizaciones y contratos |
| `calendar_dates` | Fechas disponibles | Calendario del salón |
| `interactions` | Contactos registrados | Llamadas, mensajes, etc. |
| `visits` | Visitas al salón | Registro de tours |
| `tasks` | Tareas | Recordatorios y pendientes |
| `lead_status_history` | Historial de estados | Auditoría de cambios de lead |
| `reservations` | Reservas | Confirmaciones de evento |
| `payments` | Pagos | Registro de transacciones |

Ver `schema.sql` para definiciones completas.

---

## Scripts Disponibles

| Script | Función | Entrada | Salida |
|---|---|---|---|
| `pnpm run dev` | Dev con Supabase | — | Servidor en http://localhost:3000 |
| `pnpm run dev:local` | Dev con BD local | — | Servidor en http://localhost:3000 |
| `pnpm run build` | Build para producción | — | Carpeta `.next/` |
| `pnpm run start` | Ejecutar build | — | Servidor en http://localhost:3000 |
| `node run-schema.js` | Crear tablas en BD local | schema.sql | BD local actualizada |
| `node backup-local-db.js` | Respaldar BD local | — | JSON en `backups-local/` |
| `node backup-supabase.js` | Respaldar Supabase | — | JSON en `backups/` |
| `node import-no-constraints.js` | Restaurar desde backup | backup JSON | BD local con datos |
| `node clean-database.js` | Limpiar todos los datos | — | BD local vacía (estructura intacta) |
| `node check-data.js` | Contar registros por tabla | — | Tabla con conteos |
| `node add-missing-columns.js` | Agregar columnas FK | — | BD actualizada |

---

## Solución de Problemas

### Error: "could not connect to server: Connection refused"
- PostgreSQL no está corriendo
- Solución: Iniciar el servicio PostgreSQL (Windows: Services → PostgreSQL)

### Error: "column X does not exist"
- Esquema incompleto o desactualizado
- Solución: Ejecutar `node run-schema.js` nuevamente

### Error en propuestas: "adicionales.filter is not a function"
- JSON field viene como string en lugar de array
- Solución: Usar `ensureArray()` helper (ya implementado en proposals-view.jsx)

### Datos no se sincronizan entre `dev` y `dev:local`
- Son BDs separadas por diseño
- Para pasar datos: Respaldar con `backup-supabase.js` e importar con `import-no-constraints.js`

### Cambios no aparecen al actualizar página
- Next.js Turbopack a veces cachea módulos
- Solución: Eliminar `.next/` y reiniciar servidor

---

## Flujo de Trabajo Recomendado

1. **Desarrollo sin datos reales**: `pnpm run dev:local`
   - Usa BD local vacía
   - Crear datos de prueba manualmente o con scripts de seed

2. **Testing con datos reales**: 
   - `node backup-supabase.js` (respaldar producción)
   - `node import-no-constraints.js` (restaurar a local)
   - `pnpm run dev:local`
   - Hacer cambios y probar
   - `node clean-database.js` cuando no necesites más esos datos

3. **Deploy a producción**:
   - Hacer cambios en rama feature
   - Testing en `dev` con datos de Supabase
   - Push a repository
   - Deploy automático en Vercel

---

## Variables de Entorno Importantes

- `DATABASE_URL` / `DIRECT_URL`: Conexión principal (Supabase en prod)
- `LOCAL_DB_URL`: Conexión a BD local (solo para `dev:local`)
- `GOOGLE_CALENDAR_ID`: Calendario de producción (datos reales, cuidado)
- `GOOGLE_CALENDAR_ID_DEV`: Calendario de testing (para desarrollo seguro)
- `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON con credenciales de Google (service account)

---

## Información Adicional

- Base de datos local actual: 543 registros importados desde Supabase
- Backups están en `.gitignore` (no se commitean datos sensibles)
- Todos los scripts de backup son **manuales** (no automáticos)
- El esquema se controla vía `schema.sql` y seed scripts
