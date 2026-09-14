"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
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
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  fetchLeads,
  apiCreateLead,
  apiUpdateLead,
  apiChangeLeadStatus,
  apiDeleteLead,
  fetchLeadById,
  fetchUsers,
  apiCreateInteraction,
  fetchCalendarDates,
  LEAD_STATES,
  CANALES,
  TIPOS_EVENTO,
  TIPOS_CLIENTE,
} from "@/lib/api"

const STATE_COLORS = {
  "Lead nuevo":                "bg-slate-100 text-slate-700",
  "Contactado":                "bg-blue-100 text-blue-800",
  "Esperando visita":          "bg-sky-100 text-sky-800",
  "Visita al salón realizada": "bg-cyan-100 text-cyan-800",
  "Enviar propuesta":          "bg-purple-100 text-purple-800",
  "Propuesta enviada":         "bg-violet-100 text-violet-800",
  "Propuesta Aceptada":        "bg-lime-100 text-lime-800",
  "Propuesta Rechazada":       "bg-rose-100 text-rose-800",
  "Esperando Reserva":         "bg-orange-100 text-orange-800",
  "Reserva tomada":            "bg-amber-100 text-amber-800",
  "Contrato firmado":          "bg-emerald-100 text-emerald-800",
  "Cliente activo":            "bg-green-100 text-green-800",
  "Evento realizado":          "bg-teal-100 text-teal-800",
  "Post-evento / cerrado":     "bg-gray-100 text-gray-600",
  "Perdido":                   "bg-red-100 text-red-800",
}

