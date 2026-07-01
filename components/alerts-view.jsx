"use client"

import { useState, useEffect } from "react"
import { Bell, CalendarClock, DollarSign, PartyPopper, Phone, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { fetchAlerts } from "@/lib/api"
import { BUCKETS } from "@/lib/alerts"

const BUCKET_STYLE = {
  vencido: { ring: "border-red-300 bg-red-50", chip: "bg-red-600 text-white", icon: AlertTriangle },
  d7: { ring: "border-orange-300 bg-orange-50", chip: "bg-orange-500 text-white", icon: CalendarClock },
  d15: { ring: "border-amber-300 bg-amber-50", chip: "bg-amber-500 text-white", icon: CalendarClock },
  d30: { ring: "border-sky-300 bg-sky-50", chip: "bg-sky-500 text-white", icon: CalendarClock },
}
const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })
const fmtFecha = (f) => f ? new Date(f.toString().substring(0, 10) + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" }) : "—"
const diasTxt = (d) => d < 0 ? `hace ${Math.abs(d)} día(s)` : d === 0 ? "¡HOY!" : `en ${d} día(s)`

export default function AlertsView() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try { setAlertas(await fetchAlerts()) }
      catch (err) { console.error(err); toast.error("Error al cargar alertas") }
      finally { setLoading(false) }
    })()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground">Eventos próximos para organizar compras, armado y cobranza</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Bell className="mb-2 h-10 w-10 opacity-30" />
          <p className="text-sm">No hay eventos en los próximos 30 días.</p>
        </div>
      ) : (
        BUCKETS.map(b => {
          const items = alertas.filter(a => a.bucket === b.key)
          if (!items.length) return null
          const style = BUCKET_STYLE[b.key]
          const Icon = style.icon
          return (
            <div key={b.key}>
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", style.chip)}>
                  <Icon className="h-3.5 w-3.5" /> {b.label}
                </span>
                <span className="text-xs text-muted-foreground">{items.length} evento(s)</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map(a => (
                  <div key={a.event_id} className={cn("rounded-lg border p-3", style.ring)}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground">{a.cliente}</p>
                      <span className="text-xs font-semibold text-foreground">{diasTxt(a.dias)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{fmtFecha(a.fecha)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {a.servicios?.length > 0 && (
                        <span className="text-foreground">{a.servicios.join(" · ")}</span>
                      )}
                      {a.combo && (
                        <span className="flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 font-medium text-rose-800">
                          <PartyPopper className="h-3 w-3" /> {a.combo}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={cn("flex items-center gap-1 text-sm font-bold", a.saldo > 0 ? "text-red-700" : "text-green-700")}>
                        <DollarSign className="h-3.5 w-3.5" /> Saldo: {fmt(a.saldo)}
                      </span>
                      {a.telefono && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {a.telefono}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
