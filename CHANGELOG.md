# CHANGELOG - CarolinaOS

Registro de cambios, mejoras y fixes importantes en el proyecto.

---

## Cambios Recientes

### [2025-04-06] Configuración de Desarrollo Local

#### Agregado
- **DEVELOPMENT.md**: Guía completa para setup local con PostgreSQL
- **dev-local.js**: Script Node.js que inyecta variables de entorno para desarrollo local
- **npm script `dev:local`**: Ejecuta Next.js contra BD local y Google Calendar de testing
- **run-schema.js**: Inicializa esquema de BD local desde `schema.sql`
- **backup-local-db.js**: Respalda BD local a JSON en carpeta `backups-local/`
- **import-no-constraints.js**: Restaura datos desde backup JSON a BD local
- **check-data.js**: Verifica conteos de registros por tabla
- **clean-database.js**: Limpia todos los datos de la BD local
- **add-missing-columns.js**: Agrega columnas faltantes (managed_by_user_id, calendar_date_id)
- **.env.local**: Crear con credenciales de Supabase y PostgreSQL local (ver DEVELOPMENT.md)

#### Modificado
- **package.json**: Agregado script `"dev:local": "node dev-local.js"`
- **lib/models/index.js**: Validar si DATABASE_URL ya está cargada antes de dotenv
- **app/layout.jsx**: Agregar `suppressHydrationWarning` y crear `ToasterProvider` component
- **.gitignore**: Excluir carpetas `backups/` y `backups-local/` (datos sensibles)
- **README.md**: Actualizar Tech Stack e incluir sección de Inicio Rápido

#### Fixed
- Hidration mismatch errors causados por Toaster en SSR
- Columnas faltantes en BD local (managed_by_user_id, calendar_date_id)
- Datos importados: 543 registros de Supabase a BD local

#### Security
- Git history cleaning: Remover backups folder con datos sensibles de todo el historio
- Backups folder excluido de git para evitar commits accidentales de datos

#### Data
- BD local inicializada con esquema completo (11 tablas)
- Capacidad para importar datos desde backups JSON
- Scripts de backup/restore disponibles

---

### [2025-04-06] Fix: JSON Fields en Propuestas

#### Fixed
- **proposals-view.jsx**: Error "adicionales.filter is not a function"
  - Agregado helper `ensureArray()` para convertir JSON fields a arrays de forma segura
  - Si el campo viene como string JSON, se parsea automáticamente
  - Aplica a: ContractCard, ContractDetail, ContractForm

---

## Convención de Commits

| Tipo | Descripción | Ejemplo |
|------|---|---|
| `feat:` | Nueva feature | `feat: agregar backup de BD local` |
| `fix:` | Bug fix | `fix: JSON field parsing en propuestas` |
| `docs:` | Cambios en documentación | `docs: actualizar DEVELOPMENT.md` |
| `refactor:` | Refactorización sin cambio de funcionalidad | `refactor: mejorar helpers en models` |
| `test:` | Tests | `test: agregar tests para backup scripts` |
| `chore:` | Tareas de mantenimiento | `chore: limpiar git history` |
| `security:` | Cambios de seguridad | `security: excluir backups de git` |

---

## Estado Actual del Proyecto

### ✅ Completado
- Setup de desarrollo local con BD PostgreSQL separada
- Integración Google Calendar con IDs separados (prod vs dev)
- Scripts para backup/restore de datos
- Documentación técnica para desarrolladores
- Hidration errors resueltos
- JSON fields parsing estandarizado

### ⚠️ En Progress
- Tests automatizados para scripts de backup

### 📋 Pendiente
- Automación de backups diarios (actualmente manual)
- Migration system para cambios de esquema
- Seeders para datos de testing

---

## Notas Importantes

1. **Dos entornos completamente separados**:
   - `pnpm run dev`: Usa Supabase (producción, no tocar datos reales)
   - `pnpm run dev:local`: Usa PostgreSQL local (desarrollo seguro)

2. **Backups son manuales**:
   - `node backup-local-db.js` (respaldos locales)
   - `node backup-supabase.js` (respaldos de producción)
   - Los archivos se salvan en `backups/` y `backups-local/` (excluidos de git)

3. **Google Calendar separados**:
   - `GOOGLE_CALENDAR_ID`: Calendario real (cuidado en dev)
   - `GOOGLE_CALENDAR_ID_DEV`: Calendar de testing (seguro para dev)
   - `dev-local.js` inyecta automáticamente el ID de testing

---

## Recursos Útiles

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Guía completa de desarrollo local
- [GUIA_USUARIO.md](./GUIA_USUARIO.md) - Manual para usuarios finales
- [schema.sql](./schema.sql) - Definición de tablas y relaciones
- [lib/models/](./lib/models/) - Modelos Sequelize
