"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, X, Send, Check, XCircle, FileText, Eye, Pencil, Trash2, Printer, PenLine } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  fetchAllProposals,
  fetchLeads,
  apiCreateProposal,
  apiUpdateProposal,
  TIPOS_EVENTO,
  SERVICIOS_BASE,
  SERVICIOS_ADICIONALES,
  MODALIDADES_PRECIO,
} from "@/lib/api"

const STATUS_STYLES = {
  Creada:   "bg-secondary text-secondary-foreground",
  Enviada:  "bg-blue-100 text-blue-800",
  Aprobada: "bg-amber-100 text-amber-800",
  Rechazada:"bg-red-100 text-red-800",
  Firmada:  "bg-green-100 text-green-800",
}

const labelCls = "text-xs font-medium text-foreground"
const inputCls = "rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full"

// ─── Vista principal ───────────────────────────────────────────────────────────

export default function ProposalsView() {
  const [proposals, setProposals] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProposal, setEditingProposal] = useState(null)
  const [filterStatus, setFilterStatus] = useState("")
  const [viewingProposal, setViewingProposal] = useState(null)
  const [submittingId, setSubmittingId] = useState(null)

  async function loadData() {
    try {
      const [props, lds] = await Promise.all([fetchAllProposals(), fetchLeads()])
      setProposals(props)
      setLeads(lds)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const filteredProposals = useMemo(() => {
    let result = proposals
    if (filterStatus) result = result.filter(p => p.estado === filterStatus)
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [proposals, filterStatus])

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
    if (submittingId) return
    setSubmittingId(id)
    try {
      await apiUpdateProposal(id, { estado: newStatus })
      await loadData()
      toast.success(`Contrato marcado como ${newStatus}`)
    } catch (err) { console.error(err); toast.error("Error al actualizar estado") }
    finally { setSubmittingId(null) }
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

      {/* Filtro */}
      <div className="flex items-center gap-3">
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
        <span className="text-xs text-muted-foreground">{filteredProposals.length} contratos</span>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProposals.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No hay contratos</p>
          </div>
        )}
        {filteredProposals.map(p => (
          <ContractCard
            key={p.id}
            proposal={p}
            submittingId={submittingId}
            onView={() => setViewingProposal(p)}
            onEdit={() => setEditingProposal(p)}
            onStatusUpdate={handleStatusUpdate}
          />
        ))}
      </div>

      {showForm && (
        <ContractForm leads={leads} onSubmit={handleCreate} onClose={() => setShowForm(false)} />
      )}
      {editingProposal && (
        <ContractForm leads={leads} initial={editingProposal} onSubmit={handleUpdate} onClose={() => setEditingProposal(null)} />
      )}
      {viewingProposal && (
        <ContractDetail proposal={viewingProposal} onClose={() => setViewingProposal(null)} />
      )}
    </div>
  )
}

// ─── Tarjeta de contrato ────────────────────────────────────────────────────────

function ContractCard({ proposal: p, submittingId, onView, onEdit, onStatusUpdate }) {
  const totalAdic = (p.adicionales || []).length
  const elegidos  = (p.adicionales || []).filter(a => a.opcion_elegida !== null && a.opcion_elegida !== undefined).length
  const serviciosBase = p.servicios_base || []

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-4 py-3 bg-secondary/30">
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-sm font-bold text-card-foreground truncate">{p.lead?.nombre || "Desconocido"}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {p.tipo_evento && <span className="text-xs text-muted-foreground">{p.tipo_evento}</span>}
            {p.invitados_estimados ? <span className="text-xs text-muted-foreground">· {p.invitados_estimados} inv.</span> : null}
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0", STATUS_STYLES[p.estado])}>
          {p.estado}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 px-4 py-3 flex flex-col gap-2">
        <div className="flex items-start gap-4">
          {p.precio_senia > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seña</p>
              <p className="text-sm font-bold">${Number(p.precio_senia).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
            </div>
          )}
          {p.valor_total_evento > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Evento</p>
              <p className="text-sm font-bold">${Number(p.valor_total_evento).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
            </div>
          )}
        </div>
        {serviciosBase.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {serviciosBase.map(s => (
              <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{s}</span>
            ))}
          </div>
        )}
        {totalAdic > 0 && (
          <p className="text-xs text-muted-foreground">
            {totalAdic} adicional{totalAdic > 1 ? "es" : ""}
            {elegidos > 0 ? ` · ${elegidos} elegido${elegidos > 1 ? "s" : ""}` : " · sin elegir"}
          </p>
        )}
        {p.modalidad_actualizacion_precios && (
          <p className="text-[10px] text-muted-foreground">{p.modalidad_actualizacion_precios}</p>
        )}
        {p.fecha_envio && (
          <p className="text-[10px] text-muted-foreground">
            Enviada: {new Date(p.fecha_envio).toLocaleDateString("es-AR")}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 border-t border-border px-4 py-2 flex-wrap">
        {p.estado === "Creada" && (
          <button
            onClick={() => onStatusUpdate(p.id, "Enviada")}
            disabled={!!submittingId}
            className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-3 w-3" /> {submittingId === p.id ? "..." : "Enviar"}
          </button>
        )}
        {p.estado === "Enviada" && (
          <>
            <button
              onClick={() => onStatusUpdate(p.id, "Aprobada")}
              disabled={!!submittingId}
              className="flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-3 w-3" /> {submittingId === p.id ? "..." : "Aprobar"}
            </button>
            <button
              onClick={() => onStatusUpdate(p.id, "Rechazada")}
              disabled={!!submittingId}
              className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="h-3 w-3" /> {submittingId === p.id ? "..." : "Rechazar"}
            </button>
          </>
        )}
        {p.estado === "Aprobada" && (
          <button
            onClick={() => onStatusUpdate(p.id, "Firmada")}
            disabled={!!submittingId}
            className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PenLine className="h-3 w-3" /> {submittingId === p.id ? "..." : "Firmar"}
          </button>
        )}
        {p.estado !== "Firmada" && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
          >
            <Pencil className="h-3 w-3" /> Editar
          </button>
        )}
        <button
          onClick={onView}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary ml-auto"
        >
          <Eye className="h-3 w-3" /> Ver
        </button>
        <span className="text-[10px] text-muted-foreground ml-1">v{p.version}</span>
      </div>
    </div>
  )
}

