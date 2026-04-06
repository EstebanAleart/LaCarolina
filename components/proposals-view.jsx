"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Plus,
  X,
  Send,
  Check,
  XCircle,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fetchAllProposals,
  fetchLeads,
  apiCreateProposal,
  apiUpdateProposal,
} from "@/lib/api"
import { PrintableContract } from "./printable-contract"

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
  const [editingProposal, setEditingProposal] = useState(null)
  const [filterStatus, setFilterStatus] = useState("")

  const filteredProposals = useMemo(() => {
    let result = proposals
    if (filterStatus) result = result.filter((p) => p.estado === filterStatus)
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [proposals, filterStatus, searchNombre, filterFecha])


  async function loadData() {
    try {
      const [props, lds] = await Promise.all([fetchAllProposals(), fetchLeads()])
      setProposals(props)
      setLeads(lds)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])


  async function handleCreate(data) {
    try {
      await apiCreateProposal(data.lead_id, data)
      setShowForm(false)
      await loadData()
      toast.success("Contrato creado")
    } catch (err) { console.error(err); toast.error("Error al crear contrato") }
  }

  async function handleUpdate(data) {
    try {
      await apiUpdateProposal(editingProposal.id, data)
      setEditingProposal(null)
      await loadData()
      toast.success("Contrato actualizado")
    } catch (err) { console.error(err); toast.error("Error al actualizar contrato") }
  }

  async function handleStatusUpdate(id, newStatus) {
    try {
      await apiUpdateProposal(id, { estado: newStatus })
      await loadData()
    } catch (err) { console.error(err) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando contratos...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground">Propuestas y contratos comerciales versionados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nuevo Contrato
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los estados</option>
          {["Creada", "Enviada", "Aprobada", "Rechazada", "Firmada"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProposals.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No hay contratos</p>
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
                  className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Send className="h-3 w-3" /> Enviar
                </button>
              )}
              {p.estado === "Enviada" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(p.id, "Aceptada")}
                    className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                  >
                    <Check className="h-3 w-3" /> Aceptar
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(p.id, "Rechazada")}
                    className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90 transition-opacity"
                  >
                    <XCircle className="h-3 w-3" /> Rechazar
                  </button>
                </>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString("es-AR")}
              </span>
            </div>
          </div>
        ))}
      </div>
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
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-border bg-card shadow-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-bold text-card-foreground">
            {isEdit ? `Editar Contrato — ${initial.lead?.nombre}` : "Nuevo Contrato"}
          </h3>
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

// ─── Diálogo de confirmación de firma ──────────────────────────────────────────

function ConfirmFirmDialog({ proposalId, onConfirm, onCancel, isSubmitting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-xl mx-4">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 bg-amber-50 dark:bg-amber-950/30">
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">⚠️ Confirmar Firma</h3>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-card-foreground">
            Una vez <span className="font-bold">firmado</span>, el contrato <span className="font-bold text-red-600">NO PODRÁ SER EDITADO</span>.
          </p>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-4">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              ⚠️ Esta acción es irreversible
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-2">
              Si necesitas hacer cambios, deberás crear una nueva versión del contrato.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas firmar este contrato?
          </p>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4 bg-secondary/20">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Firmando..." : "✓ Sí, Firmar Contrato"}
          </button>
        </div>
      </div>
    </div>
  )
}
