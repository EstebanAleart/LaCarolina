"use client"

import {
  BookOpen,
  Users,
  FileText,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const FLUJO = [
  { label: "Consulta inicial", color: "bg-slate-100 text-slate-700" },
  { label: "Propuesta enviada", color: "bg-orange-100 text-orange-700" },
  { label: "Negociacion", color: "bg-yellow-100 text-yellow-700" },
  { label: "Reserva tomada", color: "bg-blue-100 text-blue-700" },
  { label: "Evento confirmado", color: "bg-green-100 text-green-700" },
]

const CALENDAR_COLORS = [
  { color: "bg-emerald-400", label: "Disponible", desc: "Fecha libre" },
  { color: "bg-amber-400", label: "Bloqueada", desc: "Fecha bloqueada sin lead" },
  { color: "bg-blue-400", label: "Reservada", desc: "Reservada para un lead" },
  { color: "bg-green-500", label: "Confirmada", desc: "Evento confirmado" },
  { color: "bg-purple-400", label: "Tentativa", desc: "Lead con fecha tentativa" },
]

const SECTIONS = [
  {
    id: "acceso",
    icon: Users,
    title: "Acceso al Sistema",
    content: AccesoSection,
  },
  {
    id: "leads",
    icon: Users,
    title: "Leads (CRM)",
    content: LeadsSection,
  },
  {
    id: "propuestas",
    icon: FileText,
    title: "Propuestas",
    content: ProposalsSection,
  },
  {
    id: "calendario",
    icon: CalendarDays,
    title: "Calendario",
    content: CalendarSection,
  },
  {
    id: "eventos",
    icon: Sparkles,
    title: "Eventos",
    content: EventsSection,
  },
  {
    id: "tareas",
    icon: CheckSquare,
    title: "Tareas",
    content: TasksSection,
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    content: DashboardSection,
  },
  {
    id: "automatizaciones",
    icon: Sparkles,
    title: "Automatizaciones",
    content: AutoSection,
  },
]

function AccesoSection() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Registrar nuevo usuario</h4>
        <ol className="text-xs text-muted-foreground flex flex-col gap-1 list-decimal pl-4">
          <li>Click en &quot;Registrate aqui&quot; en la pantalla de login</li>
          <li>Completar nombre, email y password (minimo 6 caracteres)</li>
          <li>La cuenta queda <span className="font-medium text-amber-600">pendiente de aprobacion</span></li>
          <li>Un administrador debe activar la cuenta para que pueda ingresar</li>
        </ol>
      </div>
    </div>
  )
}

function LeadsSection() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Crear un Lead</h4>
        <ol className="text-xs text-muted-foreground flex flex-col gap-1 list-decimal pl-4">
          <li>Ir a <span className="font-medium text-foreground">CRM Leads</span> en el menu lateral</li>
          <li>Click en <span className="font-medium text-foreground">&quot;Nuevo Lead&quot;</span></li>
          <li>Completar: nombre (obligatorio), telefono, email, canal de origen, tipo de evento, fecha tentativa, valor estimado</li>
          <li>El lead se crea con estado <span className="font-medium">&quot;Consulta inicial&quot;</span></li>
        </ol>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Gestionar el Lead</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li><span className="font-medium text-foreground">Cambiar Estado:</span> Click en &quot;Cambiar Estado&quot; y seleccionar el nuevo. Si es &quot;Perdido&quot;, es obligatorio un motivo</li>
          <li><span className="font-medium text-foreground">Interacciones:</span> En la pestana &quot;Interacciones&quot;, registrar tipo (WhatsApp, Llamada, Email, Reunion) y descripcion</li>
          <li><span className="font-medium text-foreground">Timeline:</span> Historial completo del lead (cambios de estado, interacciones, propuestas)</li>
        </ul>
      </div>
    </div>
  )
}

