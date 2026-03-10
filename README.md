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

---

## ⚠️ Advertencia Importante: Next.js 16, pnpm y node_modules

Este proyecto utiliza **pnpm** con la opción `node-linker=hoisted` (ver archivo `.npmrc`). Esto es necesario para que Next.js y Turbopack puedan resolver correctamente los módulos nativos y dependencias en entornos como Vercel.

**Problemas conocidos:**
- Next.js 16 (Turbopack) no soporta correctamente los alias de importación (`@/`) ni la configuración de webpack/turbopack para alias. Por eso, todos los imports de componentes deben ser relativos (ej: `../components/mi-componente`).
- Si tienes errores de "Module not found" o problemas de imports, asegúrate de:
  - Eliminar la carpeta `node_modules` y `.next` y luego correr `pnpm install` para limpiar el entorno.
  - Usar siempre imports relativos en vez de alias.
  - Verificar que `.npmrc` contenga `node-linker=hoisted`.
- En Vercel, siempre haz un "Redeploy" con la opción "Clear build cache" si cambias dependencias o la estructura de imports.

**Resumen:**
> No uses alias de importación (`@/`) en Next.js 16 con pnpm. Usa imports relativos y limpia el entorno si hay errores de resolución de módulos.

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
| Campo                    | Tipo    | Restricción       |
|--------------------------|---------|-------------------|
| id                       | UUID    | PK, auto          |
| nombre                   | STRING  | NOT NULL           |
| telefono                 | STRING  |                    |
| email                    | STRING  |                    |
| canal_origen             | STRING  |                    |
| tipo_evento              | STRING  |                    |
| tipo_cliente             | STRING  | Particular / Empresa / Institucional |
| fecha_tentativa          | DATE    | Fecha del evento (tentativa/confirmada) |
| fecha_visita_salon       | DATE    | Auto-crea CalendarDate "Visita" al guardar |
| fecha_firma_contrato     | DATE    | Auto-set al estado "Contrato firmado" |
| fecha_limite_pago_total  | DATE    | Auto-calculado: fecha_tentativa - 30 días |
| anio_evento              | INTEGER | Auto-sync con año de fecha_tentativa |
| estado_actual            | STRING  | Ver LEAD_STATES     |
| valor_estimado           | FLOAT   |                    |
| invitados_estimados      | INTEGER | Se copia al Event al firmar contrato/confirmar fecha |
| notas                    | TEXT    |                    |
| managed_by_user_id       | UUID    | FK → users         |
| created_at               | DATE    | default: NOW       |
| updated_at               | DATE    | default: NOW       |

### interactions
| Campo              | Tipo   | Restricción |
|--------------------|--------|-------------|
| id                 | UUID   | PK, auto    |
| lead_id            | UUID   | FK → leads, NOT NULL |
| tipo               | STRING | (deprecado, mismo valor que canal) |
| canal              | STRING | WhatsApp / Llamada / Email / Presencial |
| direction          | STRING | OUT (saliente) / IN (entrante) |
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

### proposals (ahora llamada "Contratos" en la UI)
| Campo                           | Tipo    | Restricción |
|---------------------------------|---------|-------------|
| id                              | UUID    | PK, auto    |
| lead_id                         | UUID    | FK → leads, NOT NULL |
| version                         | INTEGER | NOT NULL (auto-incrementa por lead) |
| contenido_html                  | TEXT    | Notas / condiciones |
| precio_total                    | FLOAT   | Compatibilidad (reemplazado por precio_senia) |
| precio_senia                    | FLOAT   | Monto de seña/anticipo |
| tipo_evento                     | STRING  | Se copia al Event al firmar |
| invitados_estimados             | INTEGER | Se copia al Event al firmar |
| valor_total_evento              | FLOAT   | Se copia al Event al firmar |
| modalidad_actualizacion_precios | STRING  | Se copia al Event al firmar |
| servicios_base                  | JSON    | Array de strings ["Salón", "Catering"]. Se copia al Event |
| adicionales                     | JSON    | Array de {nombre, opciones:[{descripcion,precio}], opcion_elegida}. Se fusiona al Event |
| menu_seleccionado               | STRING  | Se copia al Event al firmar |
| minimo_tarjetas                 | INTEGER | Se copia al Event al firmar |
| valor_tarjeta_adulto            | FLOAT   | Se copia al Event al firmar |
| valor_tarjeta_adolescente       | FLOAT   | Se copia al Event al firmar |
| valor_tarjeta_nino              | FLOAT   | Se copia al Event al firmar |
| estado                          | STRING  | Creada / Enviada / Aprobada / Rechazada / Firmada |
| fecha_envio                     | DATE    | Auto cuando estado → Enviada |
| created_by_user_id              | UUID    | FK → users  |
| created_at                      | DATE    | default: NOW|

