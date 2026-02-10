# CarolinaOS - EventTech CRM

Sistema operativo comercial y operativo para gestión end-to-end de clientes, fechas y eventos.
Pensado para salones de eventos que necesitan trazabilidad completa: desde el primer contacto (lead) hasta el evento confirmado.

---

## Tech Stack

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Framework  | Next.js 16.1.6 (App Router)        |
| Frontend   | React 19, JSX                       |
| UI         | shadcn/ui + Radix UI + Tailwind 3   |
| Forms      | React Hook Form + Zod               |
| ORM        | Sequelize 6.37.7                    |
| Base datos | PostgreSQL (local, puerto 5432, db: laCarolina) |
| Auth       | localStorage (pendiente JWT/sessions)|
| Package    | pnpm                                |

### Dependencias clave (package.json)
- `sequelize` + `pg` + `pg-hstore` + `dotenv` → ORM y conexión PostgreSQL
- `next` 16.1.6 → Framework fullstack
- `react` 19 + `react-dom` 19
- `@radix-ui/*` → Primitivos UI accesibles (57 componentes shadcn/ui)
- `react-hook-form` + `zod` → Formularios con validación
- `recharts` → Gráficos del dashboard
- `date-fns` → Manejo de fechas
- `lucide-react` → Íconos
- `cmdk` → Command palette
- `sonner` → Toasts/notificaciones
- `next-themes` → Dark mode

### Config Next.js (next.config.mjs)
```js
serverExternalPackages: ['sequelize', 'pg', 'pg-hstore']
// Necesario para que Turbopack no intente bundlear estos paquetes nativos
```

---

## Estructura del Proyecto

```
LaCarolina/
├── app/                              # Next.js App Router
│   ├── layout.jsx                    # Root layout (metadata, fuente Inter)
│   ├── page.jsx                      # Entry point: Landing → Login → App
│   ├── globals.css                   # Estilos globales + CSS variables
│   └── api/                          # === API Routes backend (HECHO) ===
│       ├── leads/route.js            # GET (listar+filtros), POST (crear)
│       ├── leads/[id]/route.js       # GET (detalle+includes), PUT, DELETE (cascade)
│       ├── leads/[id]/status/route.js       # PUT (cambiar estado + historial + auto-task)
│       ├── leads/[id]/interactions/route.js # GET, POST
│       ├── leads/[id]/visits/route.js       # GET, POST
│       ├── leads/[id]/proposals/route.js    # GET, POST (version auto-incrementa)
│       ├── proposals/[id]/route.js   # PUT (actualizar, auto fecha_envio)
│       ├── calendar/route.js         # GET (todas), POST (crear/actualizar con validación)
│       ├── calendar/[fecha]/route.js # DELETE (liberar fecha)
│       ├── reservations/route.js     # GET (con includes), POST (unique por lead)
│       ├── reservations/[id]/route.js # PUT
│       ├── events/route.js           # GET (con includes), POST (+ calendar + lead status)
│       ├── events/[id]/route.js      # PUT
│       ├── tasks/route.js            # GET (con includes), POST
│       ├── tasks/[id]/route.js       # PUT, DELETE
│       └── users/route.js            # GET (sin password_hash)
│
├── components/                       # Componentes React (frontend)
│   ├── app-sidebar.jsx               # Sidebar navegación (desktop colapsable + mobile overlay)
│   ├── dashboard-view.jsx            # Dashboard: métricas, pipeline, gráficos
│   ├── leads-view.jsx                # CRUD leads + detalle con tabs (interacciones, visitas, propuestas, historial)
│   ├── calendar-view.jsx             # Calendario: gestión de fechas, estados, bloqueos
│   ├── proposals-view.jsx            # Listado/gestión de propuestas comerciales
│   ├── tasks-view.jsx                # Panel Kanban (Pendiente / En Proceso / Hecho)
│   ├── landing-page.jsx              # Landing pública + login (selección de usuario demo)
│   └── ui/                           # 57 componentes shadcn/ui (button, dialog, table, etc.)
│
├── hooks/
│   ├── use-mobile.tsx                # Hook detección responsive
│   └── use-toast.ts                  # Hook sistema de notificaciones
│
├── lib/
│   ├── store.js                      # ⚠️ Store in-memory con localStorage (FRONTEND ACTUAL)
│   │                                 #    El frontend TODAVÍA usa esto. Próximo paso: reemplazar por fetch a /api/*
│   ├── utils.ts                      # cn() helper (clsx + tailwind-merge)
│   └── models/                       # Modelos Sequelize (PostgreSQL)
│       ├── index.js                  # Conexión BD: new Sequelize(process.env.DATABASE_URL)
│       ├── init.js                   # Sync: sequelize.sync({ alter: true })
│       ├── associations.js           # TODAS las relaciones + exporta todos los modelos
│       ├── user.js                   # Tabla: users
│       ├── lead.js                   # Tabla: leads
│       ├── interaction.js            # Tabla: interactions
│       ├── visit.js                  # Tabla: visits
│       ├── proposal.js               # Tabla: proposals
│       ├── calendar_date.js          # Tabla: calendar_dates
│       ├── reservation.js            # Tabla: reservations
│       ├── event.js                  # Tabla: events
│       ├── task.js                   # Tabla: tasks
│       └── lead_status_history.js    # Tabla: lead_status_history
│
├── public/images/                    # Assets estáticos (logos, fotos salón)
├── .env                              # DATABASE_URL=postgres://postgres:***@localhost:5432/laCarolina
├── .gitignore                        # node_modules, .next, .env*.local, .DS_Store, .claude
├── package.json
├── pnpm-lock.yaml
├── next.config.mjs                   # serverExternalPackages: sequelize, pg, pg-hstore
├── tailwind.config.ts
├── tsconfig.json                     # paths: @/* → ./*
└── components.json                   # Config shadcn/ui
```