function ProposalsSection() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Crear propuesta</h4>
        <ol className="text-xs text-muted-foreground flex flex-col gap-1 list-decimal pl-4">
          <li>Ir a <span className="font-medium text-foreground">Propuestas</span> en el menu lateral</li>
          <li>Click en <span className="font-medium text-foreground">&quot;Nueva Propuesta&quot;</span></li>
          <li>Seleccionar el lead, escribir contenido y precio total</li>
          <li>La propuesta se crea como <span className="font-medium">&quot;Borrador&quot;</span></li>
        </ol>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Ciclo de la propuesta</h4>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-1 font-medium">Borrador</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded-md bg-blue-100 text-blue-700 px-2 py-1 font-medium">Enviada</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded-md bg-green-100 text-green-700 px-2 py-1 font-medium">Aceptada</span>
          <span className="text-muted-foreground">o</span>
          <span className="rounded-md bg-red-100 text-red-700 px-2 py-1 font-medium">Rechazada</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Las propuestas se crean y actualizan automaticamente:
        </p>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4 mt-1">
          <li>Al cambiar el lead a &quot;Propuesta enviada&quot;, &quot;Esperando respuesta&quot;, &quot;Visita agendada&quot;, &quot;En negociacion&quot; o &quot;Reserva tomada&quot; → se crea propuesta si no existe</li>
          <li>Al reservar/confirmar fecha desde el calendario → propuesta pasa a &quot;Aceptada&quot; (o se crea como Aceptada)</li>
          <li>Lead → &quot;Perdido&quot; → propuesta pasa a &quot;Rechazada&quot;</li>
          <li>Al editar el valor estimado del lead → se actualiza el precio de la propuesta</li>
        </ul>
      </div>
    </div>
  )
}

function CalendarSection() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2">Estados de fecha</h4>
        <div className="flex flex-wrap gap-2">
          {CALENDAR_COLORS.map((c) => (
            <div key={c.label} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
              <div className={cn("h-3 w-3 rounded-full", c.color)} />
              <div>
                <p className="text-xs font-medium text-foreground">{c.label}</p>
                <p className="text-[10px] text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Reservar una fecha</h4>
        <ol className="text-xs text-muted-foreground flex flex-col gap-1 list-decimal pl-4">
          <li>Click en el dia en el calendario</li>
          <li>Si hay leads con fecha tentativa, aparecen en violeta. Click para seleccionar uno</li>
          <li>Elegir estado <span className="font-medium text-foreground">&quot;Reservada&quot;</span></li>
          <li>Click <span className="font-medium text-foreground">&quot;Guardar&quot;</span></li>
        </ol>
        <p className="text-xs text-muted-foreground mt-2">Al reservar con un lead: el lead pasa a &quot;Reserva tomada&quot;, se limpia la fecha tentativa, se crea una Reservation, se crea propuesta y se sincroniza con Google Calendar.</p>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Confirmar una fecha</h4>
        <ol className="text-xs text-muted-foreground flex flex-col gap-1 list-decimal pl-4">
          <li>Click en el dia que ya esta Reservada</li>
          <li>Cambiar estado a <span className="font-medium text-foreground">&quot;Confirmada&quot;</span></li>
          <li>Click <span className="font-medium text-foreground">&quot;Guardar&quot;</span></li>
        </ol>
        <p className="text-xs text-muted-foreground mt-2">Al confirmar: el lead pasa a &quot;Evento confirmado&quot;, se crea un Event, aparece en la vista de Eventos y se sincroniza con Google Calendar.</p>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Google Calendar</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li>Las fechas <span className="font-medium text-foreground">Reservadas</span> y <span className="font-medium text-foreground">Confirmadas</span> se sincronizan automaticamente con Google Calendar</li>
          <li>Al liberar/eliminar una fecha, se elimina tambien de Google Calendar</li>
          <li>Los colores en Google Calendar son: Reservada (azul), Confirmada (verde), Bloqueada (amarillo)</li>
          <li>Los eventos muestran el nombre del lead y tipo de evento como titulo</li>
        </ul>
      </div>
    </div>
  )
}

function EventsSection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">Los eventos se crean automaticamente al confirmar una fecha con un lead en el calendario. Se muestran en la vista <span className="font-medium text-foreground">Eventos</span>.</p>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2">Estado operativo</h4>
        <div className="flex flex-wrap gap-2">
          {["Pendiente", "En preparacion", "Listo", "Realizado"].map((s) => (
            <span key={s} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", {
              "bg-amber-100 text-amber-800": s === "Pendiente",
              "bg-blue-100 text-blue-800": s === "En preparacion",
              "bg-emerald-100 text-emerald-800": s === "Listo",
              "bg-green-100 text-green-800": s === "Realizado",
            })}>{s}</span>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Desde el detalle expandido se puede cambiar el estado operativo, editar tipo de evento e invitados, y ver datos de contacto del lead.</p>
    </div>
  )
}

function TasksSection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">Vista <span className="font-medium text-foreground">Kanban</span> con 4 columnas: Pendiente, En Proceso, Hecho, Cancelado.</p>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Crear tarea</h4>
        <ol className="text-xs text-muted-foreground flex flex-col gap-1 list-decimal pl-4">
          <li>Click en <span className="font-medium text-foreground">&quot;Nueva Tarea&quot;</span></li>
          <li>Completar: titulo (obligatorio), descripcion, lead asociado, asignar a usuario, prioridad, fecha limite</li>
        </ol>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Cambiar estado</h4>
        <p className="text-xs text-muted-foreground">Click en el icono circular de la tarea para rotar: Pendiente → En Proceso → Hecho → Pendiente</p>
      </div>
      <p className="text-xs text-muted-foreground">Cuando un lead pasa a &quot;Propuesta enviada&quot;, se crea automaticamente una tarea de seguimiento con prioridad Alta y vencimiento en 3 dias.</p>
    </div>
  )
}

