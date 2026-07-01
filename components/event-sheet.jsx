"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, DollarSign, Link2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { resumenEvento, cobradoDe } from "@/lib/services"
import {
  fetchEventServices, fetchServiceTypes, fetchCombos, fetchPaymentsByEvent,
  apiCreateEventService, apiUpdateEventService, apiDeleteEventService,
  apiCreatePayment, apiUpdatePayment,
  ESTADOS_SERVICIO, TIPOS_PAGO, METODOS_PAGO,
} from "@/lib/api"

const COLOR_MAP = {
  violet: "bg-violet-100 text-violet-800", amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800", pink: "bg-pink-100 text-pink-800",
  stone: "bg-stone-100 text-stone-800", sky: "bg-sky-100 text-sky-800",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800", emerald: "bg-emerald-100 text-emerald-800",
  indigo: "bg-indigo-100 text-indigo-800", gray: "bg-gray-100 text-gray-800",
}
const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })
const inp = "rounded-md border border-input bg-card px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"

export default function EventSheet({ event, onClose }) {
  const [services, setServices] = useState([])
  const [tipos, setTipos] = useState([])
  const [combos, setCombos] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  async function loadAll() {
    setLoading(true)
    try {
      const [svc, st, cb, pg] = await Promise.all([
        fetchEventServices(event.id), fetchServiceTypes(), fetchCombos(), fetchPaymentsByEvent(event.id),
      ])
      setServices(svc); setTipos(st); setCombos(cb); setPayments(pg)
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

  const fecha = event.fecha_confirmada
    ? new Date(event.fecha_confirmada.toString().substring(0, 10) + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    : "Sin fecha"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex w-full max-w-4xl max-h-[95vh] flex-col rounded-lg border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-base font-bold text-card-foreground">{event.lead?.nombre || "Evento"}</h2>
            <p className="text-xs text-muted-foreground">{fecha} · {event.tipo_evento || event.lead?.tipo_evento || "—"}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Resumen consolidado */}
          <div className="grid grid-cols-3 gap-3">
            <Card label="Total contratado" value={fmt(resumen.totalContratado)} />
            <Card label="Cobrado" value={fmt(resumen.cobradoTotal)} tone="green" />
            <Card label="Saldo" value={fmt(resumen.saldoTotal)} tone={resumen.saldoTotal > 0 ? "red" : "green"} />
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <>
              {/* Servicios */}
              <div className="mt-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Servicios contratados</h3>
                <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
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
                    Este evento usa el <strong>total general</strong> (sin desglose por servicio), como hasta ahora.
                    Si querés separarlo por servicio, agregá el primero (salón, tarjetas, cotillón…).
                  </p>
                )}
                {withPagos.map(svc => (
                  <ServiceCard key={svc.id} svc={svc} event={event} combos={combos} onChanged={loadAll} />
                ))}
              </div>

              {/* Pagos sin asignar */}
              {sinAsignar.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground">Pagos sin asignar a servicio</h3>
                  <p className="mb-2 text-xs text-muted-foreground">Pagos previos al desglose por servicio. Asignalos al servicio que corresponda.</p>
                  <div className="flex flex-col gap-1.5">
                    {sinAsignar.map(p => (
                      <UnassignedPayment key={p.id} p={p} services={services} tipos={tipos} onAssigned={loadAll} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ label, value, tone }) {
  return (
    <div className={cn("rounded-lg border border-border p-3",
      tone === "green" && "bg-green-50", tone === "red" && "bg-red-50")}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold",
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
        <button onClick={del} className="ml-auto rounded p-1 text-red-500 hover:bg-red-50" title="Quitar servicio"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">Total contratado</span>
          <input type="number" defaultValue={total} onBlur={(e) => { const v = Number(e.target.value) || 0; if (v !== total) setField("total_contratado", v) }} className={inp} />
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
          <div key={p.id} className="flex items-center gap-2 border-t border-border/60 py-1 text-xs">
            <span className={cn("rounded px-1.5 py-0.5",
              p.estado === "confirmado" ? "bg-green-100 text-green-700" : p.estado === "anulado" ? "bg-gray-100 text-gray-500 line-through" : "bg-amber-100 text-amber-700")}>{p.estado}</span>
            <span className="font-medium">{p.tipo === "devolucion" ? "-" : ""}{fmt(p.monto)}</span>
            <span className="text-muted-foreground">{p.tipo} · {p.metodo_pago}</span>
            <span className="ml-auto text-muted-foreground">{p.fecha_pago}</span>
          </div>
        ))}
        {showPay ? (
          <PaymentForm event={event} serviceId={svc.id} onClose={() => setShowPay(false)} onSaved={() => { setShowPay(false); onChanged() }} />
        ) : (
          <button onClick={() => setShowPay(true)} className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:underline">
            <DollarSign className="h-3 w-3" /> Registrar pago
          </button>
        )}
      </div>
    </div>
  )
}

