"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { TrendingUp, Users, MessageSquare, DollarSign } from "lucide-react"
import { fetchLeads, fetchEvents, fetchPayments, fetchAllInteractions, LEAD_STATES } from "@/lib/api"

const TABS = [
  { id: "pipeline", label: "Pipeline", icon: TrendingUp },
  { id: "finanzas", label: "Finanzas", icon: DollarSign },
  { id: "comunicaciones", label: "Comunicaciones", icon: MessageSquare },
]

const PIPELINE_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#7c3aed", "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
]

const PAGO_PIE_COLORS = {
  Pendiente: "#f87171",
  Parcial: "#fbbf24",
  Completo: "#34d399",
}

const CANAL_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"]

function fmt(n) {
  if (!n && n !== 0) return "$0"
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${Number(n).toLocaleString("es-AR")}`
}

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  const bgMap = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    amber: "bg-amber-100",
    red: "bg-red-100",
    purple: "bg-purple-100",
  }
  const iconMap = {
    blue: "text-blue-700",
    green: "text-green-700",
    amber: "text-amber-700",
    red: "text-red-700",
    purple: "text-purple-700",
  }
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
      <div className={`rounded-full p-2 ${bgMap[color]}`}>
        <Icon className={`h-4 w-4 ${iconMap[color]}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

// ─── TAB PIPELINE ─────────────────────────────────────────────────────────────
function PipelineTab({ leads }) {
  const byState = useMemo(() => {
    const map = {}
    LEAD_STATES.forEach((s) => { map[s] = 0 })
    leads.forEach((l) => { if (map[l.estado_actual] !== undefined) map[l.estado_actual]++ })
    return map
  }, [leads])

  const funnelData = LEAD_STATES.map((s) => ({ name: s, value: byState[s] || 0 })).filter((d) => d.value > 0)

  const total = leads.length
  const perdidos = leads.filter((l) => l.estado_actual === "Perdido").length
  const clientesActivos = leads.filter((l) =>
    ["Contrato firmado", "Cliente activo", "Evento realizado", "Post-evento / cerrado"].includes(l.estado_actual)
  ).length
  const tasa = total > 0 ? ((clientesActivos / total) * 100).toFixed(1) : "0"

  // Motivos de pérdida agrupados
  const motivosMap = useMemo(() => {
    const map = {}
    leads
      .filter((l) => l.estado_actual === "Perdido")
      .forEach((l) => {
        const m = l.notas || "Sin motivo"
        map[m] = (map[m] || 0) + 1
      })
    // Intentar extraer motivo de historial si está disponible (normalmente no viene en lista)
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.length > 30 ? name.substring(0, 30) + "…" : name, value }))
  }, [leads])

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Total leads" value={total} color="blue" />
        <StatCard icon={TrendingUp} label="Tasa conversión" value={`${tasa}%`} sub="contrato o más" color="green" />
        <StatCard icon={Users} label="En pipeline activo" value={leads.filter((l) => !["Perdido", "Post-evento / cerrado"].includes(l.estado_actual)).length} color="purple" />
        <StatCard icon={Users} label="Perdidos" value={perdidos} sub={`${total > 0 ? ((perdidos / total) * 100).toFixed(1) : 0}% del total`} color="red" />
      </div>

      {/* Funnel por estado */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Leads por estado del pipeline</h3>
        {funnelData.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fontSize: 10 }}
              />
              <Tooltip formatter={(v) => [`${v} leads`, "Cantidad"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={PIPELINE_COLORS[i % PIPELINE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Motivos de pérdida */}
      {motivosMap.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Leads perdidos — notas frecuentes</h3>
          <div className="flex flex-col gap-2">
            {motivosMap.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-xs font-bold text-muted-foreground">{m.value}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${(m.value / (motivosMap[0]?.value || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TAB FINANZAS ──────────────────────────────────────────────────────────────
function FinanzasTab({ events, payments }) {
  const totalFacturado = useMemo(
    () => events.reduce((s, e) => s + (e.valor_total_evento || 0), 0),
    [events]
  )

  const totalCobrado = useMemo(() => {
    return payments
      .filter((p) => p.estado === "confirmado")
      .reduce((s, p) => p.tipo === "devolucion" ? s - p.monto : s + p.monto, 0)
  }, [payments])

  const saldoPendiente = totalFacturado - totalCobrado

  // Por tipo de evento
  const porTipo = useMemo(() => {
    const map = {}
    events.forEach((e) => {
      const tipo = e.lead?.tipo_evento || e.tipo_evento || "Otro"
      map[tipo] = (map[tipo] || 0) + (e.valor_total_evento || 0)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [events])

  // Por mes (últimos 12 meses)
  const porMes = useMemo(() => {
    const map = {}
    events.forEach((e) => {
      if (!e.fecha_confirmada || !e.valor_total_evento) return
      const d = new Date(e.fecha_confirmada.toString().substring(0, 10) + "T12:00:00")
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      map[key] = (map[key] || 0) + e.valor_total_evento
    })
    return Object.entries(map)
      .sort()
      .slice(-12)
      .map(([key, value]) => ({ name: key.substring(5) + "/" + key.substring(0, 4), value }))
  }, [events])

  // Estado de cobros
  const byEstadoPago = useMemo(() => {
    const map = { Pendiente: 0, Parcial: 0, Completo: 0 }
    events.forEach((e) => {
      const k = e.estado_pago || "Pendiente"
      if (map[k] !== undefined) map[k]++
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [events])

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={DollarSign} label="Total facturado" value={fmt(totalFacturado)} sub={`${events.length} eventos`} color="blue" />
        <StatCard icon={TrendingUp} label="Total cobrado" value={fmt(totalCobrado)} sub="pagos confirmados" color="green" />
        <StatCard icon={DollarSign} label="Saldo pendiente" value={fmt(saldoPendiente)} sub="por cobrar" color={saldoPendiente > 0 ? "amber" : "green"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Por mes */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Facturado por mes</h3>
          {porMes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos de fechas en eventos</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porMes}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [fmt(v), "Facturado"]} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por tipo evento */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Facturado por tipo de evento</h3>
          {porTipo.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={porTipo}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {porTipo.map((_, i) => (
                    <Cell key={i} fill={CANAL_COLORS[i % CANAL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [fmt(v), "Facturado"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabla estado cobros */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Estado de cobros por evento</h3>
        <div className="flex gap-6 mb-4">
          {byEstadoPago.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: PAGO_PIE_COLORS[s.name] || "#94a3b8" }}
              />
              <span className="text-muted-foreground">{s.name}:</span>
              <span className="font-semibold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin eventos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">Lead</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground">Total</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">Estado pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary/20">
                    <td className="px-2 py-2 font-medium text-foreground">{e.lead?.nombre || "—"}</td>
                    <td className="px-2 py-2 text-muted-foreground">{e.fecha_confirmada ? e.fecha_confirmada.toString().substring(0, 10) : "—"}</td>
                    <td className="px-2 py-2 text-right font-semibold text-foreground">{fmt(e.valor_total_evento)}</td>
                    <td className="px-2 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: e.estado_pago === "Completo" ? "#d1fae5" : e.estado_pago === "Parcial" ? "#fef3c7" : "#fee2e2",
                          color: e.estado_pago === "Completo" ? "#065f46" : e.estado_pago === "Parcial" ? "#92400e" : "#991b1b",
                        }}
                      >
                        {e.estado_pago || "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TAB COMUNICACIONES ────────────────────────────────────────────────────────
function ComunicacionesTab({ interactions }) {
  const total = interactions.length

  const porCanal = useMemo(() => {
    const map = {}
    interactions.forEach((i) => {
      const c = i.canal || i.tipo || "Otro"
      map[c] = (map[c] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [interactions])

  const inCount = interactions.filter((i) => i.direction === "IN").length
  const outCount = interactions.filter((i) => i.direction === "OUT").length
  const inOutData = [
    { name: "Entrante (IN)", value: inCount },
    { name: "Saliente (OUT)", value: outCount },
  ].filter((d) => d.value > 0)

  const canalTop = porCanal[0]?.name || "—"

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={MessageSquare} label="Total interacciones" value={total} color="blue" />
        <StatCard icon={MessageSquare} label="Entrantes (IN)" value={inCount} sub={total > 0 ? `${((inCount / total) * 100).toFixed(0)}%` : "0%"} color="green" />
        <StatCard icon={MessageSquare} label="Salientes (OUT)" value={outCount} sub={total > 0 ? `${((outCount / total) * 100).toFixed(0)}%` : "0%"} color="purple" />
        <StatCard icon={MessageSquare} label="Canal principal" value={canalTop} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Por canal */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Interacciones por canal</h3>
          {porCanal.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porCanal} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}`, "Interacciones"]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {porCanal.map((_, i) => (
                    <Cell key={i} fill={CANAL_COLORS[i % CANAL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* IN vs OUT */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Ratio Entrante / Saliente</h3>
          {inOutData.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos de dirección</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={inOutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#6366f1" />
                </Pie>
                <Tooltip formatter={(v) => [`${v}`, "Interacciones"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ReportsView() {
  const [activeTab, setActiveTab] = useState("pipeline")
  const [leads, setLeads] = useState([])
  const [events, setEvents] = useState([])
  const [payments, setPayments] = useState([])
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const [leadsRes, eventsRes, paymentsRes, interactionsRes] = await Promise.allSettled([
        fetchLeads(),
        fetchEvents(),
        fetchPayments(),
        fetchAllInteractions(),
      ])
      if (leadsRes.status === "fulfilled") setLeads(leadsRes.value)
      if (eventsRes.status === "fulfilled") setEvents(eventsRes.value)
      if (paymentsRes.status === "fulfilled") setPayments(paymentsRes.value)
      if (interactionsRes.status === "fulfilled") setInteractions(interactionsRes.value)
    } catch (err) {
      console.error(err)
      toast.error("Error al cargar datos de reportes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Cargando reportes...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">Análisis de pipeline, finanzas y comunicaciones</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === "pipeline" && <PipelineTab leads={leads} />}
      {activeTab === "finanzas" && <FinanzasTab events={events} payments={payments} />}
      {activeTab === "comunicaciones" && <ComunicacionesTab interactions={interactions} />}
    </div>
  )
}