function DashboardSection() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Muestra metricas generales del sistema:</p>
      <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
        <li>Total de leads por estado (pipeline)</li>
        <li>Leads por canal de origen</li>
        <li>Tareas vencidas</li>
        <li>Eventos proximos</li>
        <li>Graficos de barras y torta</li>
      </ul>
    </div>
  )
}

function AutoSection() {
  const AUTOS = [
    { accion: "Reservar fecha con lead en calendario", resultado: "Lead → \"Reserva tomada\" + crea Reservation + crea/actualiza propuesta → \"Aceptada\" + sync Google Calendar" },
    { accion: "Confirmar fecha con lead en calendario", resultado: "Lead → \"Evento confirmado\" + crea Event + crea/actualiza propuesta → \"Aceptada\" + sync Google Calendar" },
    { accion: "Cambiar lead a \"Propuesta enviada\"", resultado: "Se crea tarea de seguimiento (Alta, 3 dias) + crea propuesta \"Enviada\" si no existe" },
    { accion: "Cambiar lead a \"Esperando respuesta\" / \"Visita agendada\"", resultado: "Crea propuesta \"Enviada\" si no existe" },
    { accion: "Cambiar lead a \"En negociacion\"", resultado: "Crea propuesta \"En negociacion\" si no existe" },
    { accion: "Cambiar lead a \"Reserva tomada\" / \"Evento confirmado\"", resultado: "Ultima propuesta → \"Aceptada\" (o crea como Aceptada)" },
    { accion: "Cambiar lead a \"Perdido\"", resultado: "Ultima propuesta → \"Rechazada\"" },
    { accion: "Enviar propuesta (Borrador → Enviada)", resultado: "Se registra fecha de envio" },
    { accion: "Editar valor estimado del lead", resultado: "Se actualiza precio_total de la ultima propuesta" },
    { accion: "Eliminar un lead", resultado: "Se eliminan todas las entidades asociadas (interacciones, propuestas, tareas, eventos, fechas calendario + Google Calendar)" },
    { accion: "Liberar/eliminar fecha del calendario", resultado: "Confirmacion con toast antes de eliminar + elimina de Google Calendar si estaba sincronizada" },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border border-border rounded-md">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Accion del usuario</th>
            <th className="text-left px-3 py-2 font-medium">Que pasa automaticamente</th>
          </tr>
        </thead>
        <tbody>
          {AUTOS.map((a, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-2">{a.accion}</td>
              <td className="px-3 py-2 text-muted-foreground">{a.resultado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CollapsibleSection({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-bold text-card-foreground flex-1">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-4">
          {children}
        </div>
      )}
    </div>
  )
}

export default function GuideView() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Guia de Usuario</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Sistema de gestion para salones de eventos. Desde el primer contacto hasta el evento realizado.</p>
      </div>

      {/* Flujo principal */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-3">FLUJO PRINCIPAL</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FLUJO.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1.5">
              <span className={cn("rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap", step.color)}>{step.label}</span>
              {i < FLUJO.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {SECTIONS.map((section) => {
          const Content = section.content
          return (
            <CollapsibleSection
              key={section.id}
              icon={section.icon}
              title={section.title}
              defaultOpen={section.id === "acceso"}
            >
              <Content />
            </CollapsibleSection>
          )
        })}
      </div>

      {/* Tipos de evento */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">TIPOS DE EVENTO</h3>
        <div className="flex flex-wrap gap-1.5">
          {["Fiesta de 15", "Egresados", "Casamiento", "Evento Corporativo", "Otro"].map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{t}</span>
          ))}
        </div>
      </div>

      {/* Notificaciones */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">NOTIFICACIONES</h3>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1.5 align-middle" /> <span className="font-medium text-foreground">Verde:</span> Operacion exitosa</p>
          <p><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1.5 align-middle" /> <span className="font-medium text-foreground">Rojo:</span> Error</p>
          <p><span className="inline-block w-3 h-3 rounded-full bg-amber-400 mr-1.5 align-middle" /> <span className="font-medium text-foreground">Amarillo:</span> Advertencia o validacion</p>
        </div>
      </div>
    </div>
  )
}