---

## Base de Datos - Modelo Entidad-Relación

### Todas las tablas usan UUID como primary key (`id`). Generado automáticamente con UUIDV4.

### users
| Campo         | Tipo    | Restricción       |
|---------------|---------|-------------------|
| id            | UUID    | PK, auto          |
| nombre        | STRING  | NOT NULL           |
| email         | STRING  | NOT NULL, UNIQUE   |
| password_hash | STRING  | NOT NULL           |
| rol           | ENUM    | Admin, Comercial, Operaciones, Viewer |
| activo        | BOOLEAN | default: true      |

### leads
| Campo              | Tipo    | Restricción       |
|--------------------|---------|-------------------|
| id                 | UUID    | PK, auto          |
| nombre             | STRING  | NOT NULL           |
| telefono           | STRING  |                    |
| email              | STRING  |                    |
| canal_origen       | STRING  |                    |
| tipo_evento        | STRING  |                    |
| fecha_tentativa    | DATE    |                    |
| anio_evento        | INTEGER |                    |
| estado_actual      | STRING  |                    |
| valor_estimado     | FLOAT   |                    |
| notas              | TEXT    |                    |
| managed_by_user_id | UUID    | FK → users (auto por asociación) |
| created_at         | DATE    | default: NOW       |
| updated_at         | DATE    | default: NOW       |

### interactions
| Campo              | Tipo   | Restricción |
|--------------------|--------|-------------|
| id                 | UUID   | PK, auto    |
| lead_id            | UUID   | FK → leads, NOT NULL |
| tipo               | STRING | (WhatsApp, Llamada, Email, Reunion) |
| descripcion        | TEXT   |             |
| fecha              | DATE   |             |
| created_by_user_id | UUID   | FK → users  |

### visits
| Campo              | Tipo   | Restricción |
|--------------------|--------|-------------|
| id                 | UUID   | PK, auto    |
| lead_id            | UUID   | FK → leads, NOT NULL |
| fecha_visita       | DATE   |             |
| resultado          | STRING |             |
| notas              | TEXT   |             |
| created_by_user_id | UUID   | FK → users  |

### proposals
| Campo              | Tipo    | Restricción |
|--------------------|---------|-------------|
| id                 | UUID    | PK, auto    |
| lead_id            | UUID    | FK → leads, NOT NULL |
| version            | INTEGER | NOT NULL (auto-incrementa por lead) |
| contenido_html     | TEXT    |             |
| precio_total       | FLOAT   |             |
| estado             | STRING  | (Borrador, Enviada, Aceptada, Rechazada) |
| fecha_envio        | DATE    | (auto cuando estado → Enviada) |
| created_by_user_id | UUID    | FK → users  |
| created_at         | DATE    | default: NOW|

