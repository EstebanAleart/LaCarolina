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
| Base datos | PostgreSQL (Supabase remoto)        |
| Auth       | bcryptjs + registro con aprobación admin |
| Hosting    | Vercel (serverless)                 |
| Package    | pnpm (node-linker=hoisted)          |

### Dependencias clave (package.json)
- `sequelize` + `pg` + `pg-hstore` + `dotenv` → ORM y conexión PostgreSQL
- `bcryptjs` → Hash de contraseñas (registro e inicio de sesión)
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
- `googleapis` → Google Calendar API (service account JWT)

### Config Next.js (next.config.mjs)
```js
serverExternalPackages: ['sequelize', 'pg', 'pg-hstore', 'googleapis']
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
│   └── api/                          # === API Routes backend ===
│       ├── leads/route.js            # GET (listar+filtros), POST (crear)
│       ├── leads/[id]/route.js       # GET (detalle+includes), PUT, DELETE (cascade)
│       ├── leads/[id]/status/route.js       # PUT (cambiar estado + historial + auto-task)
│       ├── leads/[id]/interactions/route.js # GET, POST
│       ├── leads/[id]/visits/route.js       # GET, POST
│       ├── leads/[id]/proposals/route.js    # GET, POST (version auto-incrementa)
│       ├── proposals/route.js        # GET (todas las propuestas con includes lead+creator)
│       ├── proposals/[id]/route.js   # PUT (actualizar, auto fecha_envio)
│       ├── calendar/route.js         # GET (todas), POST (crear/actualizar con validación)
│       ├── calendar/[fecha]/route.js # DELETE (liberar fecha)
│       ├── reservations/route.js     # GET (con includes), POST (unique por lead)
│       ├── reservations/[id]/route.js # PUT
│       ├── events/route.js           # GET (con includes), POST (+ calendar + lead status)
│       ├── events/[id]/route.js      # PUT
│       ├── tasks/route.js            # GET (con includes), POST
│       ├── tasks/[id]/route.js       # PUT, DELETE
│       ├── google-calendar/route.js          # GET (test conexion Google Calendar)
│       ├── google-calendar/webhook/route.js  # POST (receptor push notifications)
│       ├── google-calendar/setup/route.js    # POST/DELETE (registrar/detener webhook)
│       ├── google-calendar/sync/route.js     # POST (sync manual/completo)
│       ├── auth/login/route.js        # POST (login con bcrypt)
│       ├── auth/register/route.js    # POST (registro con hash, activo=false)
│       ├── users/route.js            # GET (sin password_hash)
│       └── seed/route.js             # POST (seed usuarios demo si tabla vacía)
│
├── components/                       # Componentes React (frontend)
│   ├── app-sidebar.jsx               # Sidebar navegación (desktop colapsable + mobile overlay)
│   ├── dashboard-view.jsx            # Dashboard: métricas, pipeline, gráficos (conectado a API)
│   ├── leads-view.jsx                # CRUD leads + detalle con tabs (conectado a API)
│   ├── calendar-view.jsx             # Calendario: gestión de fechas, estados (conectado a API)
│   ├── proposals-view.jsx            # Listado/gestión de propuestas comerciales (conectado a API)
│   ├── events-view.jsx              # Vista de eventos confirmados con estado operativo (conectado a API)
│   ├── tasks-view.jsx                # Panel Kanban (Pendiente / En Proceso / Hecho) (conectado a API)
│   ├── landing-page.jsx              # Landing pública + router auth views
│   ├── guide-view.jsx                # Guía de usuario integrada en la plataforma (sidebar "Guía")
│   ├── auth/                         # === Componentes de autenticación ===
│   │   ├── login-form.jsx            # Login con email/password contra API + bcrypt
│   │   ├── register-form.jsx         # Registro con validaciones en tiempo real
│   │   └── pending-approval.jsx      # Pantalla post-registro (cuenta pendiente de aprobación)
│   └── ui/                           # 57 componentes shadcn/ui (button, dialog, table, etc.)
│
├── hooks/
│   ├── use-mobile.tsx                # Hook detección responsive
│   └── use-toast.ts                  # Hook sistema de notificaciones
│
├── lib/
│   ├── api.js                        # Cliente API: funciones fetch wrapper + constantes del negocio
│   ├── db.js                         # Exporta sequelize + todos los modelos (entry point backend)
│   ├── googleCalendar.js             # Servicio Google Calendar (JWT auth, CRUD eventos, webhooks)
│   ├── store.js                      # ⚠️ DEPRECADO - Store in-memory con localStorage (ya no se usa)
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
├── .env                              # DATABASE_URL (no commitear, ver Setup)
├── .gitignore                        # node_modules, .next, .env*.local, .DS_Store, .claude
├── package.json
├── pnpm-lock.yaml
├── next.config.mjs                   # serverExternalPackages: sequelize, pg, pg-hstore
├── tailwind.config.ts
├── tsconfig.json                     # paths: @/* → ./*
└── components.json                   # Config shadcn/ui
```

