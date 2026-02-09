"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  X,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getLeads,
  getUsers,
  TASK_STATES,
  TASK_PRIORITIES,
} from "@/lib/store"

const STATE_ICONS = {
  Pendiente: Circle,
  "En Proceso": Clock,
  Hecho: CheckCircle2,
  Cancelado: X,
}

const PRIORITY_COLORS = {
  Alta: "bg-red-100 text-red-800",
  Media: "bg-amber-100 text-amber-800",
  Baja: "bg-blue-100 text-blue-800",
}

export default function TasksView() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [filterState, setFilterState] = useState("")
  const [filterUser, setFilterUser] = useState("")

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  const tasks = useMemo(() => {
    let result = getTasks()
    if (filterState) result = result.filter((t) => t.estado === filterState)
    if (filterUser) result = result.filter((t) => t.assigned_to_user_id === filterUser)
    return result.sort((a, b) => {
      // Sort by: overdue first, then by due_date
      const aOverdue = a.due_date && new Date(a.due_date) < new Date() && a.estado === "Pendiente"
      const bOverdue = b.due_date && new Date(b.due_date) < new Date() && b.estado === "Pendiente"
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date)
      return 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, filterState, filterUser])

  const leads = useMemo(() => getLeads(), [refreshKey])
  const users = useMemo(() => getUsers(), [])

  function getLeadName(leadId) {
    if (!leadId) return null
    const lead = leads.find((l) => l.id === leadId)
    return lead ? lead.nombre : null
  }

  function getUserName(userId) {
    const user = users.find((u) => u.id === userId)
    return user ? user.nombre : "---"
  }

  function handleCreateTask(data) {
    createTask(data)
    setShowForm(false)
    refresh()
  }

  function handleToggleState(task) {
    const nextState =
      task.estado === "Pendiente"
        ? "En Proceso"
        : task.estado === "En Proceso"
        ? "Hecho"
        : task.estado === "Hecho"
        ? "Pendiente"
        : "Pendiente"
    updateTask(task.id, { estado: nextState })
    refresh()
  }

  function handleDelete(id) {
    deleteTask(id)
    refresh()
  }

  const grouped = useMemo(() => {
    const groups = {}
    TASK_STATES.forEach((s) => (groups[s] = []))
    tasks.forEach((t) => {
      if (groups[t.estado]) groups[t.estado].push(t)
    })
    return groups
  }, [tasks])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Tareas</h1>
          <p className="text-sm text-muted-foreground">Gestion de tareas por lead, evento y responsable</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nueva Tarea
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los estados</option>
          {TASK_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los usuarios</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATES.map((state) => {
          const Icon = STATE_ICONS[state]
          const stateTasks = grouped[state] || []
          return (
            <div key={state} className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/30">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <Icon className={cn("h-4 w-4",
                  state === "Hecho" ? "text-accent" :
                  state === "En Proceso" ? "text-primary" :
                  state === "Cancelado" ? "text-destructive" :
                  "text-muted-foreground"
                )} />
                <span className="text-xs font-semibold text-foreground">{state}</span>
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {stateTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-2 max-h-[60vh] overflow-y-auto">
                {stateTasks.map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.estado === "Pendiente"
                  const leadName = getLeadName(task.lead_id)
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "rounded-md border bg-card p-3 transition-shadow hover:shadow-md",
                        isOverdue ? "border-destructive" : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button onClick={() => handleToggleState(task)} className="mt-0.5 shrink-0">
                          <Icon className={cn("h-4 w-4",
                            state === "Hecho" ? "text-accent" :
                            state === "En Proceso" ? "text-primary" :
                            "text-muted-foreground"
                          )} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium text-card-foreground", task.estado === "Hecho" && "line-through opacity-60")}>
                            {task.titulo}
                          </p>
                          {task.descripcion && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.descripcion}</p>
                          )}
                        </div>
                        <button onClick={() => handleDelete(task.id)} className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors" aria-label="Eliminar tarea">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PRIORITY_COLORS[task.prioridad])}>
                          {task.prioridad}
                        </span>
                        {leadName && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                            {leadName}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{getUserName(task.assigned_to_user_id)}</span>
                        {task.due_date && (
                          <span className={cn("flex items-center gap-0.5", isOverdue && "text-destructive font-medium")}>
                            {isOverdue && <AlertTriangle className="h-3 w-3" />}
                            {new Date(task.due_date + "T12:00:00").toLocaleDateString("es-AR")}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {stateTasks.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">Sin tareas</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Task Form */}
      {showForm && (
        <TaskForm
          leads={leads}
          users={users}
          onSubmit={handleCreateTask}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function TaskForm({ leads, users, onSubmit, onClose }) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    lead_id: "",
    assigned_to_user_id: "u1",
    prioridad: "Media",
    due_date: "",
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-card-foreground">Nueva Tarea</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Titulo *</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              required
              className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Titulo de la tarea"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Descripcion</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Descripcion detallada..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Lead (opcional)</label>
              <select
                value={form.lead_id}
                onChange={(e) => setForm((f) => ({ ...f, lead_id: e.target.value }))}
                className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin lead</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Asignar a</label>
              <select
                value={form.assigned_to_user_id}
                onChange={(e) => setForm((f) => ({ ...f, assigned_to_user_id: e.target.value }))}
                className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {users.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Prioridad</label>
              <select
                value={form.prioridad}
                onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Fecha limite</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancelar</button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">Crear Tarea</button>
          </div>
        </form>
      </div>
    </div>
  )
}