### calendar_dates
| Campo        | Tipo   | Restricción       |
|--------------|--------|-------------------|
| id           | UUID   | PK, auto          |
| fecha        | DATE   | NOT NULL, UNIQUE   |
| estado_fecha | STRING | (Disponible, Bloqueada, Reservada, Confirmada) |
| fuente       | STRING |                    |
| lead_id      | UUID   | FK → leads (nullable) |
| evento_id    | UUID   | FK → events (nullable)|
| nota         | TEXT   |                    |
| created_at   | DATE   | default: NOW       |

### reservations
| Campo            | Tipo   | Restricción            |
|------------------|--------|------------------------|
| id               | UUID   | PK, auto               |
| lead_id          | UUID   | FK → leads, NOT NULL, UNIQUE |
| calendar_date_id | UUID   | FK → calendar_dates, NOT NULL |
| monto_senia      | FLOAT  |                        |
| fecha_pago       | DATE   |                        |
| metodo_pago      | STRING |                        |
| comprobante_url  | STRING |                        |
| estado           | STRING | (Pendiente, Confirmada, etc.) |

### events
| Campo                 | Tipo    | Restricción            |
|-----------------------|---------|------------------------|
| id                    | UUID    | PK, auto               |
| lead_id               | UUID    | FK → leads, NOT NULL, UNIQUE |
| fecha_confirmada      | DATE    |                        |
| tipo_evento           | STRING  |                        |
| invitados_estimados   | INTEGER |                        |
| servicios_contratados | JSON    | (array de servicios)   |
| estado_operativo      | STRING  | (Pendiente, En preparación, Listo, Realizado) |
| contrato_url          | STRING  |                        |
| calendar_date_id      | UUID    | FK → calendar_dates (auto por asociación) |
| created_at            | DATE    | default: NOW           |

### tasks
| Campo               | Tipo    | Restricción |
|---------------------|---------|-------------|
| id                  | UUID    | PK, auto    |
| titulo              | STRING  | NOT NULL    |
| descripcion         | TEXT    |             |
| lead_id             | UUID    | FK → leads (nullable)  |
| evento_id           | UUID    | FK → events (nullable) |
| assigned_to_user_id | UUID    | FK → users  |
| estado              | STRING  | (Pendiente, En Proceso, Hecho, Cancelado) |
| prioridad           | STRING  | (Alta, Media, Baja) |
| due_date            | DATE    |             |
| created_at          | DATE    | default: NOW|

### lead_status_history
| Campo              | Tipo   | Restricción |
|--------------------|--------|-------------|
| id                 | UUID   | PK, auto    |
| lead_id            | UUID   | FK → leads, NOT NULL |
| estado_anterior    | STRING |             |
| estado_nuevo       | STRING |             |
| motivo             | STRING |             |
| changed_by_user_id | UUID   | FK → users  |
| changed_at         | DATE   | default: NOW|

---

## Relaciones (associations.js)

```
User  ──┬── hasMany ──→ Lead        (managed_by_user_id)
        └── hasMany ──→ Task        (assigned_to_user_id)

Lead  ──┬── hasMany ──→ Interaction (lead_id)
        ├── hasMany ──→ Visit       (lead_id)
        ├── hasMany ──→ Proposal    (lead_id)
        ├── hasMany ──→ LeadStatusHistory (lead_id)
        ├── hasOne  ──→ Reservation (lead_id)
        └── hasOne  ──→ Event       (lead_id)

CalendarDate ──┬── belongsTo ──→ Lead  (lead_id)
               └── belongsTo ──→ Event (evento_id)

Proposal    ──┬── belongsTo ──→ Lead (lead_id)
              └── belongsTo ──→ User (created_by_user_id)  as: 'creator'

Event       ──┬── belongsTo ──→ Lead         (lead_id)
              ├── belongsTo ──→ CalendarDate  (calendar_date_id)
              └── hasMany   ──→ Task          (evento_id)

Task        ──┬── belongsTo ──→ Lead  (lead_id)
              ├── belongsTo ──→ Event (evento_id)
              └── belongsTo ──→ User  (assigned_to_user_id)  as: 'assigned_user'

Interaction ──┬── belongsTo ──→ Lead (lead_id)
              └── belongsTo ──→ User (created_by_user_id)  as: 'creator'

Visit       ──┬── belongsTo ──→ Lead (lead_id)
              └── belongsTo ──→ User (created_by_user_id)  as: 'creator'

Reservation ──┬── belongsTo ──→ Lead         (lead_id)
              └── belongsTo ──→ CalendarDate  (calendar_date_id)

LeadStatusHistory ──┬── belongsTo ──→ Lead (lead_id)
                    └── belongsTo ──→ User (changed_by_user_id)  as: 'changer'
```