### calendar_dates
| Campo           | Tipo   | Restricción       |
|-----------------|--------|-------------------|
| id              | UUID   | PK, auto          |
| fecha           | DATE   | NOT NULL, UNIQUE   |
| estado_fecha    | STRING | Disponible / Bloqueada / Reservada / Confirmada / Visita |
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
| Campo                          | Tipo    | Restricción            |
|--------------------------------|---------|------------------------|
| id                             | UUID    | PK, auto               |
| lead_id                        | UUID    | FK → leads, NOT NULL, UNIQUE |
| fecha_confirmada               | DATE    |                        |
| tipo_evento                    | STRING  |                        |
| invitados_estimados            | INTEGER |                        |
| servicios_contratados          | JSON    | array: Salón / Catering / Mesa dulce / etc. |
| estado_operativo               | STRING  | Pendiente / En preparacion / Listo / Realizado |
| contrato_url                   | STRING  |                        |
| valor_total_evento             | FLOAT   | Precio total acordado  |
| estado_pago                    | STRING  | Pendiente / Parcial / Completo |
| modalidad_actualizacion_precios| STRING  | Precio fijo / Precio por tarjeta / Mixto |
| menu_seleccionado              | STRING  |                        |
| minimo_tarjetas                | INTEGER |                        |
| valor_tarjeta_adulto           | FLOAT   |                        |
| valor_tarjeta_adolescente      | FLOAT   |                        |
| valor_tarjeta_nino             | FLOAT   |                        |
| precio_senia                   | FLOAT   | Monto de seña/anticipo (ALTER TABLE) |
| adicionales                    | JSONB   | Array de {nombre, opciones, opcion_elegida} (ALTER TABLE, default '[]') |
| created_at                     | DATE    | default: NOW           |

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
  "Lead nuevo",               // Estado inicial al crear lead
  "Contactado",               // ⚡ Auto al registrar primera interacción saliente (OUT)
  "Esperando visita",         // ⚡ Auto al guardar fecha_visita_salon (desde "Lead nuevo" o "Contactado")
  "Visita al salón realizada",
  "Enviar propuesta",         // Auto-crea Task (+1 día) + Proposal Creada
  "Propuesta enviada",        // ⚡ Auto al marcar propuesta "Enviada". Auto-crea Task seguimiento (+3 días)
  "Propuesta Aceptada",       // ⚡ Auto al marcar propuesta "Aprobada"
  "Propuesta Rechazada",      // ⚡ Auto al marcar propuesta "Rechazada"
  "Esperando Reserva",        // Mide tiempo de decisión del cliente
  "Reserva tomada",           // ⚡ Auto al marcar CalendarDate "Reservada"
  "Contrato firmado",         // ⚡ Auto-crea Event + CalendarDate "Confirmada". Auto al marcar CalendarDate "Confirmada"
  "Cliente activo",
  "Evento realizado",
  "Post-evento / cerrado",
  "Perdido",                  // Requiere motivo obligatorio
]

TIPOS_CLIENTE = ["Particular", "Empresa", "Institucional"]

CALENDAR_STATES = ["Disponible", "Bloqueada", "Reservada", "Confirmada", "Visita"]
// "Tentativa" = visual en calendario (derivado de lead.fecha_tentativa, no es CalendarDate)
// "Visita" = auto-creado al guardar fecha_visita_salon en un lead (naranja)

CANALES = ["WhatsApp", "Web", "Referido", "Instagram", "Facebook", "Telefono"]

TIPOS_EVENTO = ["Fiesta de 15", "Egresados", "Casamiento", "Evento Corporativo", "Otro"]

TASK_STATES = ["Pendiente", "En Proceso", "Hecho", "Cancelado"]
TASK_PRIORITIES = ["Alta", "Media", "Baja"]

// Eventos
ESTADOS_PAGO = ["Pendiente", "Parcial", "Completo"]
MODALIDADES_PRECIO = ["Precio fijo", "Precio por tarjeta", "Mixto"]
SERVICIOS_BASE = ["Salón", "Catering"]
SERVICIOS_ADICIONALES = ["Mesa dulce", "Fotografía", "Video", "DJ extra", "Decoración especial", "Otros"]