function LeadForm({ onSubmit, onCancel, initial, calendarDates = [] }) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
        fecha_tentativa:      initial.fecha_tentativa      ? initial.fecha_tentativa.substring(0, 10)      : "",
        fecha_visita_salon:   initial.fecha_visita_salon   ? initial.fecha_visita_salon.substring(0, 10)   : "",
        fecha_firma_contrato: initial.fecha_firma_contrato ? initial.fecha_firma_contrato.substring(0, 10) : "",
        tipo_cliente:        initial.tipo_cliente        || "Particular",
        valor_estimado:      initial.valor_estimado      || 0,
        invitados_estimados: initial.invitados_estimados || "",
        anio_evento:         initial.anio_evento         || new Date().getFullYear(),
        notas:               initial.notas               || "",
      }
    }
    return {
      nombre: "",
      telefono: "",
      email: "",
      canal_origen: "WhatsApp",
      tipo_evento: "Fiesta de 15",
      tipo_cliente: "Particular",
      fecha_tentativa: "",
      fecha_visita_salon: "",
      fecha_firma_contrato: "",
      anio_evento: new Date().getFullYear(),
      valor_estimado: 0,
      invitados_estimados: "",
      notas: "",
      es_historico: false,
    }
  })

  const [valorDisplay, setValorDisplay] = useState(() =>
    initial?.valor_estimado ? Number(initial.valor_estimado).toLocaleString("es-AR", { maximumFractionDigits: 0 }) : ""
  )
  const [invitadosDisplay, setInvitadosDisplay] = useState(() =>
    initial?.invitados_estimados ? Number(initial.invitados_estimados).toLocaleString("es-AR", { maximumFractionDigits: 0 }) : ""
  )
  const [submitting, setSubmitting] = useState(false)
  const [fechaOcupadaWarning, setFechaOcupadaWarning] = useState("")

  function handleChange(e) {
    const { name, value } = e.target
    if (name === "fecha_tentativa") {
      if (value) {
        const year = new Date(value + "T12:00:00").getFullYear()
        setForm((prev) => ({ ...prev, fecha_tentativa: value, anio_evento: year }))
        // Validar contra el calendario: buscar Reservada/Confirmada de otro lead
        const conflict = calendarDates.find((d) => {
          const fechaCal = d.fecha ? d.fecha.toString().substring(0, 10) : ""
          if (fechaCal !== value) return false
          if (d.estado_fecha !== "Reservada" && d.estado_fecha !== "Confirmada") return false
          // Si el lead actual ya tiene esa entrada, no es conflicto
          if (initial?.id && d.lead_id === initial.id) return false
          return true
        })
        if (conflict) {
          setFechaOcupadaWarning(`Esta fecha ya está ${conflict.estado_fecha.toLowerCase()} por otro evento. El salon no esta disponible.`)
        } else {
          setFechaOcupadaWarning("")
        }
      } else {
        setForm((prev) => ({ ...prev, fecha_tentativa: "" }))
        setFechaOcupadaWarning("")
      }
      return
    }
    setForm((prev) => ({ ...prev, [name]: name === "anio_evento" ? Number(value) : value }))
  }

  function handleValorChange(e) {
    const raw = e.target.value.replace(/\D/g, "")
    const num = raw ? parseInt(raw, 10) : 0
    setValorDisplay(raw ? num.toLocaleString("es-AR", { maximumFractionDigits: 0 }) : "")
    setForm((prev) => ({ ...prev, valor_estimado: num }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        nombre:              form.nombre,
        telefono:            form.telefono,
        email:               form.email,
        canal_origen:        form.canal_origen,
        tipo_evento:         form.tipo_evento,
        tipo_cliente:        form.tipo_cliente,
        fecha_tentativa:     form.fecha_tentativa || null,
        fecha_visita_salon:  form.fecha_visita_salon || null,
        fecha_firma_contrato: form.fecha_firma_contrato || null,
        anio_evento:         Number(form.anio_evento),
        valor_estimado:      typeof form.valor_estimado === 'number' ? form.valor_estimado : Number(String(form.valor_estimado).replace(/\D/g, '')) || 0,
        invitados_estimados: form.invitados_estimados === '' ? null : parseInt(String(form.invitados_estimados).replace(/\./g, ""), 10) || null,
        notas:               form.notas,
        es_historico:        !!form.es_historico,
      })
    } finally { setSubmitting(false) }
  }

  const inputCls = "rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  const labelCls = "text-xs font-medium text-foreground"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Lead histórico: cliente previo que se carga al sistema, no cuenta para conversión ni pipeline */}
      <label className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors",
        form.es_historico ? "border-orange-500 bg-orange-50" : "border-orange-200 bg-orange-50/40 hover:bg-orange-50"
      )}>
        <input
          type="checkbox"
          checked={!!form.es_historico}
          onChange={(e) => setForm((f) => ({ ...f, es_historico: e.target.checked }))}
          className="h-5 w-5 accent-orange-500"
        />
        <span>
          <span className="block text-sm font-bold text-orange-700">Lead histórico</span>
          <span className="block text-xs text-orange-700/80">No es un lead nuevo: es un cliente previo que se ingresa al sistema. No cuenta para conversión ni pipeline.</span>
        </span>
      </label>

      {/* Datos de contacto */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contacto</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required className={inputCls} placeholder="Nombre completo" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Telefono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} className={inputCls} placeholder="+54 11 ..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} placeholder="email@ejemplo.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Canal</label>
            <select name="canal_origen" value={form.canal_origen} onChange={handleChange} className={inputCls}>
              {CANALES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tipo de cliente</label>
            <select name="tipo_cliente" value={form.tipo_cliente} onChange={handleChange} className={inputCls}>
              {TIPOS_CLIENTE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tipo de evento</label>
            <select name="tipo_evento" value={form.tipo_evento} onChange={handleChange} className={inputCls}>
              {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Primera instancia — fechas y estimado */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Primera instancia</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Fecha del evento</label>
            <input name="fecha_tentativa" type="date" value={form.fecha_tentativa} onChange={handleChange} className={cn(inputCls, fechaOcupadaWarning && "border-red-500 focus:ring-red-500")} />
            {fechaOcupadaWarning && (
              <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">
                ⚠ {fechaOcupadaWarning}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Año evento</label>
            <input name="anio_evento" type="number" value={form.anio_evento} onChange={handleChange} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Fecha visita al salon</label>
            <input name="fecha_visita_salon" type="date" value={form.fecha_visita_salon} onChange={handleChange} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Valor de Seña ($)</label>
            <input
              type="text"
              inputMode="numeric"
              value={valorDisplay}
              onChange={handleValorChange}
              className={inputCls}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Cantidad de invitados</label>
            <input
              type="text"
              inputMode="numeric"
              value={invitadosDisplay}
              onChange={(e) => {
                const digits = e.target.value.replace(/\./g, "").replace(/[^\d]/g, "")
                const num = digits !== "" ? parseInt(digits, 10) : ""
                setInvitadosDisplay(digits !== "" ? num.toLocaleString("es-AR", { maximumFractionDigits: 0 }) : "")
                setForm((prev) => ({ ...prev, invitados_estimados: num }))
              }}
              className={inputCls}
              placeholder="Ej: 150"
            />
          </div>
        </div>
      </div>

      {/* Segunda instancia — solo al editar, desde "Visita al salón realizada" en adelante */}
      {initial && LEAD_STATES.indexOf(initial.estado_actual) >= LEAD_STATES.indexOf("Visita al salón realizada") && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Segunda instancia</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Fecha firma de contrato</label>
              <input name="fecha_firma_contrato" type="date" value={form.fecha_firma_contrato} onChange={handleChange} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={`${labelCls} text-muted-foreground`}>Fecha limite pago total</label>
              <input
                type="date"
                value={form.fecha_tentativa ? (() => { const d = new Date(form.fecha_tentativa); d.setDate(d.getDate() - 30); return d.toISOString().substring(0, 10) })() : ""}
                disabled
                className={`${inputCls} opacity-60 cursor-not-allowed`}
                title="Auto-calculada: fecha evento - 30 dias"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Notas</label>
        <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} className={`${inputCls} resize-none`} placeholder="Notas adicionales..." />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button type="button" onClick={onCancel} className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors sm:w-auto sm:py-2">Cancelar</button>
        <button type="submit" disabled={submitting} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:py-2">{submitting ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  )
}

function LeadDetail({ lead: initialLead, onClose, onRefresh }) {
  const [leadFull, setLeadFull] = useState(null)
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState("timeline")
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [lostMotivo, setLostMotivo] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [intForm, setIntForm] = useState({ canal: "WhatsApp", direction: "OUT", descripcion: "" })

  const loadDetail = useCallback(async () => {
    try {
      const [full, usrs] = await Promise.all([
        fetchLeadById(initialLead.id),
        fetchUsers()
      ])
      setLeadFull(full)
      setUsers(usrs)
    } catch (err) { console.error(err) }
  }, [initialLead.id])

  useEffect(() => { loadDetail() }, [loadDetail])

  const lead = leadFull || initialLead
  const interactions = leadFull?.interactions || []
  const visits = leadFull?.visits || []
  const proposals = leadFull?.proposals || []
  const history = leadFull?.status_history || []

  function getUserName(uid) {
    const u = users.find((u) => u.id === uid)
    return u ? u.nombre : "Sistema"
  }

  async function handleStatusChange() {
    if (!selectedStatus || submitting) return
    if (selectedStatus === "Perdido" && !lostMotivo.trim()) {
      toast.warning("Motivo obligatorio para marcar como Perdido")
      return
    }
    setSubmitting(true)
    try {
      await apiChangeLeadStatus(lead.id, selectedStatus, lostMotivo || null, null)
      setShowStatusChange(false)
      setSelectedStatus("")
      setLostMotivo("")
      await loadDetail()
      onRefresh()
      toast.success(`Estado cambiado a "${selectedStatus}"`)
    } catch (err) { console.error(err); toast.error("Error al cambiar estado") }
    finally { setSubmitting(false) }
  }

  async function handleAddInteraction(e) {
    e.preventDefault()
    if (!intForm.descripcion.trim()) return
    try {
      await apiCreateInteraction(lead.id, intForm)
      setIntForm({ canal: "WhatsApp", direction: "OUT", descripcion: "" })
      await loadDetail()
      onRefresh()
      toast.success("Interaccion registrada")
    } catch (err) { console.error(err); toast.error("Error al registrar interaccion") }
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
  }, [leadFull])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto bg-card border-l border-border shadow-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-card-foreground">
              {lead.es_historico && <span title="Lead histórico" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">H</span>}
              {lead.nombre}
            </h2>
            <span className={cn("inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium", STATE_COLORS[lead.estado_actual])}>
              {lead.estado_actual}
            </span>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Lead info */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 mb-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" /> {lead.telefono || "---"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground break-all">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {lead.email || "---"}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-card-foreground">Evento:</span> {lead.tipo_evento}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-card-foreground">Cliente:</span> {lead.tipo_cliente || "---"}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-card-foreground">Canal:</span> {lead.canal_origen}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-card-foreground">Seña:</span> ${(lead.valor_estimado || 0).toLocaleString()}
            </div>
            {lead.fecha_tentativa && (
              <div className="text-muted-foreground">
                <span className="font-medium text-card-foreground">Fecha evento:</span>{" "}
                {new Date(lead.fecha_tentativa).toLocaleDateString("es-AR")}
              </div>
            )}
            {lead.fecha_visita_salon && (
              <div className="text-muted-foreground">
                <span className="font-medium text-card-foreground">Visita salon:</span>{" "}
                {new Date(lead.fecha_visita_salon).toLocaleDateString("es-AR")}
              </div>
            )}
            {lead.fecha_firma_contrato && (
              <div className="text-muted-foreground">
                <span className="font-medium text-card-foreground">Firma contrato:</span>{" "}
                {new Date(lead.fecha_firma_contrato).toLocaleDateString("es-AR")}
              </div>
            )}
            {lead.fecha_limite_pago_total && (
              <div className="text-muted-foreground">
                <span className="font-medium text-card-foreground">Limite pago:</span>{" "}
                {new Date(lead.fecha_limite_pago_total).toLocaleDateString("es-AR")}
              </div>
            )}
          </div>

          {/* Status change */}
          <div className="mb-4">
            {!showStatusChange ? (
              <button
                onClick={() => setShowStatusChange(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity sm:w-auto sm:py-1.5"
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
                  <button onClick={handleStatusChange} disabled={submitting} className="flex-1 rounded-md bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed sm:flex-none sm:py-1.5">{submitting ? "Guardando..." : "Confirmar"}</button>
                  <button onClick={() => setShowStatusChange(false)} className="flex-1 rounded-md border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary sm:flex-none sm:py-1.5">Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
            {["timeline", "interacciones", "propuestas"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "shrink-0 whitespace-nowrap px-3 py-2 text-xs font-medium border-b-2 transition-colors capitalize",
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
                    <div className="text-xs text-muted-foreground">
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
                        <span className="font-medium">{item.data.canal || item.data.tipo}</span>
                        {item.data.direction && (
                          <span className={cn(
                            "ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            item.data.direction === "OUT" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {item.data.direction === "OUT" ? "→" : "←"}
                          </span>
                        )}
                        {": "}{item.data.descripcion}
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
                <div className="flex flex-wrap gap-2">
                  <select
                    value={intForm.canal}
                    onChange={(e) => setIntForm((p) => ({ ...p, canal: e.target.value }))}
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {["WhatsApp", "Llamada", "Email", "Presencial"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="flex rounded-md border border-input overflow-hidden">
                    {["OUT", "IN"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setIntForm((p) => ({ ...p, direction: d }))}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium transition-colors",
                          intForm.direction === d
                            ? d === "OUT" ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"
                            : "bg-card text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {d === "OUT" ? "→ Saliente" : "← Entrante"}
                      </button>
                    ))}
                  </div>
                  <input
                    value={intForm.descripcion}
                    onChange={(e) => setIntForm((p) => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Descripcion de la interaccion..."
                    className="flex-1 min-w-[140px] rounded-md border border-input bg-card px-2 py-1.5 text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button type="submit" className="w-full rounded-md bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 sm:w-auto sm:self-end sm:py-1">Agregar</button>
              </form>
              {interactions.map((i) => {
                const canal = i.canal || i.tipo || "—"
                const direction = i.direction
                return (
                  <div key={i.id} className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-card-foreground">{canal}</span>
                        {direction && (
                          <span className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            direction === "OUT" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {direction === "OUT" ? "→ Saliente" : "← Entrante"}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{new Date(i.fecha).toLocaleDateString("es-AR")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{i.descripcion}</p>
                    </div>
                  </div>
                )
              })}
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

// Modal "Ver más" del kanban: listado completo de una columna con búsqueda y paginado 10/20
function KanbanColumnModal({ state, leads, onClose, onOpenLead }) {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  useEffect(() => { setPage(1) }, [q, pageSize])
  const list = useMemo(() => {
    const s = q.toLowerCase().trim()
    if (!s) return leads
    return leads.filter((l) => l.nombre.toLowerCase().includes(s) || (l.tipo_evento || "").toLowerCase().includes(s))
  }, [leads, q])
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const rows = list.slice((page - 1) * pageSize, page * pageSize)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative z-10 mx-3 flex max-h-[90dvh] w-full max-w-lg flex-col rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-bold text-card-foreground">
            {state} <span className="font-normal text-muted-foreground">— {leads.length}</span>
          </h3>
          <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-secondary" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-md border border-input bg-card px-2 py-2 text-xs text-card-foreground">
            {[5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sin resultados</p>}
          {rows.map((lead, i) => (
            <button
              key={lead.id}
              onClick={() => onOpenLead(lead)}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted/50 last:border-0"
            >
              <span className="w-6 shrink-0 text-xs text-muted-foreground">{(page - 1) * pageSize + i + 1}</span>
              {lead.es_historico && <span title="Lead histórico" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">H</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-card-foreground">{lead.nombre}</span>
                <span className="block truncate text-xs text-muted-foreground">{lead.tipo_evento}{lead.canal_origen ? ` · ${lead.canal_origen}` : ""}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-primary">${(lead.valor_estimado || 0).toLocaleString()}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>{list.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, list.length)} de ${list.length}` : "0 de 0"}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border border-border px-3 py-2 font-medium text-foreground hover:bg-secondary disabled:opacity-40">Anterior</button>
            <span>{page}/{totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-md border border-border px-3 py-2 font-medium text-foreground hover:bg-secondary disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeadsView() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [filterState, setFilterState] = useState("")
  const [filterChannel, setFilterChannel] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [detailLead, setDetailLead] = useState(null)
  const [viewMode, setViewMode] = useState("table")
  const [expandedLeadIds, setExpandedLeadIds] = useState(new Set())
  const [calendarDates, setCalendarDates] = useState([])
  const [soloHistoricos, setSoloHistoricos] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5) // 5 por defecto: en móvil es lo cómodo
  // Kanban: 5 visibles por columna, "Ver más" expande la columna; en móvil una columna por vez (pestañas)
  const KANBAN_VISIBLE = 5
  const [kanbanModal, setKanbanModal] = useState(null) // estado (columna) abierto con "Ver más"
  const kanbanDrag = useRef(null) // arrastre del tablero con el mouse (en touch scrollea nativo)

  // Cualquier cambio de filtro o de tamaño de página vuelve a la página 1
  useEffect(() => { setPage(1) }, [search, filterYear, filterState, filterChannel, soloHistoricos, pageSize])

  function toggleExpand(id) {
    setExpandedLeadIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function loadLeads() {
    try {
      const [data, calDates] = await Promise.all([fetchLeads(), fetchCalendarDates()])
      setLeads(data)
      setCalendarDates(calDates)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadLeads() }, [])

  async function handleRefresh() {
    await loadLeads()
  }

  const filteredLeads = useMemo(() => {
    let result = leads
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.nombre.toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q) ||
          (l.telefono || "").includes(q)
      )
    }
    if (filterYear) result = result.filter((l) => String(l.anio_evento) === filterYear)
    if (filterState) result = result.filter((l) => l.estado_actual === filterState)
    if (filterChannel) result = result.filter((l) => l.canal_origen === filterChannel)
    if (soloHistoricos) result = result.filter((l) => l.es_historico)
    return result
  }, [leads, search, filterYear, filterState, filterChannel, soloHistoricos])

  async function handleCreate(formData) {
    try {
      await apiCreateLead(formData)
      setShowForm(false)
      await loadLeads()
      toast.success("Lead creado exitosamente")
    } catch (err) { console.error(err); toast.error("Error al crear lead") }
  }

  async function handleUpdate(formData) {
    if (editLead) {
      try {
        await apiUpdateLead(editLead.id, formData)
        setEditLead(null)
        await loadLeads()
        toast.success("Lead actualizado")
      } catch (err) { console.error(err); toast.error("Error al actualizar lead") }
    }
  }

  async function handleDelete(id) {
    toast("Eliminar este lead y toda su informacion asociada?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await apiDeleteLead(id)
            if (detailLead?.id === id) setDetailLead(null)
            await loadLeads()
            toast.success("Lead eliminado")
          } catch (err) { console.error(err); toast.error("Error al eliminar lead") }
        },
      },
      cancel: { label: "Cancelar" },
    })
  }

  const years = useMemo(() => {
    const y = new Set(leads.map((l) => l.anio_evento))
    return [...y].sort()
  }, [leads])

  // Columnas del kanban: sin "Perdido", cada una ordenada por último movimiento (más reciente arriba)
  const kanbanCols = useMemo(() => {
    const ts = (l) => new Date(l.updated_at || l.created_at || 0).getTime()
    return LEAD_STATES.filter((s) => s !== "Perdido").map((state) => ({
      state,
      leads: filteredLeads.filter((l) => l.estado_actual === state).sort((a, b) => ts(b) - ts(a)),
    }))
  }, [filteredLeads])

  const totalHistoricos = leads.filter((l) => l.es_historico).length
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const pageLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize)
  // Se renderiza arriba y abajo de la lista
  const paginacion = filteredLeads.length > 0 && (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Ver
        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
          className="rounded-md border border-input bg-card px-2 py-1.5 text-xs text-card-foreground">
          {[5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>· {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredLeads.length)} de {filteredLeads.length}</span>
      </label>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-40">
          Anterior
        </button>
        <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-40">
          Siguiente
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando leads...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM Leads</h1>
          <p className="text-sm text-muted-foreground">Gestion del pipeline comercial</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            onClick={() => setViewMode(viewMode === "table" ? "kanban" : "table")}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            {viewMode === "table" ? "Vista Kanban" : "Vista Tabla"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity sm:flex-none sm:py-2"
          >
            <Plus className="h-4 w-4" /> Nuevo Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[200px] sm:max-w-xs">
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
        <button
          type="button"
          onClick={() => setSoloHistoricos((v) => !v)}
          className={cn(
            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
            soloHistoricos
              ? "border-orange-500 bg-orange-500 text-white"
              : "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
          )}
        >
          Históricos ({totalHistoricos})
        </button>
      </div>

      {/* Create/Edit form modal */}
      {(showForm || editLead) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => { setShowForm(false); setEditLead(null) }} />
          <div className="relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg mx-4">
            <h3 className="text-lg font-bold text-card-foreground mb-4">
              {editLead ? "Editar Lead" : "Nuevo Lead"}
            </h3>
            <LeadForm
              initial={editLead || undefined}
              onSubmit={editLead ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditLead(null) }}
              calendarDates={calendarDates}
            />
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <>
          {paginacion}

          {/* Mobile: cards expandibles */}
          <div className="flex flex-col gap-2 md:hidden">
            {filteredLeads.length === 0 && (
              <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                No hay leads que coincidan con los filtros
              </div>
            )}
            {pageLeads.map((lead) => {
              const isExpanded = expandedLeadIds.has(lead.id)
              return (
                <div key={lead.id} className="rounded-lg border border-border bg-card overflow-hidden">
                  {/* Header siempre visible */}
                  <button
                    onClick={() => toggleExpand(lead.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-1.5 font-medium text-card-foreground">
                        {lead.es_historico && <span title="Lead histórico" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">H</span>}
                        <span className="truncate">{lead.nombre}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{lead.tipo_evento || "Sin tipo"}{lead.canal_origen ? ` · ${lead.canal_origen}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", STATE_COLORS[lead.estado_actual])}>
                        {lead.estado_actual}
                      </span>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                    </div>
                  </button>
                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 px-4 py-3 flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                        {lead.telefono && (
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Teléfono</span>
                            <span className="text-foreground font-medium">{lead.telefono}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Email</span>
                            <span className="text-foreground font-medium truncate">{lead.email}</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Valor de Seña</span>
                          <span className="text-foreground font-semibold">${(lead.valor_estimado || 0).toLocaleString()}</span>
                        </div>
                        {lead.fecha_tentativa && (
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Fecha tentativa</span>
                            <span className="text-foreground font-medium">{lead.fecha_tentativa.substring(0, 10)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setDetailLead(lead)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver detalle
                        </button>
                        <button
                          onClick={() => { setEditLead(lead); setShowForm(true) }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="flex items-center justify-center rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground hidden md:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground hidden lg:table-cell">Canal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-foreground hidden lg:table-cell">Seña</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay leads que coincidan con los filtros</td>
                  </tr>
                )}
                {pageLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailLead(lead)} className="text-left">
                        <p className="flex items-center gap-1.5 font-medium text-card-foreground">
                          {lead.es_historico && <span title="Lead histórico" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">H</span>}
                          {lead.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">{lead.email || lead.telefono}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.tipo_evento}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{lead.canal_origen}</td>
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
                        <button onClick={() => { setEditLead(lead); setShowForm(true) }} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors" aria-label="Editar">
                          <Pencil className="h-4 w-4" />
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

          {paginacion}
        </>
      )}

      {/* Kanban View: 5 visibles por columna + contador + "Ver más" (modal). Columnas en todos los tamaños;
          en touch scrollea nativo hacia los lados y arriba/abajo, con mouse se arrastra manteniendo apretado. */}
      {viewMode === "kanban" && (() => {
        const card = (lead) => (
          <button
            key={lead.id}
            onClick={() => setDetailLead(lead)}
            className="w-full rounded-md border border-border bg-card p-3 text-left hover:shadow-md transition-shadow"
          >
            <p className="flex items-center gap-1.5 text-sm font-medium text-card-foreground">
              {lead.es_historico && <span title="Lead histórico" className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">H</span>}
              {lead.nombre}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{lead.tipo_evento}</p>
            <p className="text-xs font-semibold text-primary mt-1">${(lead.valor_estimado || 0).toLocaleString()}</p>
          </button>
        )
        // Arrastre con mouse: mueve el tablero a los lados y el contenido principal arriba/abajo
        const onDown = (e) => {
          if (e.pointerType !== "mouse" || e.button !== 0) return
          const main = e.currentTarget.closest("main")
          kanbanDrag.current = { x: e.clientX, y: e.clientY, left: e.currentTarget.scrollLeft, top: main ? main.scrollTop : 0, main, moved: false }
        }
        const onMove = (e) => {
          const d = kanbanDrag.current
          if (!d) return
          const dx = e.clientX - d.x, dy = e.clientY - d.y
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true
          e.currentTarget.scrollLeft = d.left - dx
          if (d.main) d.main.scrollTop = d.top - dy
        }
        const onUp = () => { const d = kanbanDrag.current; if (d) setTimeout(() => { kanbanDrag.current = null }, 0) }
        const onClickCapture = (e) => { if (kanbanDrag.current?.moved) { e.stopPropagation(); e.preventDefault() } }
        return (
          <div
            className="flex gap-3 overflow-x-auto pb-4 items-stretch cursor-grab active:cursor-grabbing select-none"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            onPointerCancel={onUp}
            onClickCapture={onClickCapture}
          >
            {kanbanCols.map((c) => {
              const visible = c.leads.slice(0, KANBAN_VISIBLE)
              const hidden = c.leads.length - visible.length
              return (
                <div key={c.state} className="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-secondary/50">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                    <span className="text-xs font-semibold text-foreground">{c.state}</span>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary">{c.leads.length}</span>
                  </div>
                  {/* Altura fija de 5 tarjetas, tenga 1 o 3 */}
                  <div className="flex min-h-[29.5rem] flex-col gap-2 p-2">
                    {visible.map(card)}
                    {c.leads.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Sin leads</p>}
                    {hidden > 0 && (
                      <button onClick={() => setKanbanModal(c.state)} className="mt-auto rounded-md py-2.5 text-xs font-medium text-primary hover:bg-primary/10">
                        Ver {hidden} más →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Detail Slideout */}
      {detailLead && (
        <LeadDetail lead={detailLead} onClose={() => setDetailLead(null)} onRefresh={handleRefresh} />
      )}

      {/* Kanban: "Ver más" de una columna */}
      {kanbanModal && (
        <KanbanColumnModal
          state={kanbanModal}
          leads={kanbanCols.find((c) => c.state === kanbanModal)?.leads || []}
          onClose={() => setKanbanModal(null)}
          onOpenLead={(lead) => setDetailLead(lead)}
        />
      )}
    </div>
  )
}