### Alias importantes para includes en queries
- Lead: `interactions`, `visits`, `proposals`, `status_history`, `reservation`, `event`
- Event: `lead`, `calendar_date`, `tasks`
- Task: `lead`, `event`, `assigned_user`
- Reservation: `lead`, `calendar_date`
- Proposal: `lead`, `creator`
- Interaction/Visit: `lead`, `creator`
- LeadStatusHistory: `lead`, `changer`

---

## Constantes del Negocio

Definidas en `lib/store.js` (usadas por el frontend):

```js
LEAD_STATES = [
  "Consulta inicial",    // Estado inicial al crear lead
  "Propuesta enviada",   // Se envió propuesta → auto-crea Task seguimiento
  "Esperando respuesta",
  "Visita agendada",
  "En negociacion",
  "Reserva tomada",
  "Evento confirmado",   // Estado final exitoso → se crea Event
  "Perdido"              // Requiere motivo obligatorio
]

CALENDAR_STATES = ["Disponible", "Bloqueada", "Reservada", "Confirmada"]

CANALES = ["WhatsApp", "Web", "Referido", "Instagram", "Facebook", "Telefono"]

TIPOS_EVENTO = ["Boda", "15 anos", "18 anos", "Corporativo", "Baby Shower", "Cumpleanos", "Otro"]

TASK_STATES = ["Pendiente", "En Proceso", "Hecho", "Cancelado"]

TASK_PRIORITIES = ["Alta", "Media", "Baja"]

USER_ROLES = ["Admin", "Comercial", "Operaciones", "Viewer"]
```

---

## Reglas de Negocio (implementadas en API routes)

1. **Lead → Perdido**: Requiere `motivo` obligatorio (400 si falta).
2. **Lead → "Propuesta enviada"**: Auto-crea Task de seguimiento con `prioridad: Alta` y `due_date: +3 días`.
3. **CalendarDate**: No puede haber dos leads con estado Reservada/Confirmada en la misma fecha (409 conflict).
4. **Reservation**: Un lead solo puede tener una reserva, `lead_id` es UNIQUE (409 si ya existe).
5. **Event**: Un lead solo puede tener un evento, `lead_id` es UNIQUE (409 si ya existe).
6. **Event creado** (POST /api/events): Automáticamente:
   - Crea/actualiza CalendarDate a "Confirmada" con el `lead_id` y `evento_id`
   - Crea registro en LeadStatusHistory
   - Actualiza lead a `estado_actual: "Evento confirmado"`
7. **Proposal.version**: Se auto-incrementa contando `Proposal.count({ where: { lead_id } })`.
8. **Proposal → "Enviada"** (PUT /api/proposals/:id): Auto-registra `fecha_envio` si no tenía.
9. **Delete Lead** (DELETE /api/leads/:id): Cascade manual → destruye en orden:
   - Interactions → Visits → Proposals → LeadStatusHistory → Reservations → Tasks → Events → Lead
10. **GET /api/users**: Excluye `password_hash` del response (solo devuelve id, nombre, email, rol, activo).
11. **GET /api/leads/:id**: Incluye todas las relaciones (interactions, visits, proposals, status_history, reservation, event).
12. **GET /api/tasks**: Incluye relaciones (lead, event, assigned_user).
13. **GET /api/reservations**: Incluye relaciones (lead, calendar_date).
14. **GET /api/events**: Incluye relaciones (lead, calendar_date).

---

## API Endpoints (17 rutas, todas en app/api/)

Todas las rutas importan modelos desde `@/lib/models/associations` y usan `NextResponse.json()`.
Todas envuelven la lógica en try/catch y devuelven `{ error: message }` con status 500 en caso de error.