USER_ROLES = ["Admin", "Comercial", "Operaciones", "Viewer"]
```

---

## Reglas de Negocio (implementadas en API routes)

1. **Lead → Perdido**: Requiere `motivo` obligatorio (400 si falta).
2. **Lead → "Enviar propuesta"**: Auto-crea Task `prioridad: Alta` y `due_date: +1 día`. Auto-crea Proposal en estado "Creada".
2a. **Lead → "Propuesta enviada"**: Auto-crea Task de seguimiento con `prioridad: Alta` y `due_date: +3 días`.
2b. **Lead → estados avanzados del pipeline**: Auto-crea Proposal si no existe. Estados: "Enviar propuesta"→Creada, "Propuesta enviada"→Enviada, "Visita al salón realizada"→Enviada, "Reserva tomada"→Aprobada, "Contrato firmado"→Firmada.
2c. **CalendarDate Reservada/Confirmada + lead**: Auto-crea Proposal "Aprobada" si no existe (o actualiza la última a Aprobada).
3. **CalendarDate**: No puede haber dos leads con estado Reservada/Confirmada en la misma fecha (409 conflict).
4. **Reservation**: Un lead solo puede tener una reserva, `lead_id` es UNIQUE (409 si ya existe).
5. **Event**: Un lead solo puede tener un evento, `lead_id` es UNIQUE (409 si ya existe).
6. **Event creado** (POST /api/events): Automáticamente:
   - Crea/actualiza CalendarDate a "Confirmada" con el `lead_id` y `evento_id`
   - Crea registro en LeadStatusHistory
   - Actualiza lead a `estado_actual: "Cliente activo"`
6b. **CalendarDate → Lead sync** (POST /api/calendar): Automáticamente:
   - Si `estado_fecha` = "Reservada" + `lead_id` → Lead pasa a `"Reserva tomada"` + historial + **auto-crea Reservation** si no existe
   - Si `estado_fecha` = "Confirmada" + `lead_id` → Lead pasa a `"Contrato firmado"` + historial + **auto-crea Event** si no existe
   - CalendarDate "Reservada" + lead → última propuesta pasa a **"Aprobada"** automáticamente
   - CalendarDate "Confirmada" + lead → última propuesta pasa a **"Firmada"** automáticamente
6c. **Lead → Propuesta auto-sync** (PUT /api/leads/:id/status):
   - Lead → "Reserva tomada" → última propuesta pasa a **"Aprobada"**
   - Lead → "Contrato firmado" / "Cliente activo" → última propuesta pasa a **"Firmada"**
   - Lead → "Perdido" → última propuesta pasa a **"Rechazada"** (si no estaba Firmada o Rechazada)
6d. **Lead → "Contrato firmado"** (PUT /api/leads/:id/status): Automáticamente:
   - Auto-set `fecha_firma_contrato` si no estaba seteada
   - Si hay `fecha_tentativa` y no existe Event → **auto-crea Event** con fecha, tipo y valor_estimado del lead
   - **Siempre actualiza CalendarDate** de la fecha_tentativa a "Confirmada" (sea Tentativa, Reservada o nueva)
7. **fecha_visita_salon** (POST y PUT /api/leads + PUT /api/leads/:id): Al guardar esta fecha → **auto-crea/actualiza CalendarDate** como `"Visita"` (naranja) con nota "Visita al salón: [nombre lead]". No sobreescribe fechas ya reservadas/confirmadas.
8. **anio_evento** (leads-view.jsx): Se auto-sincroniza con el año de `fecha_tentativa` al cambiar en el formulario.
9. **fecha_limite_pago_total**: Auto-calculado server-side como `fecha_tentativa - 30 días`. Se recalcula en cada PUT del lead.
10. **Proposal.version**: Se auto-incrementa contando `Proposal.count({ where: { lead_id } })`.
11. **Proposal → "Enviada"** (PUT /api/proposals/:id): Auto-registra `fecha_envio` si no tenía.
12. **Proposal → "Firmada"** (PUT /api/proposals/:id): Sincroniza automáticamente al Event todos los campos del contrato: `tipo_evento`, `invitados_estimados`, `precio_senia`, `valor_total_evento`, `modalidad_actualizacion_precios`, `servicios_contratados` (base + adicionales elegidos), `menu_seleccionado`, valores de tarjetas, `adicionales`. También actualiza el lead a "Contrato firmado", crea CalendarDate "Confirmada" si hay fecha_tentativa, y setea `fecha_firma_contrato`.
13. **Event creado** (status/route.js o calendar/route.js): Busca la última propuesta "Firmada" del lead y copia todos sus campos al nuevo Event. Si no hay propuesta firmada, usa los datos del lead como fallback.
12. **Delete Lead** (DELETE /api/leads/:id): Cascade manual → destruye en orden:
    - Interactions → Visits → Proposals → LeadStatusHistory → Reservations → Tasks → Events → CalendarDates (+ elimina de Google Calendar) → Lead
13. **Update Lead** (PUT /api/leads/:id): Sanitiza body (excluye id, estado_actual, created_at). Convierte fechas vacías a null. Si cambia valor_estimado → actualiza precio_total de la última propuesta.
14. **GET /api/users**: Excluye `password_hash`.
15. **GET /api/leads/:id**: Incluye todas las relaciones (interactions, visits, proposals, status_history, reservation, event).
16. **GET /api/events**: Incluye relaciones (lead, calendar_date).
17. **Seed de usuarios** (POST /api/seed): Crea usuarios demo si la tabla users está vacía. Se ejecuta automáticamente al cargar la app.
18. **Registro** (POST /api/auth/register): Hash con bcrypt (salt 10), `activo: false` por defecto. Email único (409).
19. **Login** (POST /api/auth/login): Compara password con bcrypt. Rechaza si `activo: false` (403).
20. **Calendario tentativas**: Leads con `fecha_tentativa` se muestran como marcadores purple en el calendario. Al hacer click → sugiere estado "Reservada" pre-asociado.
21. **Google Calendar Sync (App → Google)**: Reservada/Confirmada → crea/actualiza evento GCal. Liberada → elimina de GCal. Fallo no rompe operación local.
22. **Google Calendar Sync (Google → App)**: Webhook recibe push notifications. Sin carolinaId → CalendarDate "Bloqueada". Eliminado → libera CalendarDate.
23. **Interactions canal+direction**: Cada interacción registra `canal` (WhatsApp/Llamada/Email/Presencial) y `direction` (OUT saliente / IN entrante). Visible en cards y timeline del lead.

---

## API Endpoints (25 rutas + seed, todas en app/api/)

Todas las rutas importan modelos desde `@/lib/models/associations` y usan `NextResponse.json()`.
Todas envuelven la lógica en try/catch y devuelven `{ error: message }` con status 500 en caso de error.

### Leads
```
GET    /api/leads                    → Listar todos. Filtros: ?estado=X&anio=2026. Order: created_at DESC
POST   /api/leads                    → Crear. Body: { nombre, telefono, email, canal_origen, tipo_evento, tipo_cliente,
                                         fecha_tentativa, fecha_visita_salon, anio_evento, valor_estimado, notas }.
                                         Estado inicial: "Lead nuevo". Auto: fecha_limite_pago_total, CalendarDate "Visita"
