"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { CreditCard, Plus, CheckCircle, XCircle, ChevronDown, ChevronUp, DollarSign, Clock, TrendingUp } from "lucide-react"
import {
  fetchPayments,
  fetchEvents,
  apiCreatePayment,
  apiUpdatePayment,
  TIPOS_PAGO,
  METODOS_PAGO,
} from "@/lib/api"

const ESTADO_COLORS = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmado: "bg-green-100 text-green-800",
  anulado: "bg-red-100 text-red-800",
}

const TIPO_COLORS = {
  seña: "bg-blue-100 text-blue-800",
  pago_parcial: "bg-indigo-100 text-indigo-800",
  pago_final: "bg-purple-100 text-purple-800",
  devolucion: "bg-orange-100 text-orange-800",
}

const TIPO_LABELS = {
  seña: "Seña",
  pago_parcial: "Pago parcial",
  pago_final: "Pago final",
  devolucion: "Devolución",
}

function fmt(n) {
  if (!n && n !== 0) return "—"
  return `$${Number(n).toLocaleString("es-AR")}`
}

function fmtFecha(f) {
  if (!f) return "—"
  const d = new Date(f + "T12:00:00")
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function PaymentsView() {
  const [payments, setPayments] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterEstado, setFilterEstado] = useState("")
  const [filterTipo, setFilterTipo] = useState("")

  const [form, setForm] = useState({
    event_id: "",
    monto: "",
    tipo: "seña",
    metodo_pago: "efectivo",
    fecha_pago: new Date().toISOString().substring(0, 10),
    estado: "pendiente",
    observacion: "",
  })

  async function loadData() {
    try {
      const [pData, eData] = await Promise.all([fetchPayments(), fetchEvents()])
      setPayments(pData)
      setEvents(eData)
    } catch (err) {
      console.error(err)
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filterEstado && p.estado !== filterEstado) return false
      if (filterTipo && p.tipo !== filterTipo) return false
      return true
    })
  }, [payments, filterEstado, filterTipo])

  // Stats globales
  const stats = useMemo(() => {
    const confirmados = payments.filter((p) => p.estado === "confirmado")
    const totalCobrado = confirmados
      .filter((p) => p.tipo !== "devolucion")
      .reduce((sum, p) => sum + (p.monto || 0), 0)
    const totalDevoluciones = confirmados
      .filter((p) => p.tipo === "devolucion")
      .reduce((sum, p) => sum + (p.monto || 0), 0)
    const totalPendiente = payments
      .filter((p) => p.estado === "pendiente")
      .reduce((sum, p) => sum + (p.monto || 0), 0)
    return {
      cobrado: totalCobrado - totalDevoluciones,
      pendiente: totalPendiente,
      cantidad: payments.length,
    }
  }, [payments])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.event_id) { toast.error("Seleccioná un evento"); return }
    const montoRaw = parseInt(String(form.monto).replace(/\./g, "").replace(/[^\d]/g, ""), 10)
    if (!montoRaw || montoRaw <= 0) { toast.error("El monto debe ser mayor a 0"); return }

    // Obtener lead_id del evento seleccionado
    const evt = events.find((ev) => ev.id === form.event_id)
    const lead_id = evt?.lead_id || evt?.lead?.id || null

    try {
      await apiCreatePayment({
        event_id: form.event_id,
        lead_id,
        monto: montoRaw,
        tipo: form.tipo,
        metodo_pago: form.metodo_pago,
        fecha_pago: form.fecha_pago,
        estado: form.estado,
        observacion: form.observacion || null,
      })
      toast.success("Pago registrado")
      setShowForm(false)
      setForm({
        event_id: "",
        monto: "",
        tipo: "seña",
        metodo_pago: "efectivo",
        fecha_pago: new Date().toISOString().substring(0, 10),
        estado: "pendiente",
        observacion: "",
      })
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error("Error al registrar pago")
    }
  }

  async function handleConfirmar(payment) {
    try {
      await apiUpdatePayment(payment.id, { estado: "confirmado" })
      toast.success("Pago confirmado")
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error("Error al confirmar pago")
    }
  }

  async function handleAnular(payment) {
    try {
      await apiUpdatePayment(payment.id, { estado: "anulado" })
      toast.success("Pago anulado")
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error("Error al anular pago")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Cargando pagos...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {payments.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Registrar pago
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2">
            <TrendingUp className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total cobrado</p>
            <p className="text-lg font-bold text-foreground">{fmt(stats.cobrado)}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2">
            <Clock className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendiente confirmar</p>
            <p className="text-lg font-bold text-foreground">{fmt(stats.pendiente)}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <DollarSign className="h-4 w-4 text-blue-700" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registros totales</p>
            <p className="text-lg font-bold text-foreground">{stats.cantidad}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="anulado">Anulado</option>
        </select>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_PAGO.map((t) => (
            <option key={t} value={t}>{TIPO_LABELS[t] || t}</option>
          ))}
        </select>
        {(filterEstado || filterTipo) && (
          <button
            onClick={() => { setFilterEstado(""); setFilterTipo("") }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de pagos */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          No hay pagos registrados
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Evento / Lead</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Monto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Método</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const leadNombre = p.event?.lead?.nombre || p.lead?.nombre || "—"
                  const tipoEvento = p.event?.lead?.tipo_evento || p.event?.tipo_evento || ""
                  return (
                    <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{leadNombre}</p>
                        {tipoEvento && (
                          <p className="text-xs text-muted-foreground">{tipoEvento}</p>
                        )}
                        {p.observacion && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">{p.observacion}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_COLORS[p.tipo] || "bg-secondary text-secondary-foreground"}`}>
                          {TIPO_LABELS[p.tipo] || p.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{fmt(p.monto)}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{p.metodo_pago || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtFecha(p.fecha_pago)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLORS[p.estado] || "bg-secondary"}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.estado === "pendiente" && (
                            <>
                              <button
                                onClick={() => handleConfirmar(p)}
                                title="Confirmar pago"
                                className="rounded p-1 text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleAnular(p)}
                                title="Anular pago"
                                className="rounded p-1 text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {p.estado === "confirmado" && (
                            <button
                              onClick={() => handleAnular(p)}
                              title="Anular pago"
                              className="rounded p-1 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: registrar pago */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Registrar pago</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Evento *</label>
                <select
                  value={form.event_id}
                  onChange={(e) => setForm((f) => ({ ...f, event_id: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  required
                >
                  <option value="">Seleccionar evento...</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.lead?.nombre || "Evento"} — {ev.fecha_confirmada ? fmtFecha(ev.fecha_confirmada) : "sin fecha"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Monto *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.monto}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\./g, "").replace(/[^\d]/g, "")
                      const num = digits !== "" ? parseInt(digits, 10) : ""
                      setForm((f) => ({ ...f, monto: digits !== "" ? num.toLocaleString("es-AR", { maximumFractionDigits: 0 }) : "" }))
                    }}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha_pago}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_pago: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {TIPOS_PAGO.map((t) => (
                      <option key={t} value={t}>{TIPO_LABELS[t] || t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Método</label>
                  <select
                    value={form.metodo_pago}
                    onChange={(e) => setForm((f) => ({ ...f, metodo_pago: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m} value={m} className="capitalize">{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado inicial</label>
                <div className="flex gap-2">
                  {["pendiente", "confirmado"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, estado: s }))}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        form.estado === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-secondary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Observación</label>
                <input
                  type="text"
                  value={form.observacion}
                  onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Opcional..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