---

## Flujo de Datos (Arquitectura Actual)

```
FRONTEND (components/*.jsx)
    │
    │  import { fetchLeads, apiCreateLead, ... } from "@/lib/api"
    │
    └──→ lib/api.js (cliente fetch)
              │
              │  fetch('/api/leads', { method: 'POST', body: ... })
              │
              └──→ API Routes (app/api/*)
                        │
                        │  const { Lead } = require('@/lib/models/associations')
                        │  await Lead.findAll(...)
                        │
                        └──→ Sequelize Models (lib/models/*)
                                  │
                                  └──→ PostgreSQL (base de datos)
```

### lib/api.js - Cliente API del Frontend

Archivo central que reemplaza a `lib/store.js`. Contiene:

1. **request()** - Wrapper de fetch con error handling
2. **Funciones async** para cada endpoint (fetchLeads, apiCreateLead, etc.)
3. **Constantes del negocio** (LEAD_STATES, CANALES, etc.)

```
Funciones exportadas:
├── Leads: fetchLeads, fetchLeadById, apiCreateLead, apiUpdateLead, apiDeleteLead, apiChangeLeadStatus
├── Interactions: fetchInteractionsByLead, apiCreateInteraction
├── Visits: fetchVisitsByLead, apiCreateVisit
├── Proposals: fetchProposalsByLead, fetchAllProposals, apiCreateProposal, apiUpdateProposal
├── Calendar: fetchCalendarDates, apiSetCalendarDate, apiRemoveCalendarDate
├── Reservations: fetchReservations, apiCreateReservation, apiUpdateReservation
├── Events: fetchEvents, apiCreateEvent, apiUpdateEvent
├── Tasks: fetchTasks, apiCreateTask, apiUpdateTask, apiDeleteTask
├── Users: fetchUsers
└── Constantes: LEAD_STATES, CALENDAR_STATES, CANALES, TIPOS_EVENTO, TASK_STATES, TASK_PRIORITIES
```

### Patrón de migración frontend (store → API)

Todos los componentes siguen este patrón:

| Antes (store.js)                                | Después (api.js)                                      |
|--------------------------------------------------|-------------------------------------------------------|
| `import { getLeads } from "@/lib/store"`         | `import { fetchLeads } from "@/lib/api"`              |
| `useMemo(() => getLeads(), [refreshKey])`        | `useState([]) + useEffect(() => loadData(), [])`      |
| `function handleCreate(d) { createLead(d) }`     | `async function handleCreate(d) { await apiCreateLead(d) }` |
| `refresh()` (incrementa refreshKey)              | `await loadData()` (re-fetch desde API)               |
| Sin loading state                                | `useState(true)` → muestra "Cargando..."              |
| Datos planos (IDs sueltos)                       | Includes del API (task.lead?.nombre, p.lead?.nombre)  |

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
| rol           | STRING  | Admin, Comercial, Operaciones, Viewer (validado en app) |
| activo        | BOOLEAN | default: true      |
| ultimo_acceso | DATE    | nullable           |

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
| managed_by_user_id | UUID    | FK → users         |
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
| Campo           | Tipo   | Restricción       |
|-----------------|--------|-------------------|
| id              | UUID   | PK, auto          |
| fecha           | DATE   | NOT NULL, UNIQUE   |
| estado_fecha    | STRING | (Disponible, Bloqueada, Reservada, Confirmada) |
| fuente          | STRING |                    |
| lead_id         | UUID   | FK → leads (nullable) |
| evento_id       | UUID   | FK → events (nullable)|
| nota            | TEXT   |                    |
| google_event_id | STRING | ID del evento en Google Calendar (nullable) |
| created_at      | DATE   | default: NOW       |

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
| calendar_date_id      | UUID    | FK → calendar_dates    |
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

