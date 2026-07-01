"use client"

import { useState, useEffect } from "react"
import AppSidebar from "../components/app-sidebar"
import DashboardView from "../components/dashboard-view"
import LeadsView from "../components/leads-view"
import CalendarView from "../components/calendar-view"
import ProposalsView from "../components/proposals-view"
import TasksView from "../components/tasks-view"
import EventsView from "../components/events-view"
import PaymentsView from "../components/payments-view"
import StockView from "../components/stock-view"
import AlertsView from "../components/alerts-view"
import ReportsView from "../components/reports-view"
import GuideView from "../components/guide-view"
import LandingPage from "../components/landing-page"
import { Menu } from "lucide-react"

export default function Home() {
  const [user, setUser] = useState(null)
  const [activeView, setActiveView] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Check if user session exists in localStorage
    const saved = typeof window !== "undefined" ? localStorage.getItem("carolina_user") : null
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { /* ignore */ }
    }
    // Seed usuarios demo si la tabla está vacía
    fetch('/api/seed', { method: 'POST' }).catch(() => {})
    setReady(true)
  }, [])

  function handleLogin(userData) {
    setUser(userData)
    if (typeof window !== "undefined") {
      localStorage.setItem("carolina_user", JSON.stringify(userData))
    }
  }

  function handleLogout() {
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("carolina_user")
    }
  }

  if (!ready) return null
  if (!user) return <LandingPage onLogin={handleLogin} />

  function handleNavigate(view) {
    setActiveView(view)
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-50">
            <AppSidebar
              activeView={activeView}
              onNavigate={handleNavigate}
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
              user={user}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-md p-1.5 text-foreground hover:bg-secondary transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/images/perfil/perfil_carolina_oscuro.jpg" alt="Carolina" className="h-7 w-7 rounded-md object-cover" />
          <span className="text-sm font-bold text-card-foreground">CarolinaOS</span>
          <span className="ml-auto text-xs text-muted-foreground">{user.name}</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          {activeView === "dashboard" && <DashboardView />}
          {activeView === "leads" && <LeadsView />}
          {activeView === "calendar" && <CalendarView />}
          {activeView === "proposals" && <ProposalsView />}
          {activeView === "events" && <EventsView />}
          {activeView === "payments" && <PaymentsView />}
          {activeView === "stock" && <StockView />}
          {activeView === "alerts" && <AlertsView />}
          {activeView === "tasks" && <TasksView />}
          {activeView === "reports" && <ReportsView />}
          {activeView === "guide" && <GuideView />}
        </div>
      </main>
    </div>
  )
}