function PaymentForm({ event, serviceId, onClose, onSaved }) {
  const [f, setF] = useState({ monto: "", tipo: "pago_parcial", metodo_pago: "efectivo", fecha_pago: new Date().toISOString().substring(0, 10) })
  const [saving, setSaving] = useState(false)
  const ch = (e) => { const { name, value } = e.target; setF(p => ({ ...p, [name]: value })) }
  async function save() {
    const monto = Number(f.monto)
    if (!monto || monto <= 0) { toast.error("Monto inválido"); return }
    setSaving(true)
    try {
      await apiCreatePayment({ event_id: event.id, service_id: serviceId, lead_id: event.lead_id, monto, tipo: f.tipo, metodo_pago: f.metodo_pago, fecha_pago: f.fecha_pago, estado: "confirmado" })
      toast.success("Pago registrado"); onSaved()
    } catch (err) { toast.error(err.message || "Error") } finally { setSaving(false) }
  }
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-secondary/40 p-2">
      <input name="monto" type="number" placeholder="Monto" value={f.monto} onChange={ch} className={cn(inp, "w-28")} />
      <select name="tipo" value={f.tipo} onChange={ch} className={inp}>{TIPOS_PAGO.map(t => <option key={t} value={t}>{t}</option>)}</select>
      <select name="metodo_pago" value={f.metodo_pago} onChange={ch} className={inp}>{METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}</select>
      <input name="fecha_pago" type="date" value={f.fecha_pago} onChange={ch} className={inp} />
      <button onClick={save} disabled={saving} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">{saving ? "…" : "Guardar"}</button>
      <button onClick={onClose} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">Cancelar</button>
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
    <div className="mt-2 flex flex-wrap items-end gap-2 rounded-md border border-dashed border-border p-2">
      <select value={f.service_type_id} onChange={(e) => setF(p => ({ ...p, service_type_id: e.target.value }))} className={inp}>
        <option value="">Tipo de servicio…</option>
        {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      {tipo?.usa_combo && (
        <select value={f.combo_id} onChange={(e) => setF(p => ({ ...p, combo_id: e.target.value }))} className={inp}>
          <option value="">Sin combo</option>
          {combos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({fmt(c.precio)})</option>)}
        </select>
      )}
      <input type="number" placeholder="Total $" value={f.total_contratado} onChange={(e) => setF(p => ({ ...p, total_contratado: e.target.value }))} className={cn(inp, "w-28")} />
      <button onClick={save} disabled={saving} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">{saving ? "…" : "Agregar"}</button>
      <button onClick={onClose} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">Cancelar</button>
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
    <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs">
      <Link2 className="h-3 w-3 text-muted-foreground" />
      <span className="font-medium">{fmt(p.monto)}</span>
      <span className="text-muted-foreground">{p.tipo} · {p.metodo_pago} · {p.fecha_pago}</span>
      <select defaultValue="" onChange={(e) => e.target.value && assign(e.target.value)} className={cn(inp, "ml-auto text-xs")}>
        <option value="">Asignar a…</option>
        {services.map(s => <option key={s.id} value={s.id}>{nombreTipo(s.id)}</option>)}
      </select>
    </div>
  )
}
