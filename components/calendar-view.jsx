"use client"

import { useState, useMemo, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  fetchCalendarDates,
  apiSetCalendarDate,
  apiRemoveCalendarDate,
  fetchLeads,
  CALENDAR_STATES,
} from "@/lib/api"

const STATE_COLORS = {
  Disponible: "bg-emerald-200 text-emerald-900",
  Bloqueada: "bg-amber-200 text-amber-900",
  Reservada: "bg-blue-200 text-blue-900",
  Confirmada: "bg-green-300 text-green-900",
  Tentativa: "bg-purple-200 text-purple-900",
  Visita: "bg-orange-200 text-orange-900",
}

const STATE_DOT_COLORS = {
  Disponible: "bg-emerald-500",
  Bloqueada: "bg-amber-500",
  Reservada: "bg-blue-500",
  Confirmada: "bg-green-600",
  Tentativa: "bg-purple-500",
  Visita: "bg-orange-500",
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday-first
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

export default function CalendarView() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [calendarDatesRaw, setCalendarDatesRaw] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const [dates, lds] = await Promise.all([
        fetchCalendarDates(),
        fetchLeads()
      ])
      setCalendarDatesRaw(dates)
      setLeads(lds)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const calendarDates = useMemo(() => {
    const map = {}
    calendarDatesRaw.forEach((d) => (map[d.fecha ? d.fecha.substring(0, 10) : ""] = d))
    return map
  }, [calendarDatesRaw])

  // Mapa de fechas tentativas de leads (solo las que NO tienen ya una CalendarDate)
  const tentativeMap = useMemo(() => {
    const map = {}
    leads.forEach((l) => {
      if (l.fecha_tentativa) {
        const dateStr = l.fecha_tentativa.substring(0, 10)
        if (!map[dateStr]) map[dateStr] = []
        map[dateStr].push(l)
      }
    })
    return map
  }, [leads])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function formatDate(day) {
    const m = String(currentMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    return `${currentYear}-${m}-${d}`
  }

  function handleDayClick(day) {
    const dateStr = formatDate(day)
    setSelectedDate(dateStr)
    setShowForm(true)
  }

  const cells = []
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={"empty-" + i} className="h-24 border border-border/50" />)
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(day)
    const calEntry = calendarDates[dateStr]
    const tentativeLeads = tentativeMap[dateStr] || []
    // Solo mostrar tentativas que no tengan ya un CalendarDate con lead asociado
    const filteredTentative = tentativeLeads.filter(
      (l) => !calEntry || calEntry.lead_id !== l.id
    )
    const isToday =
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()

    cells.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={cn(
          "h-24 flex flex-col items-start p-1.5 border border-border/50 text-left transition-colors hover:bg-muted/50",
          isToday && "ring-2 ring-primary ring-inset"
        )}
      >
        <span
          className={cn(
            "text-xs font-medium",
            isToday ? "text-primary font-bold" : "text-foreground"
          )}
        >
          {day}
        </span>
        <div className="mt-auto w-full flex flex-col gap-0.5">
          {filteredTentative.map((l) => (
            <div key={l.id} className={cn("w-full rounded px-1 py-0.5 text-[10px] font-medium truncate", STATE_COLORS.Tentativa)}>
              {l.nombre}
            </div>
          ))}
          {calEntry && (
            <div className={cn("w-full rounded px-1 py-0.5 text-[10px] font-medium truncate", STATE_COLORS[calEntry.estado_fecha])}>
              {calEntry.estado_fecha}
            </div>
          )}
        </div>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando calendario...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendario Unico</h1>
          <p className="text-sm text-muted-foreground">Fuente de verdad para fechas y disponibilidad</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {[...CALENDAR_STATES, "Tentativa"].map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", STATE_DOT_COLORS[s])} />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <button onClick={prevMonth} className="rounded-md p-1.5 text-foreground hover:bg-secondary transition-colors" aria-label="Mes anterior">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold text-card-foreground">
          {MONTHS[currentMonth]} {currentYear}
        </span>
        <button onClick={nextMonth} className="rounded-md p-1.5 text-foreground hover:bg-secondary transition-colors" aria-label="Mes siguiente">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-secondary">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-secondary-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{cells}</div>
      </div>

      {/* Date Form Modal */}
      {showForm && selectedDate && (
        <DateFormModal
          date={selectedDate}
          existing={calendarDates[selectedDate] || null}
          leads={leads}
          tentativeLeads={tentativeMap[selectedDate] || []}
          onClose={() => { setShowForm(false); setSelectedDate(null) }}
          onSave={async () => { setShowForm(false); setSelectedDate(null); await loadData() }}
        />
      )}
    </div>
  )
}

function DateFormModal({ date, existing, leads, tentativeLeads = [], onClose, onSave }) {
  const [estado, setEstado] = useState(existing?.estado_fecha || "Bloqueada")
  const [leadId, setLeadId] = useState(existing?.lead_id || "")
  const [nota, setNota] = useState(existing?.nota || "")
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await apiSetCalendarDate({
        fecha: date,
        estado_fecha: estado,
        lead_id: leadId || null,
        nota,
        fuente: "CRM",
      })
      toast.success(`Fecha ${existing ? "actualizada" : "guardada"} como ${estado}`)
      onSave()
    } catch (err) {
      setError(err.message)
      toast.error("Error al guardar fecha")
    }
  }

  function handleRemove() {
    toast('¿Seguro que quieres liberar/eliminar esta fecha?', {
      description: existing?.lead_id ? 'Se eliminará la fecha y su asociación con el lead' : 'Se eliminará la fecha del calendario',
      action: {
        label: 'Sí, eliminar',
        onClick: async () => {
          try {
            await apiRemoveCalendarDate(date)
            toast.success("Fecha liberada")
            onSave()
          } catch (err) {
            setError(err.message)
            toast.error("Error al liberar fecha")
          }
        },
      },
      cancel: {
        label: 'Cancelar',
      },
      duration: 10000,
    })
  }

  function handleSelectTentative(lead) {
    setLeadId(lead.id)
    if (!existing) setEstado("Reservada")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-card-foreground">
            {new Date(date + "T12:00:00").toLocaleDateString("es-AR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Leads con fecha tentativa en este día */}
        {tentativeLeads.length > 0 && (
          <div className="mb-4 rounded-md border border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800 p-3">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">Fechas tentativas de leads:</p>
            <div className="flex flex-col gap-1.5">
              {tentativeLeads.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleSelectTentative(l)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors text-left",
                    leadId === l.id
                      ? "bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-semibold"
                      : "bg-white dark:bg-card hover:bg-purple-100 dark:hover:bg-purple-900/50 text-foreground"
                  )}
                >
                  <span>{l.nombre} - {l.tipo_evento || "Sin tipo"}</span>
                  {leadId === l.id && <span className="text-purple-600 dark:text-purple-300 text-[10px]">seleccionado</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Estado de la Fecha</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              {CALENDAR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Lead Asociado (opcional)</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Sin lead asociado</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.nombre} - {l.tipo_evento}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Nota</label>
            <input value={nota} onChange={(e) => setNota(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Nota sobre esta fecha..." />
          </div>

          <div className="flex items-center justify-between">
            {existing && (
              <button type="button" onClick={handleRemove} className="rounded-md border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                Liberar fecha
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button type="button" onClick={onClose} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">Guardar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