Definidas en `lib/api.js` (exportadas y usadas por todos los componentes frontend):

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
// + "Tentativa" (visual en calendario, derivado de lead.fecha_tentativa, no es un estado de CalendarDate)

CANALES = ["WhatsApp", "Web", "Referido", "Instagram", "Facebook", "Telefono"]

TIPOS_EVENTO = ["Fiesta de 15", "Egresados", "Casamiento", "Evento Corporativo", "Otro"]

TASK_STATES = ["Pendiente", "En Proceso", "Hecho", "Cancelado"]

TASK_PRIORITIES = ["Alta", "Media", "Baja"]

USER_ROLES = ["Admin", "Comercial", "Operaciones", "Viewer"]
```

---

## Reglas de Negocio (implementadas en API routes)

1. **Lead → Perdido**: Requiere `motivo` obligatorio (400 si falta).
2. **Lead → "Propuesta enviada"**: Auto-crea Task de seguimiento con `prioridad: Alta` y `due_date: +3 días`.
2b. **Lead → estados avanzados del pipeline**: Auto-crea Proposal si no existe. Estados: "Propuesta enviada"→Enviada, "Esperando respuesta"→Enviada, "Visita agendada"→Enviada, "En negociacion"→En negociación, "Reserva tomada"→Aceptada.
2c. **CalendarDate Reservada/Confirmada + lead**: Auto-crea Proposal "Aceptada" si no existe (o actualiza la última a Aceptada).
3. **CalendarDate**: No puede haber dos leads con estado Reservada/Confirmada en la misma fecha (409 conflict).
4. **Reservation**: Un lead solo puede tener una reserva, `lead_id` es UNIQUE (409 si ya existe).
5. **Event**: Un lead solo puede tener un evento, `lead_id` es UNIQUE (409 si ya existe).
6. **Event creado** (POST /api/events): Automáticamente:
   - Crea/actualiza CalendarDate a "Confirmada" con el `lead_id` y `evento_id`
   - Crea registro en LeadStatusHistory
   - Actualiza lead a `estado_actual: "Evento confirmado"`
6b. **CalendarDate → Lead sync bidireccional** (POST /api/calendar): Automáticamente:
   - Si `estado_fecha` = "Reservada" + `lead_id` → Lead pasa a `"Reserva tomada"` + limpia `fecha_tentativa` + historial + **auto-crea Reservation** si no existe
   - Si `estado_fecha` = "Confirmada" + `lead_id` → Lead pasa a `"Evento confirmado"` + limpia `fecha_tentativa` + historial + **auto-crea Event** si no existe (con tipo_evento del lead)
   - En ambos casos: última propuesta del lead pasa a **"Aceptada"** automáticamente
   - Al limpiar `fecha_tentativa`, el marcador purple "Tentativa" desaparece del calendario
6c. **Lead → Propuesta auto-sync** (PUT /api/leads/:id/status):
   - Lead → "Reserva tomada" o "Evento confirmado" → última propuesta pasa a **"Aceptada"**
   - Lead → "Perdido" → última propuesta pasa a **"Rechazada"** (si no estaba Aceptada)
7. **Proposal.version**: Se auto-incrementa contando `Proposal.count({ where: { lead_id } })`.
8. **Proposal → "Enviada"** (PUT /api/proposals/:id): Auto-registra `fecha_envio` si no tenía.
9. **Delete Lead** (DELETE /api/leads/:id): Cascade manual → destruye en orden:
   - Interactions → Visits → Proposals → LeadStatusHistory → Reservations → Tasks → Events → CalendarDates (+ elimina de Google Calendar) → Lead
9b. **Update Lead** (PUT /api/leads/:id): Sanitiza body (excluye id, estado_actual, created_at). Convierte fecha_tentativa vacía a null. Si cambia valor_estimado → actualiza precio_total de la última propuesta asociada.
10. **GET /api/users**: Excluye `password_hash` del response (solo devuelve id, nombre, email, rol, activo).
11. **GET /api/leads/:id**: Incluye todas las relaciones (interactions, visits, proposals, status_history, reservation, event).
12. **GET /api/tasks**: Incluye relaciones (lead, event, assigned_user).
13. **GET /api/reservations**: Incluye relaciones (lead, calendar_date).
14. **GET /api/events**: Incluye relaciones (lead, calendar_date).
15. **Seed de usuarios** (POST /api/seed): Crea 3 usuarios demo si la tabla users está vacía. Se ejecuta automáticamente en page.jsx al cargar la app.
16. **Registro** (POST /api/auth/register): Hash con bcrypt (salt 10), `activo: false` por defecto. Email único (409).
17. **Login** (POST /api/auth/login): Compara password con bcrypt. Rechaza si `activo: false` (403). Retorna user sin password_hash.
18. **Calendario tentativas**: Los leads con `fecha_tentativa` se muestran automáticamente en el calendario como marcadores purple. Al seleccionar un lead tentativo desde el modal, se sugiere estado "Reservada" y se pre-asocia el lead.
19. **Google Calendar Sync (App → Google)**: Al crear/actualizar CalendarDate con estado Reservada/Confirmada → crea/actualiza evento en Google Calendar. Al liberar/eliminar → elimina de Google Calendar. Fallo de Google no rompe la operación local.
20. **Google Calendar Sync (Google → App)**: Webhook recibe push notifications. Evento creado en Google sin carolinaId → crea CalendarDate "Bloqueada". Evento eliminado → libera CalendarDate. Evento movido → actualiza fecha.
21. **Google Calendar colores**: Reservada=azul(9), Confirmada=verde(10), Bloqueada=amarillo(5). Eventos con lead muestran nombre+tipo_evento como summary.

---

## API Endpoints (25 rutas + seed, todas en app/api/)

Todas las rutas importan modelos desde `@/lib/models/associations` y usan `NextResponse.json()`.
Todas envuelven la lógica en try/catch y devuelven `{ error: message }` con status 500 en caso de error.

### Leads
```
GET    /api/leads                    → Listar todos. Filtros: ?estado=X&anio=2026. Order: created_at DESC
POST   /api/leads                    → Crear lead. Body: { nombre, telefono, email, canal_origen, tipo_evento, fecha_tentativa, anio_evento, valor_estimado, notas }. Estado inicial: "Consulta inicial"
GET    /api/leads/:id                → Detalle con includes: interactions, visits, proposals, status_history, reservation, event
PUT    /api/leads/:id                → Actualizar campos editables (sanitiza body: excluye id, estado_actual, created_at). fecha_tentativa="" → null. Si cambia valor_estimado → sync precio_total de última propuesta
DELETE /api/leads/:id                → Eliminar con cascade manual (interactions, visits, proposals, history, reservations, tasks, events, calendar_dates + Google Calendar)
PUT    /api/leads/:id/status         → Body: { estado, motivo?, user_id? }. Crea LeadStatusHistory. Si "Propuesta enviada" → auto-crea Task. Auto-crea Proposal si no existe para estados avanzados
GET    /api/leads/:id/interactions   → Listar interacciones del lead. Order: fecha DESC
POST   /api/leads/:id/interactions   → Body: { tipo, descripcion, fecha?, created_by_user_id? }
GET    /api/leads/:id/visits         → Listar visitas del lead. Order: fecha_visita DESC
POST   /api/leads/:id/visits         → Body: { fecha_visita, resultado, notas, created_by_user_id? }
GET    /api/leads/:id/proposals      → Listar propuestas del lead. Order: version DESC
POST   /api/leads/:id/proposals      → Body: { contenido_html/contenido, precio_total, created_by_user_id? }. Version auto-incrementa. Estado: "Borrador"
```

### Proposals
```
GET    /api/proposals                → Todas las propuestas con includes: lead, creator. Order: created_at DESC
PUT    /api/proposals/:id            → Body: campos a actualizar. Si estado → "Enviada" y no tenía fecha_envio, la auto-registra
```

### Calendar
```
GET    /api/calendar                 → Todas las fechas. Order: fecha ASC
POST   /api/calendar                 → Body: { fecha, estado_fecha, fuente?, lead_id?, evento_id?, nota? }. Si fecha existe → update. Valida conflicto Reservada/Confirmada (409). Auto-sync: si Reservada+lead → lead pasa a "Reserva tomada" + limpia fecha_tentativa. Si Confirmada+lead → lead pasa a "Evento confirmado"
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

