"use client"

import { useState, useEffect } from "react"
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
  const [stats, setStats] = useState(null)
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
        ])
        const [leadsTodos, calendar, tasks, events, proposals, alertas] = results.map(r => r.status === 'fulfilled' ? r.value : [])

        // Alertas (≤30 días): próximas para la campanita y saldo por cobrar para la tarjeta
        const conSaldo = alertas.filter((a) => (a.saldo || 0) > 0)
        const porCobrar = conSaldo.reduce((acc, a) => acc + a.saldo, 0)
        const alertas7 = alertas.filter((a) => a.dias <= 7).length

        // Cartera histórica (cargada ya firmada en la puesta en marcha): fuera de conversión y pipeline.
        const histIds = new Set(leadsTodos.filter((l) => l.es_historico).map((l) => l.id))
        const leads = leadsTodos.filter((l) => !histIds.has(l.id))
        const eventsOperativos = events.filter((e) => !histIds.has(e.lead_id))

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

        setStats({
          totalLeads: leadsTodos.length,
          historicos: histIds.size,
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
        })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    loadStats()
  }, [])

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

        {/* Campanita: resumen de las próximas alertas + "Ver más" a la vista de Alertas */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setBellOpen((v) => !v)}
            className="relative rounded-full border border-border bg-card p-2.5 text-foreground hover:bg-secondary"
            aria-label="Alertas próximas"
          >
            <Bell className="h-5 w-5" />
            {stats.alertas7 > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                {stats.alertas7}
              </span>
            )}
          </button>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-sm font-semibold text-card-foreground">Próximas alertas</span>
                  <span className="text-xs text-muted-foreground">{stats.alertas.length} en 30 días</span>
                </div>
                {stats.alertas.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No hay eventos en los próximos 30 días.</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto">
                    {stats.alertas.slice(0, 5).map((a) => (
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
          value={"$" + (stats.porCobrar / 1000).toFixed(0) + "k"}
          sublabel={stats.eventosConSaldo > 0 ? `${stats.eventosConSaldo} evento(s) con saldo · ${stats.alertas7} en 7 días` : "Sin saldos pendientes"}
          color={stats.alertas7 > 0 && stats.porCobrar > 0 ? "#ef4444" : "#f59e0b"}
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
    </div>
  )
}
