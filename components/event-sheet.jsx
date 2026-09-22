"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, DollarSign, Link2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import MoneyInput from "@/components/ui/money-input"
import { resumenEvento, cobradoDe } from "@/lib/services"
import {
  fetchEventServices, fetchServiceTypes, fetchCombos, fetchPaymentsByEvent, fetchTasks,
  apiCreateEventService, apiUpdateEventService, apiDeleteEventService,
  apiCreatePayment, apiUpdatePayment, apiUpdateEvent, apiUpdateTask,
  ESTADOS_SERVICIO, TIPOS_PAGO, METODOS_PAGO, CONCEPTOS_PAGO, ESTADOS_EVENTO,
} from "@/lib/api"

const COLOR_MAP = {
  violet: "bg-violet-100 text-violet-800", amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800", pink: "bg-pink-100 text-pink-800",
  stone: "bg-stone-100 text-stone-800", sky: "bg-sky-100 text-sky-800",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800", emerald: "bg-emerald-100 text-emerald-800",
  indigo: "bg-indigo-100 text-indigo-800", gray: "bg-gray-100 text-gray-800",
}
const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })
const fmtD = (d) => d ? new Date(String(d).substring(0, 10) + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"
const inp = "rounded-md border border-input bg-card px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"

// Ficha única del evento (C2-06), con pestañas: Datos · Servicios · Producción · Invitados · Pagos · Portal.
const TABS = [
  { id: "datos", label: "Datos" },
  { id: "servicios", label: "Servicios" },
  { id: "produccion", label: "Producción" },
  { id: "invitados", label: "Invitados" },
  { id: "pagos", label: "Pagos" },
  { id: "portal", label: "Portal" },
]

export default function EventSheet({ event: initialEvent, onClose }) {
  const [event, setEvent] = useState(initialEvent)
  const [tab, setTab] = useState("datos")
  const [services, setServices] = useState([])
  const [tipos, setTipos] = useState([])
  const [combos, setCombos] = useState([])
  const [payments, setPayments] = useState([])
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [payingEvent, setPayingEvent] = useState(false)

  async function loadAll() {
    setLoading(true)
    try {
      const [svc, st, cb, pg, tk] = await Promise.all([
        fetchEventServices(event.id), fetchServiceTypes(), fetchCombos(), fetchPaymentsByEvent(event.id), fetchTasks().catch(() => []),
      ])
      setServices(svc); setTipos(st); setCombos(cb); setPayments(pg)
      setTareas((tk || []).filter((t) => t.evento_id === event.id))
    } catch (err) {
      console.error(err); toast.error("Error al cargar la ficha (¿aplicaste las migraciones 002/003?)")
    } finally { setLoading(false) }
  }
  useEffect(() => { loadAll() }, [event.id])

  const pagosDe = (sid) => payments.filter(p => p.service_id === sid)
  const sinAsignar = payments.filter(p => !p.service_id)
  const withPagos = services.map(s => ({ ...s, payments: pagosDe(s.id) }))
  const sinServicios = services.length === 0
  // Fallback para eventos viejos (sin desglose): se muestra el total general de siempre.
  const resumen = sinServicios
    ? (() => {
        const total = event.valor_total_evento || 0
        const cobrado = cobradoDe(payments)
        return { porServicio: [], totalContratado: total, cobradoTotal: cobrado, cobradoSinAsignar: cobrado, saldoTotal: total - cobrado }
      })()
    : resumenEvento(withPagos, sinAsignar)

  const lead = event.lead || {}
  const titular = (event.clientes || []).find((c) => c.EventoCliente?.rol === "titular") || (event.clientes || [])[0] || null
  const fecha = event.fecha_confirmada
    ? new Date(event.fecha_confirmada.toString().substring(0, 10) + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "Sin fecha"

  async function updateEvent(data) {
    try {
      const updated = await apiUpdateEvent(event.id, data)
      setEvent((e) => ({ ...e, ...updated, lead: e.lead, clientes: e.clientes }))
      toast.success("Guardado")
    } catch (err) { toast.error(err.message || "No se pudo guardar") }
  }

  async function toggleTarea(t) {
    const estado = t.estado === "Hecho" ? "Pendiente" : "Hecho"
    try { await apiUpdateTask(t.id, { estado }); await loadAll() }
    catch (err) { toast.error(err.message || "No se pudo actualizar la tarea") }
  }

  const Row = ({ k, v }) => (
    <div className="flex flex-col gap-0.5 rounded-md border border-border/60 px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</span>
      <span className="text-sm text-card-foreground">{v || "—"}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="relative flex w-full max-w-4xl max-h-[95dvh] flex-col rounded-lg border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-card-foreground">{titular?.nombre || lead.nombre || "Evento"}</h2>
            <p className="text-xs text-muted-foreground">{fecha} · {event.tipo_evento || lead.tipo_evento || "—"}</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-2 text-muted-foreground hover:bg-secondary" aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </div>

        {/* Resumen consolidado, siempre visible */}
        <div className="grid grid-cols-3 gap-2 border-b border-border px-4 py-3 sm:px-5">
          <Card label="Contratado" value={fmt(resumen.totalContratado)} />
          <Card label="Cobrado" value={fmt(resumen.cobradoTotal)} tone="green" />
          <Card label="Saldo" value={fmt(resumen.saldoTotal)} tone={resumen.saldoTotal > 0 ? "red" : "green"} />
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border px-2 sm:px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none p-4 sm:p-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : tab === "datos" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Cliente</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Row k="Nombre" v={titular?.nombre || lead.nombre} />
                  <Row k="Teléfono" v={titular?.telefono || lead.telefono} />
                  <Row k="Email" v={titular?.email || lead.email} />
                  <Row k="Tipo de cliente" v={lead.tipo_cliente} />
                  <Row k="Canal de origen" v={lead.canal_origen} />
                  <Row k="Lead de origen" v={lead.nombre ? `${lead.nombre} · ${lead.estado_actual || ""}` : null} />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Evento</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Row k="Fecha" v={fecha} />
                  <Row k="Tipo de evento" v={event.tipo_evento || lead.tipo_evento} />
                  <Row k="Estado" v={event.estado_operativo} />
                  <Row k="Estado de pago" v={event.estado_pago} />
                  <Row k="Fecha de contratación" v={fmtD(lead.fecha_firma_contrato)} />
                  <Row k="Modalidad de precios" v={event.modalidad_actualizacion_precios} />
                  <Row k="Menú" v={event.menu_seleccionado} />
                  <Row k="Servicios contratados" v={(event.servicios_contratados || []).join(", ")} />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Comercial</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Row k="Visita al salón" v={fmtD(lead.fecha_visita_salon)} />
                  <Row k="Valor estimado" v={lead.valor_estimado ? fmt(lead.valor_estimado) : null} />
                  <div className="sm:col-span-2"><Row k="Observaciones comerciales" v={lead.notas} /></div>
                </div>
              </div>
            </div>
          ) : tab === "servicios" ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-foreground">Servicios contratados</h3>
                <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 sm:w-auto">
                  <Plus className="h-3.5 w-3.5" /> Agregar servicio
                </button>
              </div>
              {adding && (
                <AddServiceRow event={event} tipos={tipos} combos={combos}
                  onClose={() => setAdding(false)} onSaved={() => { setAdding(false); loadAll() }} />
              )}
              <div className="mt-3 flex flex-col gap-3">
                {withPagos.length === 0 && !adding && (
                  <p className="rounded-md bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                    Este evento usa el <strong>total general</strong> (sin desglose por servicio).
                    Si querés separarlo por servicio, agregá el primero (salón, tarjetas, cotillón…).
                  </p>
                )}
                {withPagos.map(svc => (
                  <ServiceCard key={svc.id} svc={svc} event={event} combos={combos} onChanged={loadAll} />
                ))}
              </div>
            </>
          ) : tab === "produccion" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Estado del evento</h3>
                <div className="flex flex-wrap gap-1.5">
                  {ESTADOS_EVENTO.map((s) => (
                    <button key={s} onClick={() => s !== event.estado_operativo && updateEvent({ estado_operativo: s })}
                      className={cn("rounded-md px-3 py-2 text-xs font-medium transition-colors",
                        event.estado_operativo === s ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground hover:bg-secondary")}>
                      {s}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">Los cambios por fecha son automáticos: a 30 días pasa a Próximo evento; al día siguiente de la fecha, a Evento realizado.</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Servicios y su preparación</h3>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin servicios cargados.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {withPagos.map((svc) => (
                      <div key={svc.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", COLOR_MAP[svc.service_type?.color] || COLOR_MAP.gray)}>{svc.service_type?.nombre}</span>
                        {svc.combo && <span className="text-xs text-muted-foreground">{svc.combo.nombre}</span>}
                        <span className="ml-auto text-xs font-medium text-foreground">{svc.estado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Tareas post-evento</h3>
                {tareas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Se generan solas cuando el evento pasa a Evento realizado.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {tareas.map((t) => (
                      <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                        <input type="checkbox" checked={t.estado === "Hecho"} onChange={() => toggleTarea(t)} className="h-4 w-4" />
                        <span className={cn("flex-1", t.estado === "Hecho" && "line-through opacity-60")}>{t.titulo.replace("[Post-evento] ", "")}</span>
                        <span className="text-xs text-muted-foreground">{fmtD(t.due_date)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : tab === "invitados" ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 rounded-md border border-border/60 px-3 py-2">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Invitados estimados</span>
                  <input type="number" defaultValue={event.invitados_estimados || 0} onBlur={(e) => { const v = Number(e.target.value) || 0; if (v !== (event.invitados_estimados || 0)) updateEvent({ invitados_estimados: v }) }} className={inp} />
                </label>
                <Row k="Mínimo de tarjetas" v={event.minimo_tarjetas} />
                <Row k="Tarjeta adulto" v={event.valor_tarjeta_adulto ? fmt(event.valor_tarjeta_adulto) : null} />
                <Row k="Tarjeta adolescente" v={event.valor_tarjeta_adolescente ? fmt(event.valor_tarjeta_adolescente) : null} />
                <Row k="Tarjeta niño" v={event.valor_tarjeta_nino ? fmt(event.valor_tarjeta_nino) : null} />
              </div>
              <p className="rounded-md bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">La distribución de mesas y la lista de invitados llegan con el portal del cliente (Ciclo 3).</p>
            </div>
          ) : tab === "pagos" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-foreground">Pagos del evento</h3>
                {!payingEvent && (
                  <button onClick={() => setPayingEvent(true)} className="flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 sm:w-auto">
                    <DollarSign className="h-3.5 w-3.5" /> Registrar pago
                  </button>
                )}
              </div>
              {payingEvent && (
                <PaymentForm event={event} serviceId={null} tipoNombre="Salón" onClose={() => setPayingEvent(false)} onSaved={() => { setPayingEvent(false); loadAll() }} />
              )}
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {[...payments].sort((a, b) => String(b.fecha_pago).localeCompare(String(a.fecha_pago))).map((p) => {
                    const svc = services.find((s) => s.id === p.service_id)
                    return (
                      <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
                        <span className={cn("rounded px-1.5 py-0.5",
                          p.estado === "confirmado" ? "bg-green-100 text-green-700" : p.estado === "anulado" ? "bg-gray-100 text-gray-500 line-through" : "bg-amber-100 text-amber-700")}>{p.estado}</span>
                        <span className="font-medium text-sm">{p.tipo === "devolucion" ? "-" : ""}{fmt(p.monto)}</span>
                        <span className="text-muted-foreground">{p.tipo} · {p.metodo_pago}{p.concepto ? ` · ${p.concepto}` : ""}</span>
                        <span className="text-muted-foreground">{svc ? svc.service_type?.nombre : "sin servicio"}</span>
                        <span className="ml-auto text-muted-foreground">{fmtD(p.fecha_pago)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {sinAsignar.length > 0 && services.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Pagos sin asignar a servicio</h3>
                  <p className="mb-2 text-xs text-muted-foreground">Asignalos al servicio que corresponda.</p>
                  <div className="flex flex-col gap-1.5">
                    {sinAsignar.map(p => (
                      <UnassignedPayment key={p.id} p={p} services={services} tipos={tipos} onAssigned={loadAll} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <p className="text-sm font-medium text-foreground">Portal del cliente</p>
              <p className="max-w-md text-sm">Esta ficha es la base del portal: el cliente va a ver acá su fecha, sus servicios, sus pagos y su saldo. Llega en el Ciclo 3.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ label, value, tone }) {
  return (
    <div className={cn("rounded-lg border border-border p-2 sm:p-3",
      tone === "green" && "bg-green-50", tone === "red" && "bg-red-50")}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-base font-bold sm:text-lg",
        tone === "green" ? "text-green-700" : tone === "red" ? "text-red-700" : "text-foreground")}>{value}</p>
    </div>
  )
}

function ServiceCard({ svc, event, combos, onChanged }) {
  const st = svc.service_type || {}
  const cobrado = (svc.payments || []).filter(p => p.estado === "confirmado")
    .reduce((a, p) => a + (p.tipo === "devolucion" ? -p.monto : p.monto), 0)
  const total = svc.total_contratado || 0
  const saldo = total - cobrado
  const [showPay, setShowPay] = useState(false)

  async function setField(field, value) {
    try { await apiUpdateEventService(svc.id, { [field]: value }); onChanged() }
    catch (err) { toast.error(err.message || "Error al actualizar") }
  }
  async function del() {
    if (!confirm(`¿Quitar el servicio ${st.nombre}? (libera el stock reservado)`)) return
    try { await apiDeleteEventService(svc.id); toast.success("Servicio quitado"); onChanged() }
    catch (err) { toast.error(err.message || "Error") }
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", COLOR_MAP[st.color] || COLOR_MAP.gray)}>{st.nombre}</span>
        <select value={svc.estado} onChange={(e) => setField("estado", e.target.value)} className={cn(inp, "text-xs")}>
          {ESTADOS_SERVICIO.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {st.usa_combo && (
          <select value={svc.combo_id || ""} onChange={(e) => setField("combo_id", e.target.value || null)} className={cn(inp, "text-xs")}>
            <option value="">Sin combo</option>
            {combos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({fmt(c.precio)})</option>)}
          </select>
        )}
        <button onClick={del} className="ml-auto rounded p-2 text-red-500 hover:bg-red-50" title="Quitar servicio"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 py-2 text-sm sm:grid-cols-3">
        <label className="col-span-2 flex flex-col gap-0.5 sm:col-span-1">
          <span className="text-[11px] text-muted-foreground">Total contratado</span>
          <MoneyInput value={total} onCommit={(v) => { const n = v || 0; if (n !== total) setField("total_contratado", n) }} className={inp} />
        </label>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">Cobrado</span>
          <span className="px-2 py-1 font-medium text-green-700">{fmt(cobrado)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">Saldo</span>
          <span className={cn("px-2 py-1 font-bold", saldo > 0 ? "text-red-700" : "text-green-700")}>{fmt(saldo)}</span>
        </div>
      </div>

      {/* Pagos del servicio */}
      <div className="px-3 pb-2">
        {(svc.payments || []).map(p => (
          <div key={p.id} className="flex flex-wrap items-center gap-2 border-t border-border/60 py-1 text-xs">
            <span className={cn("rounded px-1.5 py-0.5",
              p.estado === "confirmado" ? "bg-green-100 text-green-700" : p.estado === "anulado" ? "bg-gray-100 text-gray-500 line-through" : "bg-amber-100 text-amber-700")}>{p.estado}</span>
            <span className="font-medium">{p.tipo === "devolucion" ? "-" : ""}{fmt(p.monto)}</span>
            <span className="text-muted-foreground">{p.tipo} · {p.metodo_pago}</span>
            <span className="ml-auto text-muted-foreground">{fmtD(p.fecha_pago)}</span>
          </div>
        ))}
        {showPay ? (
          <PaymentForm event={event} serviceId={svc.id} tipoNombre={st.nombre} onClose={() => setShowPay(false)} onSaved={() => { setShowPay(false); onChanged() }} />
        ) : (
          <button onClick={() => setShowPay(true)} className="mt-1 flex items-center gap-1 py-2.5 text-xs text-primary hover:underline sm:mt-1.5 sm:py-1">
            <DollarSign className="h-3 w-3" /> Registrar pago
          </button>
        )}
      </div>
    </div>
  )
}

// Concepto del pago según el servicio: Salón → Salon, Tarjetas → Tarjeta, el resto → Otro.
const conceptoDe = (n = "") => /sal[oó]n/i.test(n) ? "Salon" : /tarjeta/i.test(n) ? "Tarjeta" : "Otro"

function PaymentForm({ event, serviceId, tipoNombre, onClose, onSaved }) {
  const [f, setF] = useState({ monto: "", tipo: "pago_parcial", metodo_pago: "efectivo", concepto: conceptoDe(tipoNombre), fecha_pago: new Date().toISOString().substring(0, 10) })
  const [saving, setSaving] = useState(false)
  const ch = (e) => { const { name, value } = e.target; setF(p => ({ ...p, [name]: value })) }
  async function save() {
    const monto = Number(f.monto)
    if (!monto || monto <= 0) { toast.error("Monto inválido"); return }
    setSaving(true)
    try {
      await apiCreatePayment({ event_id: event.id, service_id: serviceId, lead_id: event.lead_id, monto, tipo: f.tipo, metodo_pago: f.metodo_pago, concepto: f.concepto, fecha_pago: f.fecha_pago, estado: "confirmado" })
      toast.success("Pago registrado"); onSaved()
    } catch (err) { toast.error(err.message || "Error") } finally { setSaving(false) }
  }
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md bg-secondary/40 p-2 sm:flex-row sm:flex-wrap sm:items-end">
      <MoneyInput placeholder="Monto" value={f.monto} onChange={(n) => setF(p => ({ ...p, monto: n ?? "" }))} className={cn(inp, "w-full sm:w-28")} />
      <select name="tipo" value={f.tipo} onChange={ch} className={cn(inp, "w-full sm:w-auto")}>{TIPOS_PAGO.map(t => <option key={t} value={t}>{t}</option>)}</select>
      <select name="metodo_pago" value={f.metodo_pago} onChange={ch} className={cn(inp, "w-full sm:w-auto")}>{METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}</select>
      <select name="concepto" value={f.concepto} onChange={ch} className={cn(inp, "w-full sm:w-auto")}>{CONCEPTOS_PAGO.map(c => <option key={c} value={c}>{c}</option>)}</select>
      <input name="fecha_pago" type="date" value={f.fecha_pago} onChange={ch} className={cn(inp, "w-full sm:w-auto")} />
      <button onClick={save} disabled={saving} className="w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 sm:w-auto sm:py-1">{saving ? "…" : "Guardar"}</button>
      <button onClick={onClose} className="w-full rounded-md px-2 py-2 text-xs text-muted-foreground hover:bg-secondary sm:w-auto sm:py-1">Cancelar</button>
    </div>
  )
}

function AddServiceRow({ event, tipos, combos, onClose, onSaved }) {
  const [f, setF] = useState({ service_type_id: "", combo_id: "", total_contratado: "" })
  const [saving, setSaving] = useState(false)
  const tipo = tipos.find(t => t.id === f.service_type_id)
  async function save() {
    if (!f.service_type_id) { toast.error("Elegí un tipo de servicio"); return }
    setSaving(true)
    try {
      await apiCreateEventService({
        event_id: event.id, service_type_id: f.service_type_id,
        combo_id: f.combo_id || null, total_contratado: Number(f.total_contratado) || 0,
      })
      toast.success("Servicio agregado"); onSaved()
    } catch (err) { toast.error(err.message || "Error") } finally { setSaving(false) }
  }
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-dashed border-border p-2 sm:flex-row sm:flex-wrap sm:items-end">
      <select value={f.service_type_id} onChange={(e) => setF(p => ({ ...p, service_type_id: e.target.value }))} className={cn(inp, "w-full sm:w-auto")}>
        <option value="">Tipo de servicio…</option>
        {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      {tipo?.usa_combo && (
        <select value={f.combo_id} onChange={(e) => setF(p => ({ ...p, combo_id: e.target.value }))} className={cn(inp, "w-full sm:w-auto")}>
          <option value="">Sin combo</option>
          {combos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({fmt(c.precio)})</option>)}
        </select>
      )}
      <MoneyInput placeholder="Total $" value={f.total_contratado} onChange={(n) => setF(p => ({ ...p, total_contratado: n ?? "" }))} className={cn(inp, "w-full sm:w-28")} />
      <button onClick={save} disabled={saving} className="w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 sm:w-auto sm:py-1">{saving ? "…" : "Agregar"}</button>
      <button onClick={onClose} className="w-full rounded-md px-2 py-2 text-xs text-muted-foreground hover:bg-secondary sm:w-auto sm:py-1">Cancelar</button>
    </div>
  )
}

function UnassignedPayment({ p, services, tipos, onAssigned }) {
  const nombreTipo = (sid) => {
    const s = services.find(x => x.id === sid)
    const t = tipos.find(tt => tt.id === s?.service_type_id)
    return t?.nombre || "servicio"
  }
  async function assign(sid) {
    try { await apiUpdatePayment(p.id, { service_id: sid }); toast.success("Pago asignado"); onAssigned() }
    catch (err) { toast.error(err.message || "Error") }
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs">
      <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="font-medium">{fmt(p.monto)}</span>
      <span className="text-muted-foreground">{p.tipo} · {p.metodo_pago} · {fmtD(p.fecha_pago)}</span>
      <select defaultValue="" onChange={(e) => e.target.value && assign(e.target.value)} className={cn(inp, "w-full text-xs sm:ml-auto sm:w-auto")}>
        <option value="">Asignar a…</option>
        {services.map(s => <option key={s.id} value={s.id}>{nombreTipo(s.id)}</option>)}
      </select>
    </div>
  )
}
