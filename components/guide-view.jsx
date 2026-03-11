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
  CreditCard,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const FLUJO = [
  { label: "Lead nuevo", color: "bg-slate-100 text-slate-700" },
  { label: "Contactado", color: "bg-sky-100 text-sky-700" },
  { label: "Esperando visita", color: "bg-cyan-100 text-cyan-700" },
  { label: "Visita al salón realizada", color: "bg-violet-100 text-violet-700" },
  { label: "Enviar propuesta", color: "bg-yellow-100 text-yellow-700" },
  { label: "Propuesta enviada", color: "bg-orange-100 text-orange-700" },
  { label: "Propuesta Aceptada", color: "bg-lime-100 text-lime-700" },
  { label: "Esperando Reserva", color: "bg-blue-100 text-blue-700" },
  { label: "Reserva tomada", color: "bg-indigo-100 text-indigo-700" },
  { label: "Contrato firmado", color: "bg-emerald-100 text-emerald-700" },
  { label: "Cliente activo", color: "bg-green-100 text-green-700" },
  { label: "Evento realizado", color: "bg-teal-100 text-teal-700" },
  { label: "Post-evento / cerrado", color: "bg-gray-100 text-gray-700" },
  { label: "Perdido", color: "bg-red-100 text-red-700" },
]

const CALENDAR_COLORS = [
  { color: "bg-emerald-400", label: "Disponible", desc: "Fecha libre" },
  { color: "bg-amber-400", label: "Bloqueada", desc: "Fecha bloqueada sin lead" },
  { color: "bg-blue-400", label: "Reservada", desc: "Reservada para un lead" },
  { color: "bg-green-500", label: "Confirmada", desc: "Evento confirmado (contrato firmado)" },
  { color: "bg-orange-400", label: "Visita", desc: "Visita al salón agendada" },
  { color: "bg-purple-400", label: "Tentativa", desc: "Lead con fecha tentativa (solo visual)" },
]

const SECTIONS = [
  { id: "acceso", icon: Users, title: "Acceso al Sistema", content: AccesoSection },
  { id: "leads", icon: Users, title: "Leads (CRM)", content: LeadsSection },
  { id: "contratos", icon: FileText, title: "Contratos", content: ContratosSection },
  { id: "calendario", icon: CalendarDays, title: "Calendario", content: CalendarSection },
  { id: "eventos", icon: Sparkles, title: "Eventos", content: EventsSection },
  { id: "pagos", icon: CreditCard, title: "Pagos", content: PagosSection },
  { id: "tareas", icon: CheckSquare, title: "Tareas", content: TasksSection },
  { id: "dashboard", icon: LayoutDashboard, title: "Dashboard", content: DashboardSection },
  { id: "automatizaciones", icon: Sparkles, title: "Automatizaciones", content: AutoSection },
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
          <li><span className="font-medium text-foreground">Contacto:</span> nombre (obligatorio), telefono, email, canal, tipo de cliente, tipo de evento</li>
          <li><span className="font-medium text-foreground">Primera instancia:</span> fecha del evento (tentativa), fecha visita al salon, valor estimado, cantidad de invitados</li>
          <li>El lead se crea con estado <span className="font-medium">&quot;Lead nuevo&quot;</span></li>
        </ol>
        <p className="text-xs text-muted-foreground mt-2">Si se carga la <span className="font-medium text-foreground">fecha visita al salon</span>, el estado pasa a &quot;Esperando visita&quot; y aparece como marcador naranja en el calendario.</p>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Gestionar el Lead</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li><span className="font-medium text-foreground">Cambiar Estado:</span> Click en &quot;Cambiar Estado&quot;. Si es &quot;Perdido&quot; requiere motivo obligatorio</li>
          <li><span className="font-medium text-foreground">Segunda instancia (al editar):</span> fecha firma contrato, fecha limite pago (auto-calculada = fecha evento - 30 dias)</li>
          <li><span className="font-medium text-foreground">Interacciones:</span> registrar canal (WhatsApp/Llamada/Email/Presencial) y direccion (→ Saliente / ← Entrante). La primera interaccion saliente desde &quot;Lead nuevo&quot; cambia automaticamente a &quot;Contactado&quot;</li>
          <li><span className="font-medium text-foreground">Timeline:</span> historial completo (estados, interacciones con canal/direccion, contratos, visitas)</li>
        </ul>
      </div>
    </div>
  )
}

