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
} from "lucide-react"
import {
  fetchLeads,
  fetchCalendarDates,
  fetchTasks,
  fetchEvents,
  fetchAllProposals,
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
  "Lead nuevo":                "#94a3b8",
  "Contactado":                "#3b82f6",
  "Esperando visita":          "#0ea5e9",
  "Visita al salón realizada": "#06b6d4",
  "Enviar propuesta":          "#a855f7",
  "Propuesta enviada":         "#8b5cf6",
  "Propuesta Aceptada":        "#84cc16",
  "Propuesta Rechazada":       "#f43f5e",
  "Esperando Reserva":         "#f97316",
  "Reserva tomada":            "#f59e0b",
  "Contrato firmado":          "#10b981",
  "Cliente activo":            "#059669",
  "Evento realizado":          "#14b8a6",
  "Post-evento / cerrado":     "#6b7280",
  "Perdido":                   "#ef4444",
}

function StatCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-5">
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
    </div>
  )
}

export default function DashboardView() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const results = await Promise.allSettled([
          fetchLeads(),
          fetchCalendarDates(),
          fetchTasks(),
          fetchEvents(),
          fetchAllProposals(),
        ])
        const [leads, calendar, tasks, events, proposals] = results.map(r => r.status === 'fulfilled' ? r.value : [])

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
            ? Math.round((events.length / leads.length) * 100)
            : 0

        setStats({
          totalLeads: leads.length,
          totalEvents: events.length,
          totalValue,
          confirmedDates,
          pendingTasks,
          overdueTasks,
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Ejecutivo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vista general del estado comercial y operativo
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Leads"
          value={stats.totalLeads}
          sublabel={`${stats.conversionRate}% conversion`}
          color="#3b82f6"
        />
        <StatCard
          icon={CheckCircle2}
          label="Eventos Confirmados"
          value={stats.totalEvents}
          sublabel={`${stats.confirmedDates} fechas ocupadas`}
          color="#10b981"
        />
        <StatCard
          icon={DollarSign}
          label="Valor Estimado"
          value={"$" + (stats.totalValue / 1000).toFixed(0) + "k"}
          sublabel="Pipeline total"
          color="#8b5cf6"
        />
        <StatCard
          icon={AlertCircle}
          label="Tareas Pendientes"
          value={stats.pendingTasks}
          sublabel={stats.overdueTasks > 0 ? `${stats.overdueTasks} vencidas` : "Al dia"}
          color={stats.overdueTasks > 0 ? "#ef4444" : "#f59e0b"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline Chart */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Pipeline Comercial
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
            <p className="text-xs text-muted-foreground">Tasa de conversion</p>
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
