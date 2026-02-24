"use client"

import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  BookOpen,
  CreditCard,
  BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "CRM Leads", icon: Users },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "proposals", label: "Propuestas", icon: FileText },
  { id: "events", label: "Eventos", icon: Sparkles },
  { id: "payments", label: "Pagos", icon: CreditCard },
  { id: "tasks", label: "Tareas", icon: CheckSquare },
  { id: "reports", label: "Reportes", icon: BarChart2 },
  { id: "guide", label: "Guia", icon: BookOpen },
]

export default function AppSidebar({ activeView, onNavigate, collapsed, onToggle, user, onLogout }) {
  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img
          src="/images/perfil/perfil_carolina_oscuro.jpg"
          alt="Carolina Eventos"
          className="h-8 w-8 rounded-lg object-cover shrink-0"
        />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight" style={{ color: "#f2ece6" }}>
              CarolinaOS
            </span>
            <span className="text-[10px]" style={{ color: "#7a7062" }}>
              EventTech CRM
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User section */}
      {user && !collapsed && (
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0"
              style={{ backgroundColor: "#f2ece6", color: "#2d2b3d" }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "#f2ece6" }}>
                {user.name}
              </p>
              <p className="text-[10px] truncate" style={{ color: "#7a7062" }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md transition-colors hover:bg-sidebar-accent/50"
              title="Cerrar sesion"
            >
              <LogOut className="h-3.5 w-3.5" style={{ color: "#7a7062" }} />
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