### Leads
```
GET    /api/leads                    → Listar todos. Filtros: ?estado=X&anio=2026. Order: created_at DESC
POST   /api/leads                    → Crear lead. Body: { nombre, telefono, email, canal_origen, tipo_evento, fecha_tentativa, anio_evento, valor_estimado, notas }. Estado inicial: "Consulta inicial"
GET    /api/leads/:id                → Detalle con includes: interactions, visits, proposals, status_history, reservation, event
PUT    /api/leads/:id                → Actualizar campos. Auto-setea updated_at
DELETE /api/leads/:id                → Eliminar con cascade manual (interactions, visits, proposals, history, reservations, tasks, events)
PUT    /api/leads/:id/status         → Body: { estado, motivo?, user_id? }. Crea LeadStatusHistory. Si "Propuesta enviada" → auto-crea Task
GET    /api/leads/:id/interactions   → Listar interacciones del lead. Order: fecha DESC
POST   /api/leads/:id/interactions   → Body: { tipo, descripcion, fecha?, created_by_user_id? }
GET    /api/leads/:id/visits         → Listar visitas del lead. Order: fecha_visita DESC
POST   /api/leads/:id/visits         → Body: { fecha_visita, resultado, notas, created_by_user_id? }
GET    /api/leads/:id/proposals      → Listar propuestas del lead. Order: version DESC
POST   /api/leads/:id/proposals      → Body: { contenido_html/contenido, precio_total, created_by_user_id? }. Version auto-incrementa. Estado: "Borrador"
```

### Proposals
```
PUT    /api/proposals/:id            → Body: campos a actualizar. Si estado → "Enviada" y no tenía fecha_envio, la auto-registra
```

### Calendar
```
GET    /api/calendar                 → Todas las fechas. Order: fecha ASC
POST   /api/calendar                 → Body: { fecha, estado_fecha, fuente?, lead_id?, evento_id?, nota? }. Si fecha existe → update. Valida conflicto Reservada/Confirmada (409)
DELETE /api/calendar/:fecha          → Eliminar/liberar fecha por valor de fecha
```

### Reservations
```
GET    /api/reservations             → Todas con includes: lead, calendar_date
POST   /api/reservations             → Body: { lead_id, calendar_date_id, monto_senia, fecha_pago, metodo_pago, comprobante_url? }. Valida unique por lead (409). Estado: "Pendiente"
PUT    /api/reservations/:id         → Body: campos a actualizar
```

### Events
```
GET    /api/events                   → Todos con includes: lead, calendar_date. Order: created_at DESC
POST   /api/events                   → Body: { lead_id, fecha_confirmada, tipo_evento?, invitados_estimados?, servicios_contratados?, contrato_url?, user_id? }. Valida unique por lead (409). Auto: CalendarDate → "Confirmada", Lead → "Evento confirmado" + historial
PUT    /api/events/:id               → Body: campos a actualizar
```

### Tasks
```
GET    /api/tasks                    → Todas con includes: lead, event, assigned_user. Order: created_at DESC
POST   /api/tasks                    → Body: { titulo, descripcion?, lead_id?, evento_id?, assigned_to_user_id?, prioridad?, due_date? }. Estado: "Pendiente"
PUT    /api/tasks/:id                → Body: campos a actualizar
DELETE /api/tasks/:id                → Eliminar tarea
```

### Users
```
GET    /api/users                    → Listar todos. Campos: id, nombre, email, rol, activo (SIN password_hash). Order: nombre ASC
```

---

## Flujo de Datos Actual

```
FRONTEND (components/*.jsx)
    │
    ├── ACTUALMENTE usa ──→ lib/store.js (localStorage in-memory)
    │                        Tiene toda la lógica de negocio duplicada
    │
    └── PRÓXIMO PASO ──→ fetch('/api/*') ──→ API Routes (app/api/*)
                                                  │
                                                  └──→ Sequelize Models (lib/models/*)
                                                            │
                                                            └──→ PostgreSQL (laCarolina)
```

### Para conectar frontend a API (próximo paso):
1. Crear `lib/api.js` con funciones wrapper para cada endpoint (fetch + error handling)
2. Reemplazar imports de `store.js` en cada componente por calls a `lib/api.js`
3. Los componentes que usan `store.js`:
   - `app/page.jsx` → usa `seedDemoData`, `getUsers` (login demo)
   - `components/leads-view.jsx` → usa CRUD de leads, interactions, visits, proposals, status
   - `components/calendar-view.jsx` → usa calendar dates
   - `components/proposals-view.jsx` → usa proposals
   - `components/tasks-view.jsx` → usa tasks
   - `components/dashboard-view.jsx` → usa leads, tasks, events (métricas)

---

## Vistas del Frontend