GET    /api/leads/:id                → Detalle con includes: interactions, visits, proposals, status_history, reservation, event
PUT    /api/leads/:id                → Actualizar. Auto: fecha_limite_pago_total, CalendarDate "Visita", sync precio_total propuesta
DELETE /api/leads/:id                → Cascade manual (interactions, visits, proposals, history, reservations, tasks, events, calendar_dates + GCal)
PUT    /api/leads/:id/status         → Body: { estado, motivo?, user_id? }. Auto: Task si "Propuesta enviada",
                                         Event+CalendarDate si "Contrato firmado", Proposal auto-sync
GET    /api/leads/:id/interactions   → Listar. Order: fecha DESC
POST   /api/leads/:id/interactions   → Body: { canal, direction, descripcion, fecha?, created_by_user_id? }
GET    /api/leads/:id/visits         → Listar. Order: fecha_visita DESC
POST   /api/leads/:id/visits         → Body: { fecha_visita, resultado, notas, created_by_user_id? }
GET    /api/leads/:id/proposals      → Listar. Order: version DESC
POST   /api/leads/:id/proposals      → Body: { precio_total, created_by_user_id? }. Version auto-incrementa
```

### Proposals
```
GET    /api/proposals                → Todas las propuestas con includes: lead, creator. Order: created_at DESC
PUT    /api/proposals/:id            → Body: campos a actualizar. Si estado → "Enviada" y no tenía fecha_envio, la auto-registra
```

### Calendar
```
GET    /api/calendar                 → Todas las fechas. Order: fecha ASC
POST   /api/calendar                 → Body: { fecha, estado_fecha, lead_id?, nota? }. Crea o actualiza.
                                         Valida conflicto Reservada/Confirmada (409).
                                         Auto: Reservada+lead → lead "Reserva tomada" + Reservation.
                                               Confirmada+lead → lead "Cliente activo" + Event.
                                               Disponible/Bloqueada → elimina evento de GCal si existía.
DELETE /api/calendar/:fecha          → Liberar fecha. Cascade: elimina reservas del lead, limpia estado
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
POST   /api/events                   → Body: { lead_id, fecha_confirmada, tipo_evento?, invitados_estimados?,
                                         servicios_contratados?, valor_total_evento?, estado_pago?,
                                         modalidad_actualizacion_precios?, menu_seleccionado?,
                                         minimo_tarjetas?, valor_tarjeta_adulto/adolescente/nino?, user_id? }
                                         Auto: CalendarDate → "Confirmada", Lead → "Cliente activo" + historial
