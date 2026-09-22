"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Users,
  CalendarDays,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Bell,
  Wallet,
} from "lucide-react"
import {
  fetchLeads,
  fetchCalendarDates,
  fetchTasks,
  fetchEvents,
  fetchAllProposals,
  fetchAlerts,
  fetchPayments,
  LEAD_STATES,
} from "@/lib/api"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const PIPELINE_COLORS = {
  "Lead nuevo":         "#94a3b8",
  "Visita agendada":    "#0ea5e9",
  "Visita realizada":   "#06b6d4",
  "Reserva confirmada": "#10b981",
  "Perdido":            "#ef4444",
}

// onClick: la tarjeta lleva con un click a la vista de donde sale el dato
function StatCard({ icon: Icon, label, value, sublabel, color, onClick }) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-start gap-4 rounded-lg border border-border bg-card p-5 text-left ${onClick ? "cursor-pointer transition-shadow hover:shadow-md hover:border-primary/40" : ""}`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: color + "18", color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-card-foreground">{value}</span>
        <span className="text-sm font-medium text-card-foreground">{label}</span>
        {sublabel && (
          <span className="text-xs text-muted-foreground mt-0.5">{sublabel}</span>
        )}
      </div>
    </Tag>
  )
}

export default function DashboardView({ onNavigate }) {
  const [raw, setRaw] = useState(null)              // datos crudos; las métricas se calculan abajo
  // Vista: "operativo" (sin históricos, por defecto) · "todos" (con históricos) · "historicos" (solo la cartera anterior)
  const [modo, setModo] = useState("operativo")
  const MODOS = [
    { id: "operativo", label: "Operativo" },
    { id: "todos", label: "Con históricos" },
    { id: "comparativa", label: "Históricos vs actuales" },
  ]
  const [loading, setLoading] = useState(true)
  const [bellOpen, setBellOpen] = useState(false)
  const go = (view) => onNavigate?.(view)

  useEffect(() => {
    async function loadStats() {
      try {
        const results = await Promise.allSettled([
          fetchLeads(),
          fetchCalendarDates(),
          fetchTasks(),
          fetchEvents(),
          fetchAllProposals(),
          fetchAlerts(),
          fetchPayments(),
        ])
        const [leadsTodos, calendar, tasks, events, proposals, alertas, pagos] = results.map(r => r.status === 'fulfilled' ? r.value : [])
        setRaw({ leadsTodos, calendar, tasks, events, proposals, alertas, pagos })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    loadStats()
  }, [])

  // Métricas (sin históricos por defecto; el toggle los incluye)
  const stats = useMemo(() => {
    if (!raw) return null
        const { leadsTodos, calendar, tasks, events, proposals, alertas, pagos } = raw

        // Alertas (≤30 días): próximas para la campanita y saldo por cobrar para la tarjeta
        const conSaldo = alertas.filter((a) => (a.saldo || 0) > 0)
        const porCobrar = conSaldo.reduce((acc, a) => acc + a.saldo, 0)
        const alertas7 = alertas.filter((a) => a.dias <= 7).length

        // Cartera histórica (cargada ya firmada en la puesta en marcha): fuera de conversión y pipeline.
        const histSet = new Set(leadsTodos.filter((l) => l.es_historico).map((l) => l.id))
        // Leads excluidos de las métricas según la vista
        const histIds = modo === "todos" ? new Set() : histSet
        const leads = leadsTodos.filter((l) => !histIds.has(l.id))
        const eventsOperativos = events.filter((e) => !histIds.has(e.lead_id))

        // Resumen completo de un conjunto de leads (comparativa históricos vs actuales)
        const hoyISO = new Date().toISOString().substring(0, 10)
        const cuenta = (arr, key) => { const m = {}; arr.forEach((x) => { const k = key(x) || "—"; m[k] = (m[k] || 0) + 1 }); return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })) }
        const resumenDe = (set) => {
          const ids = new Set(set.map((l) => l.id))
          const evs = events.filter((e) => ids.has(e.lead_id))
          const evIds = new Set(evs.map((e) => e.id))
          const pg = (pagos || []).filter((x) => evIds.has(x.event_id) && x.estado === "confirmado")
          const cobrado = pg.reduce((a, x) => a + (x.tipo === "devolucion" ? -(x.monto || 0) : (x.monto || 0)), 0)
          const facturado = evs.reduce((a, e) => a + (e.valor_total_evento || 0), 0)
          const st = {}; LEAD_STATES.forEach((x) => (st[x] = 0)); set.forEach((l) => { st[l.estado_actual] = (st[l.estado_actual] || 0) + 1 })
          const perdidos = set.filter((l) => l.estado_actual === "Perdido")
          const firmados = set.filter((l) => l.fecha_firma_contrato && l.created_at)
          const dias = firmados.map((l) => (new Date(l.fecha_firma_contrato) - new Date(l.created_at)) / 86400000).filter((d) => d >= 0)
          const conInv = evs.filter((e) => e.invitados_estimados > 0)
          return {
            leads: set.length,
            eventos: evs.length,
            conversion: set.length ? Math.round((evs.length / set.length) * 100) : 0,
            perdidos: perdidos.length,
            valor: set.reduce((a, l) => a + (l.valor_estimado || 0), 0),
            facturado,
            cobrado,
            saldo: facturado - cobrado,
            ticket: evs.length ? facturado / evs.length : 0,
            invitadosProm: conInv.length ? Math.round(conInv.reduce((a, e) => a + e.invitados_estimados, 0) / conInv.length) : 0,
            diasFirma: dias.length ? Math.round(dias.reduce((a, d) => a + d, 0) / dias.length) : null,
            proximos: evs.filter((e) => String(e.fecha_confirmada || "").substring(0, 10) >= hoyISO).length,
            realizados: evs.filter((e) => String(e.fecha_confirmada || "").substring(0, 10) < hoyISO).length,
            pipelineData: LEAD_STATES.map((x) => ({ name: x.length > 14 ? x.substring(0, 12) + ".." : x, fullName: x, count: st[x] || 0, fill: PIPELINE_COLORS[x] })),
            channelData: cuenta(set, (l) => l.canal_origen),
            porTipo: cuenta(evs.length ? evs : set, (x) => x.tipo_evento || x.lead?.tipo_evento),
            porAnio: cuenta(set, (l) => l.anio_evento).sort((a, b) => String(a.name).localeCompare(String(b.name))),
            estadoPago: cuenta(evs, (e) => e.estado_pago),
            motivos: cuenta(perdidos, (l) => l.motivo_perdida || "Sin motivo"),
          }
        }
        const comparativa = {
          historicos: resumenDe(leadsTodos.filter((l) => l.es_historico)),
          actuales: resumenDe(leadsTodos.filter((l) => !l.es_historico)),
        }

        const byState = {}
        LEAD_STATES.forEach((s) => (byState[s] = 0))
        leads.forEach((l) => {
          byState[l.estado_actual] = (byState[l.estado_actual] || 0) + 1
        })

        const pipelineData = LEAD_STATES.map((s) => ({
          name: s.length > 14 ? s.substring(0, 12) + ".." : s,
          fullName: s,
          count: byState[s] || 0,
          fill: PIPELINE_COLORS[s],
        }))

        const byChannel = {}
        leads.forEach((l) => {
          byChannel[l.canal_origen] = (byChannel[l.canal_origen] || 0) + 1
        })
        const channelData = Object.entries(byChannel).map(([name, value]) => ({
          name,
          value,
        }))

        const totalValue = leads.reduce((acc, l) => acc + (l.valor_estimado || 0), 0)
        const confirmedDates = calendar.filter(
          (c) => c.estado_fecha === "Confirmada" || c.estado_fecha === "Reservada"
        ).length
        const pendingTasks = tasks.filter((t) => t.estado === "Pendiente").length
        const overdueTasks = tasks.filter(
          (t) => t.estado === "Pendiente" && t.due_date && new Date(t.due_date) < new Date()
        ).length

        const conversionRate =
          leads.length > 0
            ? Math.round((eventsOperativos.length / leads.length) * 100)
            : 0
        return {
          totalLeads: leadsTodos.length,
          historicos: histSet.size,
          modo,
          comparativa,
          totalEvents: events.length,
          totalValue,
          confirmedDates,
          alertas,
          alertas7,
          porCobrar,
          eventosConSaldo: conSaldo.length,
          conversionRate,
          pipelineData,
          channelData,
          totalProposals: proposals.length,
        }
  }, [raw, modo])
  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f97316", "#06b6d4"]

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Ejecutivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vista general del estado comercial y operativo
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
        {/* Campanita: resumen de las próximas alertas + "Ver más" a la vista de Alertas */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setBellOpen((v) => !v)}
            className="relative rounded-full border border-border bg-card p-2.5 text-foreground hover:bg-secondary"
            aria-label="Alertas próximas"
          >
            <Bell className="h-5 w-5" />
            {(stats.alertas || []).length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-card" aria-hidden="true" />
            )}
          </button>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-sm font-semibold text-card-foreground">Próximas alertas</span>
                  <span className="text-xs text-muted-foreground">{(stats.alertas || []).length} en 30 días</span>
                </div>
                {(stats.alertas || []).length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No hay eventos en los próximos 30 días.</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto">
                    {(stats.alertas || []).slice(0, 5).map((a) => (
                      <li key={a.event_id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${a.dias <= 0 ? "bg-red-600" : a.dias <= 7 ? "bg-orange-500" : "bg-sky-500"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-card-foreground">{a.cliente}</span>
                          <span className="block text-xs text-muted-foreground">
                            {new Date(String(a.fecha).substring(0, 10) + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                            {" · "}{a.dias < 0 ? `hace ${-a.dias} día(s)` : a.dias === 0 ? "hoy" : `en ${a.dias} día(s)`}
                          </span>
                        </span>
                        <span className={`shrink-0 text-xs font-semibold ${a.saldo > 0 ? "text-red-700" : "text-green-700"}`}>
                          ${Math.round(a.saldo || 0).toLocaleString("es-AR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => { setBellOpen(false); go("alerts") }}
                  className="w-full border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-secondary"
                >
                  Ver más →
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Vistas: operativo (sin históricos) · con históricos · comparativa lado a lado */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border">
        {MODOS.map((m) => (
          <button key={m.id} type="button" onClick={() => setModo(m.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${modo === m.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {m.label}
          </button>
        ))}
      </div>

      {modo === "comparativa" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel titulo="Históricos" sub="Cartera anterior a la app" r={stats.comparativa.historicos} pie={PIE_COLORS} />
          <Panel titulo="Leads actuales" sub="Operación desde la app" r={stats.comparativa.actuales} pie={PIE_COLORS} />
        </div>
      ) : (<>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Leads"
          value={stats.totalLeads}
          sublabel={`${stats.conversionRate}% conversión${stats.historicos ? ` · ${stats.historicos} históricos` : ""}`}
          color="#3b82f6"
          onClick={() => go("leads")}
        />
        <StatCard
          icon={CheckCircle2}
          label="Eventos Confirmados"
          value={stats.totalEvents}
          sublabel={`${stats.confirmedDates} fechas ocupadas`}
          color="#10b981"
          onClick={() => go("events")}
        />
        <StatCard
          icon={DollarSign}
          label="Valor Estimado"
          value={"$" + (stats.totalValue / 1000).toFixed(0) + "k"}
          sublabel="Pipeline total"
          color="#8b5cf6"
          onClick={() => go("reports")}
        />
        <StatCard
          icon={Wallet}
          label="Por cobrar (30 días)"
          value={"$" + ((stats.porCobrar || 0) / 1000).toFixed(0) + "k"}
          sublabel={stats.eventosConSaldo > 0 ? `${stats.eventosConSaldo} evento(s) con saldo · ${stats.alertas7 || 0} en 7 días` : "Sin saldos pendientes"}
          color={(stats.alertas7 || 0) > 0 && (stats.porCobrar || 0) > 0 ? "#ef4444" : "#f59e0b"}
          onClick={() => go("alerts")}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline Chart */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Pipeline Comercial
            {stats.historicos > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">sin {stats.historicos} históricos</span>}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.pipelineData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }}
                />
                <Tooltip
                  formatter={(value, name, props) => [value, props.payload.fullName]}
                  contentStyle={{
                    backgroundColor: "hsl(0,0%,100%)",
                    border: "1px solid hsl(214,20%,90%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.pipelineData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel distribution */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Leads por Canal
          </h3>
          <div className="h-64 flex items-center justify-center">
            {stats.channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.channelData.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0,0%,100%)",
                      border: "1px solid hsl(214,20%,90%)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </div>
          {stats.channelData.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {stats.channelData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {c.name} ({c.value})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <p className="text-lg font-bold text-card-foreground">{stats.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Tasa de conversión{stats.historicos ? " (sin históricos)" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <p className="text-lg font-bold text-card-foreground">{stats.totalProposals}</p>
            <p className="text-xs text-muted-foreground">Propuestas creadas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <p className="text-lg font-bold text-card-foreground">{stats.confirmedDates}</p>
            <p className="text-xs text-muted-foreground">Fechas reservadas/confirmadas</p>
          </div>
        </div>
      </div>
      </>)}
    </div>
  )
}

const TT = { backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(214,20%,90%)", borderRadius: 8, fontSize: 12 }
const fmtK = (n) => "$" + Math.round((n || 0) / 1000).toLocaleString("es-AR") + "k"

// Gráfico de barras horizontal genérico (tipo de evento, año, etc.)
function Barras({ data, color = "#6366f1", height = "h-44" }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">Sin datos</p>
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} />
          <Tooltip contentStyle={TT} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Torta genérica con leyenda
function Torta({ data, pie }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">Sin datos</p>
  return (
    <>
      <div className="flex h-44 items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={4} dataKey="value">
              {data.map((entry, i) => <Cell key={i} fill={pie[i % pie.length]} />)}
            </Pie>
            <Tooltip contentStyle={TT} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-3">
        {data.map((c, i) => (
          <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pie[i % pie.length] }} />
            {c.name} ({c.value})
          </div>
        ))}
      </div>
    </>
  )
}

// Panel de la comparativa: todos los KPIs + gráficos de un conjunto de leads
function Panel({ titulo, sub, r, pie }) {
  const Sec = ({ t, children }) => (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-card-foreground">{t}</h4>
      {children}
    </div>
  )
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-4 sm:p-5">
      <div>
        <h3 className="text-base font-bold text-card-foreground">{titulo}</h3>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Leads" value={r.leads} sublabel={`${r.perdidos} perdidos`} color="#3b82f6" />
        <StatCard icon={CheckCircle2} label="Eventos" value={r.eventos} sublabel={`${r.conversion}% conversión`} color="#10b981" />
        <StatCard icon={CalendarDays} label="Próximos" value={r.proximos} sublabel={`${r.realizados} realizados`} color="#0ea5e9" />
        <StatCard icon={Clock} label="Días hasta la firma" value={r.diasFirma ?? "—"} sublabel="promedio desde el alta" color="#8b5cf6" />
        <StatCard icon={DollarSign} label="Valor estimado" value={fmtK(r.valor)} sublabel="suma de los leads" color="#a855f7" />
        <StatCard icon={FileText} label="Facturado" value={fmtK(r.facturado)} sublabel={`ticket promedio ${fmtK(r.ticket)}`} color="#f59e0b" />
        <StatCard icon={TrendingUp} label="Cobrado" value={fmtK(r.cobrado)} sublabel="pagos confirmados" color="#059669" />
        <StatCard icon={AlertCircle} label="Saldo pendiente" value={fmtK(r.saldo)} sublabel={`${r.invitadosProm} invitados promedio`} color={r.saldo > 0 ? "#ef4444" : "#10b981"} />
      </div>

      <Sec t="Pipeline">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.pipelineData} layout="vertical" margin={{ left: 4, right: 24 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} />
              <Tooltip formatter={(v, _n, item) => [v, item?.payload?.fullName || "Leads"]} contentStyle={TT} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {r.pipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Sec>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Sec t="Canales"><Torta data={r.channelData} pie={pie} /></Sec>
        <Sec t="Estado de pago"><Torta data={r.estadoPago} pie={["#f87171", "#fbbf24", "#34d399", "#94a3b8"]} /></Sec>
      </div>

      <Sec t="Tipo de evento"><Barras data={r.porTipo} color="#6366f1" /></Sec>
      <Sec t="Año del evento"><Barras data={r.porAnio} color="#0ea5e9" height="h-32" /></Sec>

      <Sec t="Motivos de pérdida">
        {r.motivos.length === 0 ? <p className="text-sm text-muted-foreground">Sin leads perdidos</p> : (
          <div className="flex flex-col gap-1.5">
            {r.motivos.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-xs">
                <span className="w-5 font-bold text-muted-foreground">{m.value}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-red-400" style={{ width: `${(m.value / (r.motivos[0]?.value || 1)) * 100}%` }} /></div>
                <span className="max-w-[160px] truncate text-muted-foreground">{m.name}</span>
              </div>
            ))}
          </div>
        )}
      </Sec>
    </div>
  )
}
