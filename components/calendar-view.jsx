"use client"

import { useState, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getCalendarDates,
  setCalendarDate,
  removeCalendarDate,
  getLeads,
  CALENDAR_STATES,
} from "@/lib/store"

const STATE_COLORS = {
  Disponible: "bg-emerald-200 text-emerald-900",
  Bloqueada: "bg-amber-200 text-amber-900",
  Reservada: "bg-blue-200 text-blue-900",
  Confirmada: "bg-green-300 text-green-900",
}

const STATE_DOT_COLORS = {
  Disponible: "bg-emerald-500",
  Bloqueada: "bg-amber-500",
  Reservada: "bg-blue-500",
  Confirmada: "bg-green-600",
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
  const [refreshKey, setRefreshKey] = useState(0)

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  const calendarDates = useMemo(() => {
    const dates = getCalendarDates()
    const map = {}
    dates.forEach((d) => (map[d.fecha] = d))
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  const leads = useMemo(() => getLeads(), [refreshKey])

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
        {calEntry && (
          <div className={cn("mt-auto w-full rounded px-1 py-0.5 text-[10px] font-medium truncate", STATE_COLORS[calEntry.estado_fecha])}>
            {calEntry.estado_fecha}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendario Unico</h1>
          <p className="text-sm text-muted-foreground">Fuente de verdad para fechas y disponibilidad</p>
        </div>
        <div className="flex items-center gap-3">
          {CALENDAR_STATES.map((s) => (
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
          onClose={() => { setShowForm(false); setSelectedDate(null) }}
          onSave={() => { setShowForm(false); setSelectedDate(null); refresh() }}
        />
      )}
    </div>
  )
}

function DateFormModal({ date, existing, leads, onClose, onSave }) {
  const [estado, setEstado] = useState(existing?.estado_fecha || "Bloqueada")
  const [leadId, setLeadId] = useState(existing?.lead_id || "")
  const [nota, setNota] = useState(existing?.nota || "")
  const [error, setError] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    const result = setCalendarDate({
      fecha: date,
      estado_fecha: estado,
      lead_id: leadId || null,
      nota,
      fuente: "CRM",
    })
    if (result?.error) {
      setError(result.error)
      return
    }
    onSave()
  }

  function handleRemove() {
    removeCalendarDate(date)
    onSave()
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