PUT    /api/events/:id               → Body: cualquier campo del modelo (acepta parcial)
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
| Contratos       | proposals-view.jsx   | fetchAllProposals + fetchLeads | Grid de contratos con form completo (tipo, invitados, seña, total, servicios base, adicionales con N opciones, producción). Editar + Ver + Enviar/Aprobar/Rechazar/Firmar/Imprimir |
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
- Acciones por estado: Creada→Enviar, Enviada→Aprobar/Rechazar, Aprobada→Firmar
- Estado "Firmada": inmutable (sin botón Editar), muestra botón "Imprimir" (window.print())
- `disabled={!!submittingId}` bloquea todos los botones de cards mientras hay una petición en curso

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
- [x] **Auto-sync Propuestas ↔ Lead status** - Reserva → propuesta "Aprobada", Confirmado/Firmado → propuesta "Firmada", Perdido → propuesta "Rechazada"
- [x] **Guía de usuario** (GUIA_USUARIO.md) - documentación completa para usuarios finales
- [x] **Guía integrada en la plataforma** (guide-view.jsx) - accesible desde el sidebar "Guía"
- [x] **Google Calendar bidireccional** - sync con Google Calendar via service account (JWT)
  - `lib/googleCalendar.js` - servicio central ESM (auth, CRUD eventos, webhooks)
  - App → Google: crear/actualizar/eliminar eventos al reservar/confirmar/liberar fechas
  - Google → App: webhook receptor + sync manual para cambios externos
  - Colores por estado: Reservada=azul, Confirmada=verde, Bloqueada=amarillo
  - `google_event_id` en CalendarDate para trackeo bidireccional
  - Fix: convertido de CommonJS a ESM (`import`/`export`) — `require()` en try/catch fallaba silenciosamente en Next.js App Router
  - Fix: `fecha.toString()` en Date de Sequelize daba formato incorrecto → cambiado a `new Date(fecha).toISOString().substring(0,10)`
- [x] **Pipeline de 15 estados** con automatizaciones: interacción OUT → "Contactado", fecha_visita → "Esperando visita", propuesta → sync lead state
- [x] **Campo invitados_estimados en leads** - se copia al Event al confirmar
- [x] **Valor estimado con formato** - separadores de miles al escribir (es-AR)
- [x] **Vista Kanban altura completa** - ocupa viewport, cada columna scrollea internamente
- [x] **Anti-doble-click** en cambio de estado y acciones de propuesta
- [x] **Servicios contratados UI modular** (events-view) - multiselect Base + Adicionales con toggle
- [x] **Módulo de Pagos completo** - tabla `payments` + API routes + UI en detalle de evento
  - POST crea pago, PUT solo cambia estado/observacion (inmutable)
  - Auto-recalcula `estado_pago` del evento (Pendiente/Parcial/Completo) al confirmar/anular
  - Historial inline con cobrado acumulado y saldo pendiente en tiempo real
- [x] **Módulo de Contratos** (proposals renombrado en UI) - 12 campos nuevos + adicionales con opciones múltiples
  - `precio_senia`, `tipo_evento`, `invitados_estimados`, `valor_total_evento`, `modalidad_actualizacion_precios`, `servicios_base`, `adicionales`, `menu_seleccionado`, tarjetas
  - `adicionales` JSON: `[{nombre, opciones:[{descripcion,precio}], opcion_elegida}]` — cliente elige una opción por adicional
  - Estados: Creada → Enviada → Aprobada → Firmada (o Rechazada). Firmada es el disparador de todas las automatizaciones.
  - Firmada: inmutable, botón "Imprimir". Editar solo disponible en Creada/Enviada/Aprobada.
  - `disabled={!!submittingId}` bloquea todos los botones mientras cualquier petición está en curso
  - Sync automático: Firmar contrato → copia todos los campos al Event + lead → "Contrato firmado" + CalendarDate "Confirmada"
  - Al crear Event: busca última propuesta "Firmada" del lead y copia sus campos (fallback: datos del lead)
- [x] **Nuevos campos en events**: `precio_senia` (FLOAT) + `adicionales` (JSONB) — paridad total con proposals
  - SQL: `ALTER TABLE events ADD COLUMN IF NOT EXISTS precio_senia FLOAT;`
  - SQL: `ALTER TABLE events ADD COLUMN IF NOT EXISTS adicionales JSONB DEFAULT '[]';`
- [x] **Anti-double-submit en LeadForm** - `submitting` state + botón disabled durante creación/edición de lead

### Pendiente - Roadmap

---

#### PRIORIDAD ALTA — v2.0: CRM Contractual-Comercial

> El objetivo es que el CRM refleje el contrato real. Si no lo refleja, el contrato queda aislado y se pierde control, trazabilidad y dinero.

##### A. Nuevos campos en `leads`

Los campos se agrupan por lógica de sistema, no por lo visual.