function ContratosSection() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Ciclo del contrato</h4>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-1 font-medium">Creada</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded-md bg-blue-100 text-blue-700 px-2 py-1 font-medium">Enviada</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded-md bg-green-100 text-green-700 px-2 py-1 font-medium">Aprobada</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-1 font-medium">Firmada</span>
          <span className="text-muted-foreground">o</span>
          <span className="rounded-md bg-red-100 text-red-700 px-2 py-1 font-medium">Rechazada</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Solo el estado <span className="font-medium text-foreground">Firmada</span> sincroniza todos los datos del contrato al Evento (precio, invitados, servicios, adicionales). Los contratos firmados son <span className="font-medium text-foreground">inmutables</span> — no se pueden editar, solo imprimir.</p>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Campos del contrato</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li><span className="font-medium text-foreground">Precio senia:</span> monto de reserva/adelanto</li>
          <li><span className="font-medium text-foreground">Valor total del evento:</span> precio final acordado</li>
          <li><span className="font-medium text-foreground">Modalidad de actualizacion de precios:</span> fija, por inflacion, etc.</li>
          <li><span className="font-medium text-foreground">Servicios base:</span> Salon, Catering, etc. (checkboxes incluidos/no incluidos)</li>
          <li><span className="font-medium text-foreground">Adicionales:</span> items con opciones y precio (Mesa dulce, Fotografia, DJ, etc.)</li>
          <li><span className="font-medium text-foreground">Produccion:</span> menu seleccionado, minimo de tarjetas, valor por tipo (adulto/adolescente/nino)</li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Efectos al firmar</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li>Lead pasa a <span className="font-medium text-foreground">&quot;Contrato firmado&quot;</span></li>
          <li>Se crea o actualiza el Evento con todos los datos del contrato</li>
          <li>Si hay fecha tentativa, la entrada del calendario pasa a <span className="font-medium text-foreground">&quot;Confirmada&quot;</span></li>
          <li>Se registra automaticamente la fecha de firma</li>
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
        <h4 className="text-sm font-bold text-foreground mb-1">Multiples entradas por dia</h4>
        <p className="text-xs text-muted-foreground">Un mismo dia puede tener varias entradas (por ejemplo, una visita y una reserva de leads distintos). Cada entrada tiene su propio boton Editar/Eliminar. Se puede agregar una nueva entrada con &quot;Agregar otra&quot;. Solo se permite una entrada Reservada o Confirmada por lead por dia.</p>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Reservar una fecha</h4>
        <ol className="text-xs text-muted-foreground flex flex-col gap-1 list-decimal pl-4">
          <li>Click en el dia en el calendario</li>
          <li>Si hay leads con fecha tentativa (violeta), click para seleccionar uno</li>
          <li>Elegir estado <span className="font-medium text-foreground">&quot;Reservada&quot;</span></li>
          <li>Click <span className="font-medium text-foreground">&quot;Guardar&quot;</span></li>
        </ol>
        <p className="text-xs text-muted-foreground mt-2">Al reservar: lead → &quot;Reserva tomada&quot;, se crea Reservation, sync Google Calendar.</p>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Confirmar desde el calendario</h4>
        <p className="text-xs text-muted-foreground">Cambiar fecha a &quot;Confirmada&quot; → lead → &quot;Contrato firmado&quot;, se crea Event, aparece en Eventos, sync Google Calendar.</p>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Navegacion</h4>
        <p className="text-xs text-muted-foreground">El selector de año cubre desde <span className="font-medium text-foreground">10 anos atras</span> hasta 6 anos adelante, para poder cargar o consultar eventos historicos.</p>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Google Calendar</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li>Fechas <span className="font-medium text-foreground">Reservadas</span> y <span className="font-medium text-foreground">Confirmadas</span> se sincronizan automaticamente</li>
          <li>Al liberar una fecha, se elimina de Google Calendar</li>
          <li>Colores en GCal: Reservada (azul), Confirmada (verde), Bloqueada (amarillo)</li>
        </ul>
      </div>
    </div>
  )
}

function EventsSection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">Los eventos se crean automaticamente al <span className="font-medium text-foreground">firmar un contrato</span> o al <span className="font-medium text-foreground">confirmar una fecha en el calendario</span>. Se muestran en la vista Eventos.</p>
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
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Informacion del evento (expandido)</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li><span className="font-medium text-foreground">Finanzas:</span> valor total, precio senia, estado de pago (Pendiente/Parcial/Completo), modalidad de precios, saldo pendiente calculado en tiempo real</li>
          <li><span className="font-medium text-foreground">Invitados:</span> cantidad copiada automaticamente desde el contrato al confirmar</li>
          <li><span className="font-medium text-foreground">Servicios:</span> checkboxes de servicios base y adicionales — click para marcar/desmarcar, guarda al instante</li>
          <li><span className="font-medium text-foreground">Produccion:</span> menu seleccionado, minimo de tarjetas, valores por tarjeta adulto/adolescente/nino</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">Todos los campos se guardan con <span className="font-medium text-foreground">blur</span> (al salir del campo) o con click en el caso de servicios y estado.</p>
      </div>
    </div>
  )
}

