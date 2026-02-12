"use client"

import { useState, useMemo, useEffect } from "react"
import {
  CalendarCheck,
  Users,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  fetchEvents,
  apiUpdateEvent,
  TIPOS_EVENTO,
} from "@/lib/api"

const ESTADO_OPERATIVO_OPTIONS = ["Pendiente", "En preparacion", "Listo", "Realizado"]

const ESTADO_COLORS = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En preparacion": "bg-blue-100 text-blue-800",
  Listo: "bg-emerald-100 text-emerald-800",
  Realizado: "bg-green-100 text-green-800",
}

export default function EventsView() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEstado, setFilterEstado] = useState("")
  const [expandedId, setExpandedId] = useState(null)

  async function loadData() {
    try {
      const data = await fetchEvents()
      setEvents(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    let result = events
    if (filterEstado) result = result.filter((e) => e.estado_operativo === filterEstado)
    return result
  }, [events, filterEstado])

  async function handleUpdateEstado(id, nuevoEstado) {
    try {
      await apiUpdateEvent(id, { estado_operativo: nuevoEstado })
      await loadData()
      toast.success(`Estado operativo: ${nuevoEstado}`)
    } catch (err) { console.error(err); toast.error("Error al actualizar evento") }
  }

  async function handleUpdateField(id, field, value) {
    try {
      await apiUpdateEvent(id, { [field]: value })
      await loadData()
      toast.success("Evento actualizado")
    } catch (err) { console.error(err); toast.error("Error al actualizar") }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando eventos...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
          <p className="text-sm text-muted-foreground">Eventos confirmados y su estado operativo</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} evento{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los estados</option>
          {ESTADO_OPERATIVO_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Events list */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CalendarCheck className="h-12 w-12 mb-2 opacity-30" />
          <p className="text-sm">No hay eventos</p>
          <p className="text-xs mt-1">Los eventos se crean al confirmar una fecha con un lead en el calendario</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((evt) => {
          const isExpanded = expandedId === evt.id
          const leadName = evt.lead?.nombre || "Sin lead"
          const leadTipo = evt.lead?.tipo_evento || evt.tipo_evento || "---"
          const fecha = evt.fecha_confirmada ? new Date(evt.fecha_confirmada + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Sin fecha"
          const servicios = evt.servicios_contratados || []

          return (
            <div key={evt.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-card-foreground">{leadName}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", ESTADO_COLORS[evt.estado_operativo])}>
                      {evt.estado_operativo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="h-3 w-3" /> {fecha}
                    </span>
                    <span>{leadTipo}</span>
                    {evt.invitados_estimados > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {evt.invitados_estimados} invitados
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
                  {/* Estado operativo */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground">Estado Operativo</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ESTADO_OPERATIVO_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleUpdateEstado(evt.id, s)}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                            evt.estado_operativo === s
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-card text-foreground hover:bg-secondary"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-foreground">Tipo de Evento</label>
                      <select
                        value={evt.tipo_evento || ""}
                        onChange={(e) => handleUpdateField(evt.id, "tipo_evento", e.target.value)}
                        className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-foreground">Invitados Estimados</label>
                      <input
                        type="number"
                        defaultValue={evt.invitados_estimados || 0}
                        onBlur={(e) => {
                          const val = Number(e.target.value)
                          if (val !== evt.invitados_estimados) handleUpdateField(evt.id, "invitados_estimados", val)
                        }}
                        className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Servicios */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <ClipboardList className="h-3 w-3" /> Servicios Contratados
                    </label>
                    {servicios.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {servicios.map((s, i) => (
                          <span key={i} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin servicios registrados</p>
                    )}
                  </div>

                  {/* Lead info */}
                  {evt.lead && (
                    <div className="rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                      <p><span className="font-medium text-card-foreground">Lead:</span> {evt.lead.nombre}</p>
                      {evt.lead.telefono && <p><span className="font-medium text-card-foreground">Tel:</span> {evt.lead.telefono}</p>}
                      {evt.lead.email && <p><span className="font-medium text-card-foreground">Email:</span> {evt.lead.email}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