**Primera instancia** (cuando llega una persona):
- [x] `fecha_visita_salon` (DATE) — clave de conversión, antes del contrato
- [x] `tipo_cliente` (STRING: `Particular`, `Empresa`, `Institucional`) — campo crítico para precios, comunicación, automatizaciones y reporting

**Segunda instancia** (a partir de que la persona va a firmar):
- [x] `fecha_firma_contrato` (DATE) — auto-set cuando estado → `Contrato firmado`
- [x] `fecha_limite_pago_total` (DATE) — auto-calculada: `fecha_evento - 30 días` (en PUT lead y visible en formulario)

##### B. Estado comercial (nuevo flujo de pipeline) ✅

Reemplazar `LEAD_STATES` actual por el siguiente flujo cerrado que alinea CRM + realidad operativa + contrato:

```js
ESTADO_COMERCIAL = [
  "Lead nuevo",              // Ingresa al sistema
  "Contactado",              // Se estableció primer contacto
  "Visita al salón realizada", // Fue al salón → campo clave de conversión
  "Propuesta enviada",       // Recibió propuesta formal
  "Reserva tomada",          // Pagó seña
  "Contrato firmado",        // Firmó → se convierte en Cliente
  "Cliente activo",          // Evento próximo, en preparación
  "Evento realizado",        // El evento ocurrió
  "Post-evento / cerrado"    // Cierre total
]
```

##### ✅ C. Bloque financiero en `reservations` / `events`

Campos nuevos (segunda instancia — imprescindible para riesgo financiero y seguimiento):

| Campo                         | Tipo   | Notas                                               |
|-------------------------------|--------|-----------------------------------------------------|
| `valor_total_evento`          | FLOAT  | Precio acordado total del evento                    |
| `reserva_senia`               | FLOAT  | Monto abonado como seña (ya existe `monto_senia`)   |
| `saldo_pendiente`             | FLOAT  | Auto-calculado: `valor_total - suma pagos`          |
| `estado_pago`                 | STRING | `Sin pagos`, `Reserva paga`, `En cuotas`, `Pagado total` |
| `modalidad_actualizacion_precios` | STRING | `Mensual`, `Bimestral`, `Trimestral`           |

##### ✅ D. Servicios contratados — UI modular

La tabla `events` ya tiene `servicios_contratados` (JSON). Mejorar la UI con multiselect estructurado:

```
Servicios base:
  ☐ Salón   ☐ Catering

Servicios adicionales:
  ☐ Mesa dulce   ☐ Fotografía   ☐ Video
  ☐ DJ extra     ☐ Decoración especial   ☐ Otros (texto libre)
```

Permite: upsell, reporting por servicio, estandarización de contratos futuros.

##### ✅ E. Campos de producción en `events`

| Campo                      | Tipo    | Notas                                          |
|----------------------------|---------|------------------------------------------------|
| `menu_seleccionado`        | STRING  | `Menu 1`, `Menu 2`, `Personalizado`            |
| `minimo_tarjetas`          | INTEGER | Mínimo de tarjetas requerido                   |
| `valor_tarjeta_adulto`     | FLOAT   |                                                |
| `valor_tarjeta_adolescente`| FLOAT   |                                                |
| `valor_tarjeta_nino`       | FLOAT   |                                                |

> `invitados_estimados` ya existe en `events`.

##### Flujo ideal de datos (definitivo)

```
1. Ingreso de lead (simple)
   nombre · teléfono · canal · tipo_evento · fecha_evento · notas

2. Calificación
   fecha_visita_salon · presupuesto_estimado · servicios_de_interes · tipo_cliente

3. Reserva
   (transición automática al marcar fecha como "Reservada")

4. Cliente
   fecha_firma_contrato · reserva_senia · valor_total_evento
   servicios_contratados · estado_pago · modalidad_actualizacion_precios

5. Fechas clave automáticas
   fecha_limite_pago_total = fecha_evento − 30 días
```

---

#### PRIORIDAD MEDIA — Mejoras técnicas

##### ⚠️ Tabla `lead_states` — Migrar estados de STRING hardcodeado a tabla en BD

Actualmente `estado_actual` en `leads` es un STRING libre. Los estados posibles están hardcodeados en `lib/api.js` (`LEAD_STATES`) y en el frontend. Esto funciona pero tiene limitaciones importantes:

- **No se puede medir tiempo por etapa** (sin saber cuándo entró/salió de cada estado en forma estructurada)
- **No hay estadísticas reales de pipeline** (cuántos leads pasan por cada estado, cuántos quedan estancados)
- **Cualquier typo rompe silenciosamente** el pipeline/kanban
- **Impossible hacer filtros/reportes por estado sin hardcodear strings** en cada query

**Solución propuesta:**
```sql
-- Nueva tabla
lead_states: id, nombre, orden, color, descripcion, activo

-- Campo nuevo en leads (o reemplazar estado_actual)
estado_actual_id UUID FK → lead_states
```

