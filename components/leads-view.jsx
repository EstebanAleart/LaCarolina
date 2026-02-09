"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Trash2,
  ArrowRight,
  X,
  Clock,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getLeads,
  createLead,
  updateLead,
  changeLeadStatus,
  deleteLead,
  getInteractionsByLead,
  createInteraction,
  getVisitsByLead,
  createVisit,
  getProposalsByLead,
  getLeadStatusHistory,
  getUsers,
  LEAD_STATES,
  CANALES,
  TIPOS_EVENTO,
} from "@/lib/store"

const STATE_COLORS = {
  "Consulta inicial": "bg-blue-100 text-blue-800",
  "Propuesta enviada": "bg-violet-100 text-violet-800",
  "Esperando respuesta": "bg-amber-100 text-amber-800",
  "Visita agendada": "bg-cyan-100 text-cyan-800",
  "En negociacion": "bg-orange-100 text-orange-800",
  "Reserva tomada": "bg-emerald-100 text-emerald-800",
  "Evento confirmado": "bg-green-100 text-green-800",
  "Perdido": "bg-red-100 text-red-800",
}

function LeadForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState(
    initial || {
      nombre: "",
      telefono: "",
      email: "",
      canal_origen: "WhatsApp",
      tipo_evento: "Boda",
      fecha_tentativa: "",
      anio_evento: new Date().getFullYear(),
      valor_estimado: 0,
      notas: "",
    }
  )

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === "valor_estimado" || name === "anio_evento" ? Number(value) : value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Nombre completo" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Telefono</label>
          <input name="telefono" value={form.telefono} onChange={handleChange} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="+54 11 ..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="email@ejemplo.com" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Canal</label>
          <select name="canal_origen" value={form.canal_origen} onChange={handleChange} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            {CANALES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Tipo Evento</label>
          <select name="tipo_evento" value={form.tipo_evento} onChange={handleChange} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Fecha Tentativa</label>
          <input name="fecha_tentativa" type="date" value={form.fecha_tentativa} onChange={handleChange} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Ano Evento</label>
          <input name="anio_evento" type="number" value={form.anio_evento} onChange={handleChange} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Valor Estimado ($)</label>
          <input name="valor_estimado" type="number" value={form.valor_estimado} onChange={handleChange} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Notas</label>
        <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Notas adicionales..." />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancelar</button>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">Guardar</button>
      </div>
    </form>
  )
}

