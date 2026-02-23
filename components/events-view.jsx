"use client"

import { useState, useMemo, useEffect } from "react"
import {
  CalendarCheck,
  Users,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  DollarSign,
  UtensilsCrossed,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  fetchEvents,
  apiUpdateEvent,
  TIPOS_EVENTO,
  ESTADOS_PAGO,
  MODALIDADES_PRECIO,
  SERVICIOS_BASE,
  SERVICIOS_ADICIONALES,
} from "@/lib/api"

const ESTADO_OPERATIVO_OPTIONS = ["Pendiente", "En preparacion", "Listo", "Realizado"]

const ESTADO_OP_COLORS = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En preparacion": "bg-blue-100 text-blue-800",
  Listo: "bg-emerald-100 text-emerald-800",
  Realizado: "bg-green-100 text-green-800",
}

const ESTADO_PAGO_COLORS = {
  Pendiente: "bg-red-100 text-red-800",
  Parcial: "bg-yellow-100 text-yellow-800",
  Completo: "bg-green-100 text-green-800",
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
    if (!filterEstado) return events
    return events.filter((e) => e.estado_operativo === filterEstado)
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
      toast.success("Guardado")
    } catch (err) { console.error(err); toast.error("Error al guardar") }
  }

  async function handleToggleServicio(evt, servicio) {
    const current = evt.servicios_contratados || []
    const updated = current.includes(servicio)
      ? current.filter((s) => s !== servicio)
      : [...current, servicio]
    try {
      await apiUpdateEvent(evt.id, { servicios_contratados: updated })
      await loadData()
    } catch (err) { console.error(err); toast.error("Error al actualizar servicios") }
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
          <p className="text-sm text-muted-foreground">Eventos confirmados, producción y finanzas</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} evento{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Filtro */}
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

      {/* Empty */}
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
          const fechaRaw = evt.fecha_confirmada ? evt.fecha_confirmada.toString().substring(0, 10) : null
          const fecha = fechaRaw
            ? new Date(fechaRaw + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
            : "Sin fecha"
          const servicios = evt.servicios_contratados || []

          // Saldo pendiente: valor_total - monto_pagado de la reserva
          const montoPagado = evt.lead?.reservation?.monto_pagado ?? null
          const saldoPendiente = (evt.valor_total_evento != null && montoPagado != null)
            ? evt.valor_total_evento - montoPagado
            : null

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
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", ESTADO_OP_COLORS[evt.estado_operativo])}>
                      {evt.estado_operativo}
                    </span>
                    {evt.estado_pago && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", ESTADO_PAGO_COLORS[evt.estado_pago] || "bg-gray-100 text-gray-700")}>
                        Pago: {evt.estado_pago}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="h-3 w-3" /> {fecha}
                    </span>
                    <span>{leadTipo}</span>
                    {evt.invitados_estimados > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {evt.invitados_estimados} inv.
                      </span>
                    )}
                    {evt.valor_total_evento && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> ${evt.valor_total_evento.toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-4 flex flex-col gap-5">

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

                  {/* Info general */}
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

                  {/* Bloque financiero (C) */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Finanzas
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Valor total evento ($)</label>
                        <input
                          type="number"
                          defaultValue={evt.valor_total_evento || ""}
                          onBlur={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null
                            if (val !== evt.valor_total_evento) handleUpdateField(evt.id, "valor_total_evento", val)
                          }}
                          placeholder="0"
                          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Estado de pago</label>
                        <select
                          value={evt.estado_pago || "Pendiente"}
                          onChange={(e) => handleUpdateField(evt.id, "estado_pago", e.target.value)}
                          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ESTADOS_PAGO.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Modalidad de precios</label>
                        <select
                          value={evt.modalidad_actualizacion_precios || "Precio fijo"}
                          onChange={(e) => handleUpdateField(evt.id, "modalidad_actualizacion_precios", e.target.value)}
                          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {MODALIDADES_PRECIO.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      {saldoPendiente !== null && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-foreground">Saldo pendiente</label>
                          <div className={cn(
                            "rounded-md px-3 py-2 text-sm font-medium",
                            saldoPendiente <= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          )}>
                            ${saldoPendiente.toLocaleString("es-AR")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Servicios contratados (D) */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                      <ClipboardList className="h-3 w-3" /> Servicios Contratados
                    </p>
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Base</p>
                      <div className="flex flex-wrap gap-2">
                        {SERVICIOS_BASE.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleToggleServicio(evt, s)}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                              servicios.includes(s)
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-card text-foreground hover:bg-secondary"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-1">Adicionales</p>
                      <div className="flex flex-wrap gap-2">
                        {SERVICIOS_ADICIONALES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleToggleServicio(evt, s)}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                              servicios.includes(s)
                                ? "bg-secondary text-secondary-foreground border border-primary/30"
                                : "border border-border bg-card text-foreground hover:bg-secondary"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Producción / menú (E) */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                      <UtensilsCrossed className="h-3 w-3" /> Producción
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-xs font-medium text-foreground">Menú seleccionado</label>
                        <input
                          type="text"
                          defaultValue={evt.menu_seleccionado || ""}
                          onBlur={(e) => {
                            if (e.target.value !== (evt.menu_seleccionado || "")) handleUpdateField(evt.id, "menu_seleccionado", e.target.value)
                          }}
                          placeholder="Ej: Menú A - 3 pasos + barra libre"
                          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Mínimo de tarjetas</label>
                        <input
                          type="number"
                          defaultValue={evt.minimo_tarjetas || ""}
                          onBlur={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null
                            if (val !== evt.minimo_tarjetas) handleUpdateField(evt.id, "minimo_tarjetas", val)
                          }}
                          placeholder="0"
                          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Valor tarjeta adulto ($)</label>
                        <input
                          type="number"
                          defaultValue={evt.valor_tarjeta_adulto || ""}
                          onBlur={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null
                            if (val !== evt.valor_tarjeta_adulto) handleUpdateField(evt.id, "valor_tarjeta_adulto", val)
                          }}
                          placeholder="0"
                          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Valor tarjeta adolescente ($)</label>
                        <input
                          type="number"
                          defaultValue={evt.valor_tarjeta_adolescente || ""}
                          onBlur={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null
                            if (val !== evt.valor_tarjeta_adolescente) handleUpdateField(evt.id, "valor_tarjeta_adolescente", val)
                          }}
                          placeholder="0"
                          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Valor tarjeta niño ($)</label>
                        <input
                          type="number"
                          defaultValue={evt.valor_tarjeta_nino || ""}
                          onBlur={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null
                            if (val !== evt.valor_tarjeta_nino) handleUpdateField(evt.id, "valor_tarjeta_nino", val)
                          }}
                          placeholder="0"
                          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lead info */}
                  {evt.lead && (
                    <div className="rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                      <p><span className="font-medium text-card-foreground">Lead:</span> {evt.lead.nombre}</p>
                      {evt.lead.telefono && <p><span className="font-medium text-card-foreground">Tel:</span> {evt.lead.telefono}</p>}
                      {evt.lead.email && <p><span className="font-medium text-card-foreground">Email:</span> {evt.lead.email}</p>}
                      {evt.lead.fecha_limite_pago_total && (
                        <p><span className="font-medium text-card-foreground">Límite pago:</span> {evt.lead.fecha_limite_pago_total.toString().substring(0, 10)}</p>
                      )}
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