function PagosSection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">Cada evento tiene un historial de pagos inline. Permite registrar cobros parciales y lleva el control del saldo pendiente automaticamente.</p>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Registrar un pago</h4>
        <ol className="text-xs text-muted-foreground flex flex-col gap-1 list-decimal pl-4">
          <li>Abrir el detalle del evento (click en la fila)</li>
          <li>En la seccion &quot;Pagos&quot;, click en <span className="font-medium text-foreground">&quot;Registrar Pago&quot;</span></li>
          <li>Completar: monto, descripcion (opcional)</li>
          <li>El saldo pendiente y el estado de pago se actualizan automaticamente</li>
        </ol>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Estados de pago del evento</h4>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
            { label: "Parcial", color: "bg-blue-100 text-blue-800" },
            { label: "Completo", color: "bg-green-100 text-green-800" },
          ].map((s) => (
            <span key={s.label} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", s.color)}>{s.label}</span>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Reglas</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li>Los pagos registrados son <span className="font-medium text-foreground">inmutables</span> — solo se puede cambiar el estado (Confirmado/Anulado) y la observacion</li>
          <li>Anular un pago recalcula automaticamente el saldo pendiente y el estado del evento</li>
          <li>El cobrado acumulado y el saldo pendiente se muestran en tiempo real en el detalle</li>
        </ul>
      </div>
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
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">Tareas automaticas</h4>
        <ul className="text-xs text-muted-foreground flex flex-col gap-1 list-disc pl-4">
          <li>Lead → &quot;Enviar propuesta&quot; → tarea de prioridad Alta con vencimiento en 1 dia</li>
          <li>Lead → &quot;Propuesta enviada&quot; → tarea de seguimiento con prioridad Alta y vencimiento en 3 dias</li>
        </ul>
      </div>
    </div>
  )
}

function DashboardSection() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Metricas generales del sistema:</p>
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
    { accion: "Primera interaccion saliente desde \"Lead nuevo\"", resultado: "Lead → \"Contactado\" automaticamente" },
    { accion: "Guardar fecha visita al salon en lead", resultado: "Lead → \"Esperando visita\" + CalendarDate \"Visita\" (naranja) creada/actualizada" },
    { accion: "Lead → \"Enviar propuesta\"", resultado: "Crea tarea Alta con vencimiento en 1 dia" },
    { accion: "Lead → \"Propuesta enviada\"", resultado: "Crea tarea de seguimiento Alta con vencimiento en 3 dias" },
    { accion: "Contrato → \"Enviada\"", resultado: "Lead → \"Propuesta enviada\"" },
    { accion: "Contrato → \"Aprobada\"", resultado: "Lead → \"Propuesta Aceptada\"" },
    { accion: "Contrato → \"Rechazada\"", resultado: "Lead → \"Propuesta Rechazada\"" },
    { accion: "Contrato → \"Firmada\"", resultado: "Lead → \"Contrato firmado\" + sync todos los datos al Evento + CalendarDate → \"Confirmada\" (si hay fecha tentativa) + registra fecha de firma" },
    { accion: "Reservar fecha con lead en calendario", resultado: "Lead → \"Reserva tomada\" + crea Reservation + sync Google Calendar" },
    { accion: "Confirmar fecha con lead en calendario", resultado: "Lead → \"Contrato firmado\" + crea Event + sync Google Calendar" },
    { accion: "Lead → \"Contrato firmado\" (manual)", resultado: "Crea Event si hay fecha tentativa + CalendarDate → \"Confirmada\"" },
    { accion: "Editar valor estimado del lead", resultado: "precio_senia de la ultima propuesta se actualiza automaticamente" },
    { accion: "Editar invitados estimados del lead", resultado: "Se copia al Evento al confirmarlo" },
    { accion: "Guardar fecha tentativa del lead", resultado: "fecha_limite_pago_total = fecha_tentativa - 30 dias (auto-calculada)" },
    { accion: "Anular un pago", resultado: "Recalcula saldo pendiente y estado de pago del evento (Pendiente/Parcial/Completo)" },
    { accion: "Liberar fecha del calendario", resultado: "Elimina de Google Calendar si estaba sincronizada + libera reservas del lead" },
    { accion: "Eliminar un lead", resultado: "Cascade: interacciones, contratos, tareas, eventos, fechas calendario + Google Calendar" },
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