### Google Calendar
```
GET    /api/google-calendar          → Test de conexión. Retorna ok + últimos eventos
POST   /api/google-calendar/webhook  → Receptor de push notifications de Google. Procesa cambios: crear/actualizar/eliminar CalendarDate
POST   /api/google-calendar/setup    → Registrar webhook. Body: { baseUrl? }. Retorna channelId, resourceId, expiration
DELETE /api/google-calendar/setup    → Detener webhook. Body: { channelId, resourceId }
POST   /api/google-calendar/sync     → Sync manual/completo. Compara eventos Google ↔ CalendarDates en DB. Crea, linkea y limpia según diferencias
```

### Users
```
GET    /api/users                    → Listar todos. Campos: id, nombre, email, rol, activo (SIN password_hash). Order: nombre ASC
```

### Auth
```
POST   /api/auth/login               → Body: { email, password }. Valida contra bcrypt. Retorna user (sin password_hash). Error 401 si credenciales inválidas. Error 403 si cuenta no activada
POST   /api/auth/register            → Body: { nombre, email, password, rol? }. Hash con bcrypt (salt 10). Crea usuario con activo=false. Valida email único (409). Retorna user creado
```

### Seed
```
POST   /api/seed                     → Crea 3 usuarios demo si la tabla está vacía (Carolina/Admin, Maria/Comercial, Luis/Operaciones). Retorna { seeded: true/false }
```