function LeadDetail({ lead, onClose, onRefresh }) {
  const [tab, setTab] = useState("timeline")
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [lostMotivo, setLostMotivo] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [intForm, setIntForm] = useState({ tipo: "WhatsApp", descripcion: "" })

  const interactions = useMemo(() => getInteractionsByLead(lead.id), [lead.id])
  const visits = useMemo(() => getVisitsByLead(lead.id), [lead.id])
  const proposals = useMemo(() => getProposalsByLead(lead.id), [lead.id])
  const history = useMemo(() => getLeadStatusHistory(lead.id), [lead.id])
  const users = useMemo(() => getUsers(), [])

  function getUserName(uid) {
    const u = users.find((u) => u.id === uid)
    return u ? u.nombre : "Sistema"
  }

  function handleStatusChange() {
    if (!selectedStatus) return
    if (selectedStatus === "Perdido" && !lostMotivo.trim()) {
      alert("Motivo obligatorio para marcar como Perdido")
      return
    }
    changeLeadStatus(lead.id, selectedStatus, "u1", lostMotivo || null)
    setShowStatusChange(false)
    setSelectedStatus("")
    setLostMotivo("")
    onRefresh()
  }

  function handleAddInteraction(e) {
    e.preventDefault()
    if (!intForm.descripcion.trim()) return
    createInteraction({ lead_id: lead.id, ...intForm })
    setIntForm({ tipo: "WhatsApp", descripcion: "" })
    onRefresh()
  }

  const timeline = useMemo(() => {
    const items = []
    interactions.forEach((i) =>
      items.push({ date: i.fecha, type: "interaction", data: i })
    )
    visits.forEach((v) =>
      items.push({ date: v.fecha_visita, type: "visit", data: v })
    )
    history.forEach((h) =>
      items.push({ date: h.changed_at, type: "status", data: h })
    )
    proposals.forEach((p) =>
      items.push({ date: p.created_at, type: "proposal", data: p })
    )
    return items.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [interactions, visits, history, proposals])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto bg-card border-l border-border shadow-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">{lead.nombre}</h2>
            <span className={cn("inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium", STATE_COLORS[lead.estado_actual])}>
              {lead.estado_actual}
            </span>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Lead info */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> {lead.telefono || "---"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {lead.email || "---"}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-card-foreground">Tipo:</span> {lead.tipo_evento}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-card-foreground">Valor:</span> ${(lead.valor_estimado || 0).toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-card-foreground">Canal:</span> {lead.canal_origen}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-card-foreground">Ano:</span> {lead.anio_evento}
            </div>
          </div>

          {/* Status change */}
          <div className="mb-4">
            {!showStatusChange ? (
              <button
                onClick={() => setShowStatusChange(true)}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <ArrowRight className="h-3.5 w-3.5" /> Cambiar Estado
              </button>
            ) : (
              <div className="rounded-md border border-border bg-secondary p-3 flex flex-col gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleccionar estado...</option>
                  {LEAD_STATES.filter((s) => s !== lead.estado_actual).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {selectedStatus === "Perdido" && (
                  <input
                    value={lostMotivo}
                    onChange={(e) => setLostMotivo(e.target.value)}
                    placeholder="Motivo (obligatorio)"
                    className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
                <div className="flex gap-2">
                  <button onClick={handleStatusChange} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">Confirmar</button>
                  <button onClick={() => setShowStatusChange(false)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-4">
            {["timeline", "interacciones", "propuestas"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-2 text-xs font-medium border-b-2 transition-colors capitalize",
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "timeline" && (
            <div className="flex flex-col gap-3">
              {timeline.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin actividad registrada</p>
              )}
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-2 w-2 rounded-full mt-1.5",
                      item.type === "status" ? "bg-primary" :
                      item.type === "interaction" ? "bg-accent" :
                      item.type === "visit" ? "bg-warning" : "bg-muted-foreground"
                    )} />
                    {i < timeline.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("es-AR")}
                    </div>
                    {item.type === "status" && (
                      <p className="text-card-foreground">
                        Estado: <span className="font-medium">{item.data.estado_anterior}</span>
                        {" -> "}<span className="font-medium">{item.data.estado_nuevo}</span>
                        {item.data.motivo && <span className="text-muted-foreground"> ({item.data.motivo})</span>}
                      </p>
                    )}
                    {item.type === "interaction" && (
                      <p className="text-card-foreground">
                        <span className="font-medium">{item.data.tipo}:</span> {item.data.descripcion}
                      </p>
                    )}
                    {item.type === "visit" && (
                      <p className="text-card-foreground">
                        Visita - <span className="font-medium">{item.data.resultado}</span>
                        {item.data.notas && `: ${item.data.notas}`}
                      </p>
                    )}
                    {item.type === "proposal" && (
                      <p className="text-card-foreground">
                        Propuesta v{item.data.version} - ${(item.data.precio_total || 0).toLocaleString()}
                        <span className={cn("ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-[10px]",
                          item.data.estado === "Borrador" ? "bg-secondary text-secondary-foreground" :
                          item.data.estado === "Enviada" ? "bg-blue-100 text-blue-800" :
                          item.data.estado === "Aceptada" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        )}>{item.data.estado}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "interacciones" && (
            <div className="flex flex-col gap-3">
              <form onSubmit={handleAddInteraction} className="flex flex-col gap-2 rounded-md border border-border bg-secondary p-3">
                <div className="flex gap-2">
                  <select
                    value={intForm.tipo}
                    onChange={(e) => setIntForm((p) => ({ ...p, tipo: e.target.value }))}
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {["WhatsApp", "Llamada", "Email", "Reunion"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    value={intForm.descripcion}
                    onChange={(e) => setIntForm((p) => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Descripcion de la interaccion..."
                    className="flex-1 rounded-md border border-input bg-card px-2 py-1.5 text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button type="submit" className="self-end rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">Agregar</button>
              </form>
              {interactions.map((i) => (
                <div key={i.id} className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-card-foreground">{i.tipo}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(i.fecha).toLocaleDateString("es-AR")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{i.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "propuestas" && (
            <div className="flex flex-col gap-3">
              {proposals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin propuestas</p>
              )}
              {proposals.map((p) => (
                <div key={p.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-card-foreground">Version {p.version}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                      p.estado === "Borrador" ? "bg-secondary text-secondary-foreground" :
                      p.estado === "Enviada" ? "bg-blue-100 text-blue-800" :
                      p.estado === "Aceptada" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    )}>{p.estado}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.contenido}</p>
                  <p className="text-sm font-semibold text-card-foreground mt-2">${(p.precio_total || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LeadsView() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [filterState, setFilterState] = useState("")
  const [filterChannel, setFilterChannel] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [detailLead, setDetailLead] = useState(null)
  const [viewMode, setViewMode] = useState("table") // "table" or "kanban"

  function refresh() {
    setRefreshKey((k) => k + 1)
    // Re-fetch detail lead if open
    if (detailLead) {
      const updated = getLeads().find((l) => l.id === detailLead.id)
      if (updated) setDetailLead(updated)
      else setDetailLead(null)
    }
  }

  const leads = useMemo(() => {
    let result = getLeads()
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.nombre.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.telefono.includes(q)
      )
    }
    if (filterYear) result = result.filter((l) => String(l.anio_evento) === filterYear)
    if (filterState) result = result.filter((l) => l.estado_actual === filterState)
    if (filterChannel) result = result.filter((l) => l.canal_origen === filterChannel)
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterYear, filterState, filterChannel, refreshKey])

  function handleCreate(formData) {
    createLead(formData)
    setShowForm(false)
    refresh()
  }

  function handleUpdate(formData) {
    if (editLead) {
      updateLead(editLead.id, formData)
      setEditLead(null)
      refresh()
    }
  }

  function handleDelete(id) {
    if (confirm("Eliminar este lead y toda su informacion asociada?")) {
      deleteLead(id)
      refresh()
    }
  }

  const years = useMemo(() => {
    const y = new Set(getLeads().map((l) => l.anio_evento))
    return [...y].sort()
  }, [refreshKey])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM Leads</h1>
          <p className="text-sm text-muted-foreground">Gestion del pipeline comercial</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "table" ? "kanban" : "table")}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            {viewMode === "table" ? "Vista Kanban" : "Vista Tabla"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Nuevo Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, telefono..."
            className="w-full rounded-md border border-input bg-card py-2 pl-9 pr-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los anos</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los estados</option>
          {LEAD_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los canales</option>
          {CANALES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Create/Edit form modal */}
      {(showForm || editLead) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => { setShowForm(false); setEditLead(null) }} />
          <div className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg mx-4">
            <h3 className="text-lg font-bold text-card-foreground mb-4">
              {editLead ? "Editar Lead" : "Nuevo Lead"}
            </h3>
            <LeadForm
              initial={editLead || undefined}
              onSubmit={editLead ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditLead(null) }}
            />
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground hidden md:table-cell">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground hidden sm:table-cell">Canal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-foreground hidden lg:table-cell">Valor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay leads que coincidan con los filtros</td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailLead(lead)} className="text-left">
                      <p className="font-medium text-card-foreground">{lead.nombre}</p>
                      <p className="text-xs text-muted-foreground">{lead.email || lead.telefono}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.tipo_evento}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{lead.canal_origen}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", STATE_COLORS[lead.estado_actual])}>
                      {lead.estado_actual}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-card-foreground font-medium hidden lg:table-cell">
                    ${(lead.valor_estimado || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setDetailLead(lead)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors" aria-label="Ver detalle">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditLead(lead)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors" aria-label="Editar">
                        <FileText className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(lead.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors" aria-label="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {LEAD_STATES.filter((s) => s !== "Perdido").map((state) => {
            const stateLeads = leads.filter((l) => l.estado_actual === state)
            return (
              <div key={state} className="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-secondary/50">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">{state}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {stateLeads.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2 max-h-[60vh] overflow-y-auto">
                  {stateLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setDetailLead(lead)}
                      className="rounded-md border border-border bg-card p-3 text-left hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-card-foreground">{lead.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lead.tipo_evento}</p>
                      <p className="text-xs font-semibold text-primary mt-1">${(lead.valor_estimado || 0).toLocaleString()}</p>
                    </button>
                  ))}
                  {stateLeads.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">Sin leads</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Slideout */}
      {detailLead && (
        <LeadDetail lead={detailLead} onClose={() => setDetailLead(null)} onRefresh={refresh} />
      )}
    </div>
  )
}