- Los estados se gestionan desde un panel admin
- `LeadStatusHistory` ya tiene `estado_anterior` / `estado_nuevo` como STRING → migrar a FK
- Permite calcular tiempo promedio por etapa: `SELECT estado, AVG(tiempo_en_estado) FROM lead_status_history GROUP BY estado`
- El frontend consume los estados desde `/api/lead-states` en vez de constante hardcodeada

**Tareas:**
- [ ] Migración: tabla `lead_states` con campos nombre, orden, color, activo
- [ ] Migración: campo `estado_actual_id` en `leads` (o mantener STRING + agregar FK)
- [ ] API: GET/POST/PUT `/api/lead-states`
- [ ] UI: Panel admin para gestionar estados (sin tocar código)
- [ ] Frontend: cargar estados desde API en vez de `LEAD_STATES` hardcodeado
- [ ] Métricas: endpoint que calcule tiempo promedio en cada estado por lead

---

##### ⚠️ Pendientes UX / Features — detectados en testeo

- [x] **Leads — Mostrar campo "Fecha de firma de contrato" condicionalmente**: visible solo desde `Visita al salón realizada` en adelante. Implementado con `LEAD_STATES.indexOf()` en `LeadForm`.
- [x] **Servicios contratados — UI modular**: multiselect con Base (Salón/Catering) + Adicionales (Mesa dulce, Fotografía, etc.) con toggle en detalle de evento.
- [x] **Módulo de Pagos**: tabla `payments` + modelo + asociaciones + `GET/POST /api/payments` + `PUT /api/payments/:id` + UI inline en detalle de evento. Auto-recalcula `estado_pago` del evento.
- [ ] **Propuestas — Cargar documento adjunto**: además del campo de texto `contenido`, agregar subida de archivo (PDF/Word). Requiere Supabase Storage: crear bucket `proposals`, subir archivo, guardar URL en campo `documento_url` de la tabla `proposals`.
- [x] **Calendario — Múltiples entradas por día**: un día puede tener N entradas (visitas, bloqueos, etc.). UI muestra lista con Editar/Eliminar por entrada + "Agregar otra". Regla de negocio mantenida: solo un lead puede tener Reservada/Confirmada por día. DB: se eliminó la constraint UNIQUE en `calendar_dates.fecha`.
- [ ] **Tareas — Mejoras completas al módulo**: actualmente solo permite crear y ciclar estado. Falta:
  - Editar tarea (título, descripción, prioridad, fecha límite, lead asociado, usuario asignado)
  - Mover entre columnas Kanban (drag & drop o botones ← →)
  - Eliminar tarea con confirmación
  - Ver detalle expandido
  - Filtro por lead asociado
  - Badge de vencida si `due_date` < hoy y estado no es Hecho/Cancelado

---

- [ ] **Optimistic UI + Redux** — patrón optimistic con Redux global state para respuesta instantánea; si falla la petición, se revierte
- [ ] Sesiones server-side (JWT o NextAuth) — actualmente usa localStorage
- [ ] Panel admin para activar/desactivar usuarios registrados
- [ ] Pasar `user_id` real al cambiar estado de lead (actualmente pasa `null`)
- [ ] Migraciones de BD (actualmente usa `sequelize.sync({ alter: true })`)
- [ ] Validaciones server-side con Zod en las API routes
- [ ] Tests (unit + integration)
- [ ] Eliminar `lib/store.js` (ya no se usa, queda como referencia)

---

#### PRIORIDAD BAJA — Features avanzadas

##### ✅ 5. Módulo de Pagos (`payments`) — IMPLEMENTADO

- [x] Tabla `payments` en DB (event_id, lead_id, monto, tipo, metodo_pago, fecha_pago, estado, observacion, created_by_user_id)
- [x] Modelo Sequelize + asociaciones (Event.hasMany(Payment), Payment.belongsTo(Event/Lead))
- [x] `GET/POST /api/payments` + `PUT /api/payments/:id` (solo estado/observacion — monto inmutable)
- [x] UI inline en detalle de evento: historial, cobrado acumulado, saldo pendiente, Confirmar/Anular
- [x] Auto-recalcula `estado_pago` del evento al cambiar estado de cualquier pago

##### 6. Dashboard de Métricas (Business Intelligence)

Requiere módulo `payments` para métricas financieras completas:

- [ ] Métricas financieras: total facturado por mes, ingresos por `tipo_evento`, saldo pendiente de cobro, conversión reserva → evento confirmado
- [ ] Métricas de pipeline: tiempo promedio de cierre por etapa del `estado_comercial`
- [ ] Métricas de pérdidas: gráfico de motivos de pérdida (requiere `lost_reasons`)
- [ ] Métricas de comunicación: interacciones por canal, ratio IN/OUT (requiere mejoras en `interactions`)