| Vista           | Componente           | Descripción                                      |
|-----------------|----------------------|--------------------------------------------------|
| Landing/Login   | landing-page.jsx     | Página pública + login (selección de usuario demo)|
| Dashboard       | dashboard-view.jsx   | Métricas: leads por estado, pipeline, gráficos recharts |
| Leads           | leads-view.jsx       | CRUD completo, detalle con tabs (interacciones, visitas, propuestas, historial) |
| Calendario      | calendar-view.jsx    | Gestión de fechas, estados, bloqueos             |
| Propuestas      | proposals-view.jsx   | Listado/gestión de propuestas comerciales        |
| Tareas          | tasks-view.jsx       | Panel Kanban (Pendiente/En Proceso/Hecho)        |

### Navegación
- **Desktop**: Sidebar colapsable a la izquierda (app-sidebar.jsx)
- **Mobile**: Hamburger menu con overlay
- **Entry point**: `app/page.jsx` → si no hay user → LandingPage, si hay → App con sidebar

### Seed Data (store.js → seedDemoData)
- 3 usuarios demo: Carolina (Admin), Maria (Comercial), Luis (Operaciones)
- 8 leads demo con diferentes estados
- Interacciones, propuestas, tareas y fechas de calendario de ejemplo

---

## Estado Actual del Proyecto

### Hecho
- [x] Landing page con login demo
- [x] Todas las vistas del frontend (Dashboard, Leads, Calendar, Proposals, Tasks)
- [x] Componentes UI completos (57 shadcn/ui)
- [x] Store in-memory con localStorage (lib/store.js) con toda la lógica de negocio
- [x] Seed data para demo (8 leads, interacciones, propuestas, tareas, calendario)
- [x] Modelos Sequelize definidos (10 tablas) con UUID
- [x] Asociaciones entre modelos definidas (associations.js)
- [x] Base de datos PostgreSQL creada con tablas sincronizadas
- [x] **17 API Routes creadas** (app/api/) - CRUD real contra PostgreSQL
- [x] Reglas de negocio implementadas en las API routes
- [x] Build exitoso (next build compila todas las rutas)
- [x] API probada: POST /api/leads crea lead real con UUID en PostgreSQL
- [x] next.config.mjs configurado con serverExternalPackages
- [x] pg-hstore instalado (dependencia de Sequelize para PostgreSQL)

### Pendiente (próximos pasos)
- [ ] **Crear lib/api.js** → funciones fetch wrapper para cada endpoint
- [ ] **Conectar frontend a API** → reemplazar store.js por fetch en cada componente
- [ ] **Seed de usuarios** en PostgreSQL (los 3 usuarios demo: Carolina, Maria, Luis)
- [ ] Autenticación real (JWT o NextAuth)
- [ ] Migraciones de BD (actualmente usa sequelize.sync({ alter: true }))
- [ ] Validaciones server-side con Zod
- [ ] Tests

---

## Setup del Proyecto

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd LaCarolina
pnpm install

# 2. Configurar .env
# Crear archivo .env con:
DATABASE_URL=postgres://usuario:password@localhost:5432/laCarolina

# 3. Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE \"laCarolina\";"

# 4. Sincronizar modelos (crea las tablas automáticamente)
node -e "const { initModels } = require('./lib/models/init'); initModels();"

# 5. Iniciar dev server
pnpm dev
# Abre http://localhost:3000
```

---

## Guía de Commits

| Tipo     | Uso                                  | Ejemplo                                       |
|----------|--------------------------------------|-----------------------------------------------|
| feat     | Nueva funcionalidad                  | feat: agregar filtro por etapa en leads       |
| fix      | Corrección de bug                    | fix: corregir cálculo de días vencidos        |
| perf     | Mejora de rendimiento                | perf: optimizar query de leads con SQL directo|
| refactor | Refactorización sin cambio funcional | refactor: extraer lógica de filtros a hook    |
| style    | Cambios de estilo/formato            | style: ajustar espaciado en cards móviles     |
| docs     | Documentación                        | docs: agregar guía de usuario                 |
| chore    | Tareas de mantenimiento              | chore: actualizar dependencias                |
| test     | Tests                                | test: agregar tests para API de leads         |
| build    | Cambios de build/deploy              | build: configurar variables de Vercel         |

---

## Referencias
- [Next.js App Router](https://nextjs.org/docs/app)
- [Sequelize v6 Docs](https://sequelize.org/docs/v6/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [shadcn/ui](https://ui.shadcn.com/)