// ─── Modal detalle ──────────────────────────────────────────────────────────────

function ContractDetail({ proposal: p, onClose }) {
  const adicionales   = p.adicionales || []
  const serviciosBase = p.servicios_base || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-border bg-card shadow-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-card-foreground">
              {p.lead?.nombre} — v{p.version}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {p.tipo_evento && <span className="text-xs text-muted-foreground">{p.tipo_evento}</span>}
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[p.estado])}>{p.estado}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {p.estado === "Firmada" && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </button>
            )}
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
          {/* Financiero */}
          {(p.precio_senia || p.valor_total_evento || p.modalidad_actualizacion_precios) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Financiero</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.precio_senia > 0 && <div><p className="text-[10px] text-muted-foreground">Precio Seña</p><p className="text-sm font-bold">${Number(p.precio_senia).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p></div>}
                {p.valor_total_evento > 0 && <div><p className="text-[10px] text-muted-foreground">Valor Total Evento</p><p className="text-sm font-bold">${Number(p.valor_total_evento).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p></div>}
                {p.modalidad_actualizacion_precios && <div><p className="text-[10px] text-muted-foreground">Modalidad</p><p className="text-sm">{p.modalidad_actualizacion_precios}</p></div>}
              </div>
            </div>
          )}

          {/* Producción */}
          {(p.invitados_estimados || p.menu_seleccionado || p.minimo_tarjetas || p.valor_tarjeta_adulto) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Producción</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.invitados_estimados && <div><p className="text-[10px] text-muted-foreground">Invitados</p><p className="text-sm">{p.invitados_estimados}</p></div>}
                {p.menu_seleccionado && <div><p className="text-[10px] text-muted-foreground">Menú</p><p className="text-sm">{p.menu_seleccionado}</p></div>}
                {p.minimo_tarjetas && <div><p className="text-[10px] text-muted-foreground">Mínimo tarjetas</p><p className="text-sm">{p.minimo_tarjetas}</p></div>}
                {p.valor_tarjeta_adulto > 0 && <div><p className="text-[10px] text-muted-foreground">Tarjeta adulto</p><p className="text-sm">${Number(p.valor_tarjeta_adulto).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p></div>}
                {p.valor_tarjeta_adolescente > 0 && <div><p className="text-[10px] text-muted-foreground">Tarjeta adolescente</p><p className="text-sm">${Number(p.valor_tarjeta_adolescente).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p></div>}
                {p.valor_tarjeta_nino > 0 && <div><p className="text-[10px] text-muted-foreground">Tarjeta niño</p><p className="text-sm">${Number(p.valor_tarjeta_nino).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p></div>}
              </div>
            </div>
          )}

          {/* Servicios base */}
          {serviciosBase.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Servicios Base</p>
              <div className="flex flex-wrap gap-2">
                {serviciosBase.map(s => <span key={s} className="rounded-full bg-secondary px-3 py-0.5 text-sm">{s}</span>)}
              </div>
            </div>
          )}

          {/* Adicionales */}
          {adicionales.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Adicionales</p>
              <div className="flex flex-col gap-3">
                {adicionales.map((a, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium mb-2">{a.nombre}</p>
                    <div className="flex flex-col gap-1.5">
                      {(a.opciones || []).map((op, oi) => (
                        <div
                          key={oi}
                          className={cn(
                            "flex items-center justify-between rounded-md px-3 py-1.5 text-sm",
                            a.opcion_elegida === oi
                              ? "bg-green-50 border border-green-200 text-green-800"
                              : "bg-secondary/40 text-card-foreground"
                          )}
                        >
                          <span>{op.descripcion}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${Number(op.precio || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
                            {a.opcion_elegida === oi && <Check className="h-3.5 w-3.5 text-green-600" />}
                          </div>
                        </div>
                      ))}
                      {(a.opcion_elegida === null || a.opcion_elegida === undefined) && (
                        <p className="text-[10px] text-muted-foreground italic mt-1">Sin opción elegida aún</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {p.contenido_html && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notas / Condiciones</p>
              <pre className="whitespace-pre-wrap text-sm text-card-foreground font-sans leading-relaxed">{p.contenido_html}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Formulario crear / editar ──────────────────────────────────────────────────

function ContractForm({ leads, initial, onSubmit, onClose }) {
  const isEdit = !!initial

  const [form, setForm] = useState({
    lead_id:                        initial?.lead_id || leads[0]?.id || "",
    contenido_html:                 initial?.contenido_html || "",
    precio_senia:                   initial?.precio_senia ?? "",
    tipo_evento:                    initial?.tipo_evento || "",
    invitados_estimados:            initial?.invitados_estimados ?? "",
    valor_total_evento:             initial?.valor_total_evento ?? "",
    modalidad_actualizacion_precios:initial?.modalidad_actualizacion_precios || "",
    servicios_base:                 initial?.servicios_base || [],
    menu_seleccionado:              initial?.menu_seleccionado || "",
    minimo_tarjetas:                initial?.minimo_tarjetas ?? "",
    valor_tarjeta_adulto:           initial?.valor_tarjeta_adulto ?? "",
    valor_tarjeta_adolescente:      initial?.valor_tarjeta_adolescente ?? "",
    valor_tarjeta_nino:             initial?.valor_tarjeta_nino ?? "",
  })

  const [adicionales, setAdicionales] = useState(
    initial?.adicionales ? JSON.parse(JSON.stringify(initial.adicionales)) : []
  )
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function toggleServicioBase(s) {
    setForm(f => ({
      ...f,
      servicios_base: f.servicios_base.includes(s)
        ? f.servicios_base.filter(x => x !== s)
        : [...f.servicios_base, s],
    }))
  }

  // ── helpers adicionales ──
  function addAdicional() {
    setAdicionales(prev => [...prev, { nombre: "", opciones: [{ descripcion: "", precio: "" }], opcion_elegida: null }])
  }
  function removeAdicional(i) {
    setAdicionales(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateNombre(i, nombre) {
    setAdicionales(prev => prev.map((a, idx) => idx === i ? { ...a, nombre } : a))
  }
  function addOpcion(i) {
    setAdicionales(prev => prev.map((a, idx) => idx === i
      ? { ...a, opciones: [...a.opciones, { descripcion: "", precio: "" }] }
      : a
    ))
  }
  function removeOpcion(ai, oi) {
    setAdicionales(prev => prev.map((a, idx) => idx === ai
      ? { ...a, opciones: a.opciones.filter((_, idx2) => idx2 !== oi) }
      : a
    ))
  }
  function updateOpcion(ai, oi, field, value) {
    setAdicionales(prev => prev.map((a, idx) => idx === ai
      ? { ...a, opciones: a.opciones.map((o, idx2) => idx2 === oi ? { ...o, [field]: value } : o) }
      : a
    ))
  }
  function toggleElegida(ai, oi) {
    setAdicionales(prev => prev.map((a, idx) => idx === ai
      ? { ...a, opcion_elegida: a.opcion_elegida === oi ? null : oi }
      : a
    ))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.lead_id) { toast.warning("Seleccioná un lead"); return }
    setSubmitting(true)
    try {
      const toNum = v => (v !== "" && v !== null && v !== undefined) ? Number(v) : null
      const payload = {
        ...form,
        precio_senia:            toNum(form.precio_senia),
        valor_total_evento:      toNum(form.valor_total_evento),
        invitados_estimados:     toNum(form.invitados_estimados),
        minimo_tarjetas:         toNum(form.minimo_tarjetas),
        valor_tarjeta_adulto:    toNum(form.valor_tarjeta_adulto),
        valor_tarjeta_adolescente: toNum(form.valor_tarjeta_adolescente),
        valor_tarjeta_nino:      toNum(form.valor_tarjeta_nino),
        adicionales: adicionales.map(a => ({
          ...a,
          opciones: a.opciones.map(o => ({ ...o, precio: o.precio !== "" ? Number(o.precio) : 0 })),
        })),
      }
      await onSubmit(payload)
    } finally { setSubmitting(false) }
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">

          {/* ── Cliente ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cliente</p>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Lead *</label>
              <select
                name="lead_id"
                value={form.lead_id}
                onChange={handleChange}
                disabled={isEdit}
                className={cn(inputCls, isEdit && "opacity-60 cursor-not-allowed")}
                required
              >
                <option value="">Seleccionar lead...</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nombre}{l.tipo_evento ? ` — ${l.tipo_evento}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* ── Evento ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Evento</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Tipo de Evento</label>
                <select name="tipo_evento" value={form.tipo_evento} onChange={handleChange} className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {TIPOS_EVENTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Cantidad de Invitados Estimados</label>
                <input type="number" name="invitados_estimados" value={form.invitados_estimados} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
              </div>
            </div>
          </section>

          {/* ── Financiero ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Financiero</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Precio de Seña ($)</label>
                <input type="number" name="precio_senia" value={form.precio_senia} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Valor Total del Evento ($)</label>
                <input type="number" name="valor_total_evento" value={form.valor_total_evento} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelCls}>Modalidad de Actualización de Precios</label>
                <select name="modalidad_actualizacion_precios" value={form.modalidad_actualizacion_precios} onChange={handleChange} className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {MODALIDADES_PRECIO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* ── Servicios base ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Servicios Base</p>
            <div className="flex flex-wrap gap-3">
              {SERVICIOS_BASE.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleServicioBase(s)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
                    form.servicios_base.includes(s)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* ── Adicionales ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adicionales</p>
              <button
                type="button"
                onClick={addAdicional}
                className="flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
              >
                <Plus className="h-3 w-3" /> Agregar Adicional
              </button>
            </div>
            {adicionales.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Sin adicionales. Usá el botón para agregar uno.</p>
            )}
            <div className="flex flex-col gap-4">
              {adicionales.map((a, ai) => (
                <div key={ai} className="rounded-md border border-border p-3 flex flex-col gap-3">
                  {/* Nombre del adicional */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={a.nombre}
                      onChange={e => updateNombre(ai, e.target.value)}
                      placeholder="Nombre del adicional (ej: DJ extra, Fotografía...)"
                      className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeAdicional(ai)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Opciones */}
                  <div className="flex flex-col gap-2 pl-3 border-l-2 border-border">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">
                      Opciones de precio — hacé clic en el círculo para marcar la elegida por el cliente
                    </p>
                    {a.opciones.map((op, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        {/* Botón elegida */}
                        <button
                          type="button"
                          onClick={() => toggleElegida(ai, oi)}
                          className={cn(
                            "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                            a.opcion_elegida === oi
                              ? "border-green-500 bg-green-500"
                              : "border-border bg-card hover:border-green-400"
                          )}
                          title="Marcar como opción elegida"
                        />
                        <input
                          type="text"
                          value={op.descripcion}
                          onChange={e => updateOpcion(ai, oi, "descripcion", e.target.value)}
                          placeholder="Descripción de la opción"
                          className="rounded-md border border-input bg-card px-2.5 py-1.5 text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring flex-1"
                        />
                        <input
                          type="number"
                          value={op.precio}
                          onChange={e => updateOpcion(ai, oi, "precio", e.target.value)}
                          placeholder="$"
                          min="0"
                          className="rounded-md border border-input bg-card px-2.5 py-1.5 text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring w-28"
                        />
                        {a.opciones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOpcion(ai, oi)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOpcion(ai)}
                      className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" /> Agregar otra opción
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Producción ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Producción</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Menú Seleccionado</label>
                <input type="text" name="menu_seleccionado" value={form.menu_seleccionado} onChange={handleChange} className={inputCls} placeholder="Menú 1, Menú 2, Personalizado..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Mínimo de Tarjetas</label>
                <input type="number" name="minimo_tarjetas" value={form.minimo_tarjetas} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Valor Tarjeta Adulto ($)</label>
                <input type="number" name="valor_tarjeta_adulto" value={form.valor_tarjeta_adulto} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Valor Tarjeta Adolescente ($)</label>
                <input type="number" name="valor_tarjeta_adolescente" value={form.valor_tarjeta_adolescente} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Valor Tarjeta Niño ($)</label>
                <input type="number" name="valor_tarjeta_nino" value={form.valor_tarjeta_nino} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
              </div>
            </div>
          </section>

          {/* ── Notas ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Notas / Condiciones</p>
            <textarea
              name="contenido_html"
              value={form.contenido_html}
              onChange={handleChange}
              rows={4}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full resize-none"
              placeholder="Condiciones especiales, notas para el cliente..."
            />
          </section>

          {/* Botones */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Contrato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
