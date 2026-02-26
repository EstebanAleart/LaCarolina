"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Plus,
  X,
  Send,
  Check,
  XCircle,
  FileText,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  fetchAllProposals,
  fetchLeads,
  apiCreateProposal,
  apiUpdateProposal,
} from "@/lib/api"

const STATUS_STYLES = {
  Borrador: "bg-secondary text-secondary-foreground",
  Enviada: "bg-blue-100 text-blue-800",
  Aceptada: "bg-green-100 text-green-800",
  Rechazada: "bg-red-100 text-red-800",
}

export default function ProposalsView() {
  const [proposals, setProposals] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState("")
  const [viewingProposal, setViewingProposal] = useState(null)
  const [submittingId, setSubmittingId] = useState(null)

  async function loadData() {
    try {
      const [props, lds] = await Promise.all([
        fetchAllProposals(),
        fetchLeads()
      ])
      setProposals(props)
      setLeads(lds)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const filteredProposals = useMemo(() => {
    let result = proposals
    if (filterStatus) result = result.filter((p) => p.estado === filterStatus)
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [proposals, filterStatus])

  async function handleCreateProposal(data) {
    try {
      await apiCreateProposal(data.lead_id, data)
      setShowForm(false)
      await loadData()
      toast.success("Propuesta creada")
    } catch (err) { console.error(err); toast.error("Error al crear propuesta") }
  }

  async function handleStatusUpdate(id, newStatus) {
    if (submittingId) return
    setSubmittingId(id)
    try {
      await apiUpdateProposal(id, { estado: newStatus })
      await loadData()
      toast.success(`Propuesta marcada como ${newStatus}`)
    } catch (err) { console.error(err); toast.error("Error al actualizar propuesta") }
    finally { setSubmittingId(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando propuestas...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Propuestas</h1>
          <p className="text-sm text-muted-foreground">Propuestas comerciales versionadas y trazables</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nueva Propuesta
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los estados</option>
          {["Borrador", "Enviada", "Aceptada", "Rechazada"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProposals.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No hay propuestas</p>
          </div>
        )}
        {filteredProposals.map((p) => (
          <div key={p.id} className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
              <div>
                <p className="text-sm font-bold text-card-foreground">{p.lead?.nombre || "Desconocido"}</p>
                <p className="text-xs text-muted-foreground">Version {p.version}</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[p.estado])}>
                {p.estado}
              </span>
            </div>
            <div className="flex-1 px-4 py-3">
              <p className="text-xs text-muted-foreground line-clamp-3">{p.contenido || "Sin contenido"}</p>
              <p className="mt-3 text-lg font-bold text-card-foreground">${(p.precio_total || 0).toLocaleString()}</p>
              {p.fecha_envio && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Enviada: {new Date(p.fecha_envio).toLocaleDateString("es-AR")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 border-t border-border px-4 py-2">
              {p.estado === "Borrador" && (
                <button
                  onClick={() => handleStatusUpdate(p.id, "Enviada")}
                  disabled={submittingId === p.id}
                  className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-3 w-3" /> {submittingId === p.id ? "..." : "Enviar"}
                </button>
              )}
              {p.estado === "Enviada" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(p.id, "Aceptada")}
                    disabled={submittingId === p.id}
                    className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="h-3 w-3" /> {submittingId === p.id ? "..." : "Aceptar"}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(p.id, "Rechazada")}
                    disabled={submittingId === p.id}
                    className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-3 w-3" /> {submittingId === p.id ? "..." : "Rechazar"}
                  </button>
                </>
              )}
              <button
                onClick={() => setViewingProposal(p)}
                className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors ml-auto"
              >
                <Eye className="h-3 w-3" /> Ver
              </button>
              <span className="text-[10px] text-muted-foreground ml-2">
                {new Date(p.created_at).toLocaleDateString("es-AR")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <ProposalForm
          leads={leads}
          onSubmit={handleCreateProposal}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* View proposal modal */}
      {viewingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setViewingProposal(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg border border-border bg-card shadow-lg mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-card-foreground">
                  {viewingProposal.lead?.nombre || "Propuesta"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Versión {viewingProposal.version} &mdash;
                  <span className={cn("ml-1 rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[viewingProposal.estado])}>
                    {viewingProposal.estado}
                  </span>
                </p>
              </div>
              <button onClick={() => setViewingProposal(null)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {viewingProposal.contenido ? (
                <pre className="whitespace-pre-wrap text-sm text-card-foreground font-sans leading-relaxed">
                  {viewingProposal.contenido}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin contenido cargado.</p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm font-bold text-card-foreground">
                Total: ${(viewingProposal.precio_total || 0).toLocaleString()}
              </p>
              {viewingProposal.fecha_envio && (
                <p className="text-xs text-muted-foreground">
                  Enviada: {new Date(viewingProposal.fecha_envio).toLocaleDateString("es-AR")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProposalForm({ leads, onSubmit, onClose }) {
  const [form, setForm] = useState({
    lead_id: leads[0]?.id || "",
    contenido: "",
    precio_total: 0,
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.lead_id) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-card-foreground">Nueva Propuesta</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Lead *</label>
            <select
              value={form.lead_id}
              onChange={(e) => setForm((f) => ({ ...f, lead_id: e.target.value }))}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Seleccionar lead...</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.nombre} - {l.tipo_evento}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Contenido</label>
            <textarea
              value={form.contenido}
              onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
              rows={5}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Detalle de la propuesta: servicios, condiciones, etc..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Precio Total ($)</label>
            <input
              type="number"
              value={form.precio_total}
              onChange={(e) => setForm((f) => ({ ...f, precio_total: Number(e.target.value) }))}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancelar</button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">Crear Propuesta</button>
          </div>
        </form>
      </div>
    </div>
  )
}