##### Tabla `lost_reasons` (Reporting de pérdidas)

Hoy `motivo` en `lead_status_history` es texto libre. Para reporting real:

```sql
-- Nueva tabla
lost_reasons: id, name

-- Campo nuevo en lead_status_history
lost_reason_id UUID FK → lost_reasons
```

Opciones sugeridas: `Precio`, `Fecha no disponible`, `Eligió competencia`, `No respondió`, `Otro`

Habilita dashboard: "perdimos X leads por precio este trimestre".

- [ ] Migración tabla `lost_reasons`
- [ ] Campo `lost_reason_id` en `lead_status_history`
- [ ] UI para seleccionar motivo al marcar lead como `Perdido`
- [ ] Endpoint `/api/lost-reasons` (GET)

##### Timestamps en `tasks`

- [ ] Migración: agregar `updated_at` a tasks
- [ ] Migración: agregar `completed_at` a tasks (se registra automáticamente cuando `estado → Hecho`)
- [ ] UI: mostrar cuándo se completó una tarea

##### ✅ Mejoras en `interactions` (Canal + metadata)

- [x] Migración: campo `canal` (STRING: `WhatsApp`, `Email`, `Llamada`, `Presencial`)
- [x] Migración: campo `direction` (STRING: `IN` entrante / `OUT` saliente)
- [x] UI de interacciones: capturar canal y dirección al registrar
- [x] Display mejorado en cards + timeline con badge de dirección
- [ ] Migración: campo `external_id` (STRING, nullable) — para integración futura con WhatsApp API
- [ ] Filtros por canal en vista de interacciones

---

#### Todo está relacionado

```
Lead (estado_comercial + fechas clave)
  └── Visita salón → conversión
  └── Propuesta → precio + servicios
  └── Reserva → seña (payments)
       └── Evento → producción (menú, tarjetas, invitados)
            └── Pagos → saldo_pendiente → estado_pago
                 └── Dashboard BI → métricas financieras + pipeline
  └── Perdido → lost_reason_id → Dashboard: motivos de pérdida
  └── Interactions (canal + direction) → Dashboard: ratio respuesta
```

Si el CRM no refleja el contrato → el contrato queda aislado → se pierde control, trazabilidad, ventas, dinero y previsión.

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
- `lib/googleCalendar.js` usa ESM nativo (`import { google } from 'googleapis'` + `export async function`)
- **IMPORTANTE**: NO usar `require()` con try/catch para módulos propios en App Router — falla silenciosamente y usa fallbacks. Usar `import` de ESM
- Next.js resuelve el interop CJS↔ESM con webpack/turbopack automáticamente

### Manejo de Fechas
- PostgreSQL `DATE`/`DATEONLY` → Sequelize puede retornar Date objects o ISO strings ("2025-06-15T00:00:00.000Z")
- Los inputs HTML `type="date"` esperan "YYYY-MM-DD"
- LeadForm normaliza: `initial.fecha_tentativa.substring(0, 10)`
- Tasks normaliza: `task.due_date.substring(0, 10)` para display y comparación
- Events normaliza: `evt.fecha_confirmada.toString().substring(0, 10)` antes de crear Date
- Calendar usa fechas en formato "YYYY-MM-DD" consistentemente
- Google Calendar sync: `new Date(fecha).toISOString().substring(0, 10)` — funciona tanto con Date objects como con strings ISO
- **NUNCA** usar `.toString().substring(0, 10)` en Date objects de Sequelize (da "Thu Apr 25" en vez de "2026-04-25")

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
- `lib/googleCalendar.js` encapsula toda la interacción con Google Calendar API v3 (módulo ESM con `import`/`export`)
- `google.auth.JWT` usa constructor con objeto `{email, key, scopes}` (NO parámetros posicionales)
- Next.js `.env.local` convierte `\n` en double-quoted strings a newlines reales, por lo que la private key se parsea condicionalmente: `key.includes('\\n') ? key.replace(/\\n/g, '\n') : key`
- Todas las rutas importan con ESM: `import { createGoogleEvent } from '@/lib/googleCalendar'` (NO usar `require()` con try/catch)
- Fechas de Sequelize (Date objects) se normalizan con `new Date(fecha).toISOString().substring(0, 10)` para evitar "Invalid time value"
- `extendedProperties.private` usa `String()` para IDs (Google Calendar API requiere strings)
- Webhooks de Google expiran cada ~30 días, necesitan renovación via `POST /api/google-calendar/setup`
- Colores: Reservada=9(azul), Confirmada=10(verde), Bloqueada=5(amarillo)
- La respuesta de `POST /api/calendar` incluye `_googleSync` con el resultado del sync (debug)

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