---

## Vistas del Frontend

| Vista           | Componente           | Fuente de datos          | Descripción                                      |
|-----------------|----------------------|--------------------------|--------------------------------------------------|
| Landing/Auth    | landing-page.jsx + auth/* | API /auth/login, /auth/register | Landing pública + Login + Registro + Pending approval |
| Dashboard       | dashboard-view.jsx   | 5 fetches en paralelo    | Métricas: leads por estado, pipeline, gráficos recharts |
| Leads           | leads-view.jsx       | fetchLeads + fetchLeadById | CRUD completo + detalle slideout con tabs (timeline, interacciones, propuestas) |
| Calendario      | calendar-view.jsx    | fetchCalendarDates + fetchLeads | Gestión de fechas + fechas tentativas de leads (purple) |
| Propuestas      | proposals-view.jsx   | fetchAllProposals        | Grid de propuestas con acciones (enviar, aceptar, rechazar) |
| Eventos         | events-view.jsx      | fetchEvents              | Lista expandible de eventos confirmados con estado operativo, servicios, detalle lead |
| Tareas          | tasks-view.jsx       | fetchTasks               | Panel Kanban 4 columnas (Pendiente/En Proceso/Hecho/Cancelado) |
| Guía            | guide-view.jsx       | (estático)               | Guía de usuario integrada con secciones colapsables |

### Detalle de cada componente migrado

**leads-view.jsx** (componente más complejo)
- `LeadsView`: Carga leads con `fetchLeads()`, filtra client-side (search, año, estado, canal)
- `LeadDetail`: Carga lead completo con `fetchLeadById(id)` que trae todas las asociaciones incluidas
- `LeadForm`: Formulario de crear/editar con normalización de fechas ISO → YYYY-MM-DD
- Vista tabla y vista Kanban por estado
- Handlers async: handleCreate, handleUpdate, handleDelete, handleStatusChange, handleAddInteraction

**tasks-view.jsx**
- Carga en paralelo: `fetchTasks()`, `fetchLeads()`, `fetchUsers()`
- Usa asociaciones incluidas del API: `task.lead?.nombre`, `task.assigned_user?.nombre`
- Filtros: por estado y por usuario asignado
- Vista Kanban con 4 columnas por TASK_STATES
- Toggle estado cíclico: Pendiente → En Proceso → Hecho → Pendiente
- Normalización de dates: `task.due_date.substring(0, 10)` para manejar ISO strings

**calendar-view.jsx**
- Carga: `fetchCalendarDates()` + `fetchLeads()` en paralelo
- Convierte array de fechas a mapa `{ "YYYY-MM-DD": calendarDate }` con useMemo
- **Fechas tentativas**: Mapea `lead.fecha_tentativa` → muestra marcadores purple "Tentativa" en el calendario
  - Si un lead tiene `fecha_tentativa`, aparece en el día correspondiente con el nombre del lead
  - Al hacer click, el modal muestra las tentativas y permite seleccionar un lead para asociarlo a la fecha
  - Al seleccionar un lead tentativo, auto-sugiere estado "Reservada"
  - Tentativas que ya tienen CalendarDate con el mismo lead no se duplican
- 5 colores de estado: Disponible (emerald), Bloqueada (amber), Reservada (blue), Confirmada (green), Tentativa (purple)
- `DateFormModal`: Crear/editar/liberar fechas con `apiSetCalendarDate`/`apiRemoveCalendarDate`
- Confirmación Sonner antes de liberar/eliminar fecha (toast con botón "Sí, eliminar" + "Cancelar")
- Errores del API (409 conflict) se muestran inline

**proposals-view.jsx**
- Carga: `fetchAllProposals()` + `fetchLeads()` en paralelo
- GET /api/proposals incluye lead y creator → usa `p.lead?.nombre` directo
- `apiCreateProposal(leadId, data)` - leadId va como path param
- Acciones por estado: Borrador→Enviar, Enviada→Aceptar/Rechazar

**dashboard-view.jsx**
- Carga 5 endpoints en paralelo con `Promise.allSettled()`: leads, calendar, tasks, events, proposals (resiliente: si un fetch falla, los demás cargan igual)
- Computa estadísticas client-side: pipeline, canales, conversion rate, tareas vencidas
- Gráficos recharts: BarChart (pipeline) + PieChart (canales)

### Navegación
- **Desktop**: Sidebar colapsable a la izquierda (app-sidebar.jsx)
- **Mobile**: Hamburger menu con overlay
- **Entry point**: `app/page.jsx` → si no hay user → LandingPage, si hay → App con sidebar

### Autenticación (Login + Registro)
- **Landing page** (`landing-page.jsx`): Router de vistas auth (null → login → register → pending)
- **Login** (`auth/login-form.jsx`): Email + password → POST /api/auth/login → bcrypt.compare → guarda user en localStorage
  - Toggle mostrar/ocultar contraseña (icono ojo)
- **Registro** (`auth/register-form.jsx`): Nombre + email + password → POST /api/auth/register → bcrypt.hash → crea usuario con `activo: false`
  - Validaciones en tiempo real: nombre (min 2 chars), email formato, password (min 6), passwords coinciden
  - Toggle mostrar/ocultar en ambos campos de contraseña
  - Al registrarse exitosamente → redirige a pantalla de "cuenta pendiente de aprobación"
- **Pending approval** (`auth/pending-approval.jsx`): Pantalla informativa post-registro
- **Flujo de aprobación**: Los usuarios registrados quedan con `activo: false`. Un admin debe activarlos manualmente
- **Sesión**: localStorage (`carolina_user`) - persistencia client-side
- `page.jsx` → useEffect: lee user de localStorage, llama POST /api/seed para crear usuarios demo

### Seed de Usuarios Demo
Al cargar la app, `page.jsx` hace `fetch('/api/seed', { method: 'POST' })`:
- Si la tabla `users` está vacía, crea 3 usuarios:
  - Carolina (Admin)
  - Maria (Comercial)
  - Luis (Operaciones)
- Si ya hay usuarios, no hace nada (idempotente)

---

## Estado Actual del Proyecto

### Hecho
- [x] Landing page con login
- [x] **Login real** con email/password contra PostgreSQL + bcrypt
- [x] **Registro de usuarios** con validaciones en tiempo real + hash bcrypt + flujo de aprobación admin
- [x] **Pantalla pending approval** post-registro (activo=false hasta que admin active)
- [x] Todas las vistas del frontend (Dashboard, Leads, Calendar, Proposals, Tasks)
- [x] **Calendario con fechas tentativas** - leads con fecha_tentativa aparecen en purple como "Tentativa"
- [x] Componentes UI completos (57 shadcn/ui)
- [x] Modelos Sequelize definidos (10 tablas) con UUID
- [x] Asociaciones entre modelos definidas (associations.js)
- [x] Base de datos PostgreSQL creada con tablas sincronizadas
- [x] **25 API Routes creadas** (app/api/) - CRUD real contra PostgreSQL (incluye auth, Google Calendar)
- [x] Reglas de negocio implementadas en las API routes
- [x] **lib/api.js creado** - Cliente fetch wrapper con todas las funciones + constantes
- [x] **lib/db.js creado** - Entry point backend que exporta sequelize + todos los modelos
- [x] **5 componentes migrados** de store.js a API (leads, tasks, calendar, proposals, dashboard)
- [x] **page.jsx migrado** - Sin dependencia de store.js, seed via API
- [x] **Endpoint seed** (POST /api/seed) para crear usuarios demo
- [x] Build exitoso (next build compila 20 rutas API + seed + página estática)
- [x] next.config.mjs configurado con serverExternalPackages
- [x] pg-hstore instalado (dependencia de Sequelize para PostgreSQL)
- [x] **User.rol migrado de ENUM a STRING** - evita conflictos de tipo en PostgreSQL, validación en app
- [x] **Conectado a Supabase** (PostgreSQL remoto) via .env.local con SSL automático
- [x] **Deploy en Vercel** funcionando - serverless con pg, sequelize, pg-hstore
- [x] **`.npmrc` con `node-linker=hoisted`** - elimina symlinks de pnpm para compatibilidad con Vercel
- [x] **`require('pg')` explícito + `outputFileTracingIncludes`** - fuerza inclusión de pg en funciones serverless
- [x] **URL placeholder en Sequelize** para que `next build` no crashee sin DATABASE_URL
- [x] **`.env` removido del historial git** - filter-branch + force push por seguridad
- [x] **Toggle mostrar/ocultar password** en login y registro (icono ojo)
- [x] **Sync bidireccional Calendar ↔ Lead** - reservar/confirmar fecha desde calendario actualiza estado del lead + limpia fecha_tentativa
- [x] **TIPOS_EVENTO actualizados** - Fiesta de 15, Egresados, Casamiento, Evento Corporativo, Otro
- [x] **Sonner toasts en toda la app** - reemplaza alert/confirm nativos, feedback en todas las operaciones CRUD (leads, calendar, tasks, proposals, auth)
- [x] **Modal responsive fix** - max-h-[90vh] + overflow-y-auto en modal de crear/editar lead
- [x] **Auto-crear Reservation** al marcar fecha como "Reservada" + lead en calendario
- [x] **Auto-crear Event** al marcar fecha como "Confirmada" + lead en calendario (con tipo_evento del lead)
- [x] **Vista Eventos** (events-view.jsx) - lista expandible con estado operativo, tipo, invitados, servicios, detalle lead
- [x] **Sidebar actualizado** - nueva entrada "Eventos" con icono Sparkles
- [x] **Auto-sync Propuestas ↔ Lead status** - Reserva/Confirmado → propuesta "Aceptada", Perdido → propuesta "Rechazada"
- [x] **Guía de usuario** (GUIA_USUARIO.md) - documentación completa para usuarios finales
- [x] **Guía integrada en la plataforma** (guide-view.jsx) - accesible desde el sidebar "Guía"
- [x] **Google Calendar bidireccional** - sync con Google Calendar via service account (JWT)
  - `lib/googleCalendar.js` - servicio central (auth, CRUD eventos, webhooks)
  - App → Google: crear/actualizar/eliminar eventos al reservar/confirmar/liberar fechas
  - Google → App: webhook receptor + sync manual para cambios externos
  - Colores por estado: Reservada=azul, Confirmada=verde, Bloqueada=amarillo
  - `google_event_id` en CalendarDate para trackeo bidireccional

### Pendiente (próximos pasos)
- [ ] **Optimistic Result + Redux** (refactor plataforma) - patrón optimistic UI con Redux global state para respuesta instantánea en toda la app (si falla la petición se revierte)
- [ ] Sesiones server-side (JWT o NextAuth) - actualmente usa localStorage
- [ ] Panel admin para activar/desactivar usuarios registrados
- [ ] Pasar user_id real al cambiar estado de lead (actualmente pasa null)
- [ ] Migraciones de BD (actualmente usa sequelize.sync({ alter: true }))
- [ ] Validaciones server-side con Zod en las API routes
- [ ] Tests (unit + integration)
- [ ] Eliminar `lib/store.js` (ya no se usa, pero queda como referencia)

---

## Setup del Proyecto

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd LaCarolina
pnpm install

# 2. Configurar .env.local (NO .env)
# Crear archivo .env.local en la raíz con:
# DATABASE_URL=postgresql://usuario:password@host:puerto/db?sslmode=require
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# GOOGLE_CALENDAR_ID=xxx@group.calendar.google.com
# GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@proyecto.iam.gserviceaccount.com
# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 3. Sincronizar modelos (crea las tablas automáticamente)
node -e "const { initModels } = require('./lib/models/init'); initModels();"

# 4. Iniciar dev server
pnpm dev
# Abre http://localhost:3000
# Los usuarios demo se crean automáticamente al cargar la app
```

### Deploy en Vercel
- Las env vars (DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) se configuran en Vercel > Settings > Environment Variables
- `.npmrc` con `node-linker=hoisted` es OBLIGATORIO para que pnpm funcione en Vercel (elimina symlinks)
- `serverExternalPackages` + `outputFileTracingIncludes` + `require('pg')` explícito aseguran que pg se incluya en las funciones serverless
- `lib/models/index.js` usa URL placeholder (`postgres://build:build@localhost:5432/build`) durante build para que Sequelize no crashee sin DATABASE_URL

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

## Notas Técnicas

### Interop CommonJS/ESM
- Los modelos Sequelize usan CommonJS (`require`/`module.exports`) porque Sequelize no soporta ESM nativo
- Las API routes usan ESM (`import`/`export`) como requiere Next.js App Router
- El interop funciona via `const { Model } = require('@/lib/models/associations')` dentro de archivos ESM
- Next.js resuelve esto con webpack/turbopack automáticamente

### Manejo de Fechas
- PostgreSQL `DATE` → Sequelize retorna ISO strings ("2025-06-15T00:00:00.000Z")
- Los inputs HTML `type="date"` esperan "YYYY-MM-DD"
- LeadForm normaliza: `initial.fecha_tentativa.substring(0, 10)`
- Tasks normaliza: `task.due_date.substring(0, 10)` para display y comparación
- Calendar usa fechas en formato "YYYY-MM-DD" consistentemente

### Modelos con timestamps
- Los modelos usan `timestamps: true` con `createdAt: 'created_at'` y `updatedAt: 'updated_at'`
- Excepción: User tiene `timestamps: true` con mapeo explícito a snake_case

### Notificaciones (Sonner) — CONVENCIÓN OBLIGATORIA
- **SIEMPRE usar Sonner** (`import { toast } from "sonner"`) para feedback al usuario. NUNCA usar `alert()`, `confirm()` ni `window.prompt()`
- `<Toaster richColors position="top-right" />` está montado globalmente en `app/layout.jsx`
- Componente wrapper: `components/ui/sonner.tsx` (shadcn/ui con soporte de tema)
- **Patrones de uso:**
  - `toast.success("Lead creado exitosamente")` → operación exitosa
  - `toast.error("Error al crear lead")` → error en catch
  - `toast.warning("Motivo obligatorio")` → validación / advertencia
  - `toast("Mensaje", { action: { label: "Confirmar", onClick: fn }, cancel: { label: "Cancelar" } })` → reemplaza `confirm()` nativo
- **Todos los componentes** (leads, calendar, tasks, proposals, auth) ya usan Sonner

### Google Calendar (Service Account)
- Usa JWT auth con service account (no OAuth del usuario)
- `lib/googleCalendar.js` encapsula toda la interacción con Google Calendar API v3
- `google.auth.JWT` usa constructor con objeto `{email, key, scopes}` (NO parámetros posicionales)
- Next.js `.env.local` convierte `\n` en double-quoted strings a newlines reales, por lo que la private key se parsea condicionalmente: `key.includes('\\n') ? key.replace(/\\n/g, '\n') : key`
- Import resiliente con try/catch: si `googleapis` falla, las rutas siguen funcionando sin sync
- Webhooks de Google expiran cada ~30 días, necesitan renovación via `POST /api/google-calendar/setup`
- Colores: Reservada=9(azul), Confirmada=10(verde), Bloqueada=5(amarillo)

### Conexión a Supabase
- `lib/models/index.js` detecta Supabase automáticamente por el dominio en DATABASE_URL
- Si la URL contiene `supabase.com`, activa SSL: `{ require: true, rejectUnauthorized: false }`
- En build sin DATABASE_URL, usa placeholder para que `.define()` no crashee

---

## Referencias
- [Next.js App Router](https://nextjs.org/docs/app)
- [Sequelize v6 Docs](https://sequelize.org/docs/v6/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [shadcn/ui](https://ui.shadcn.com/)
