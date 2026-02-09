"use client"

import { useState } from "react"
import { ArrowRight, Calendar, Users, FileText, BarChart3, CheckCircle, Lock } from "lucide-react"

export default function LandingPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    // Demo credentials
    if (email === "admin@carolina.com" && password === "admin123") {
      onLogin({ name: "Carolina", email })
    } else if (email && password) {
      // Accept any non-empty credentials for demo
      onLogin({ name: email.split("@")[0], email })
    } else {
      setError("Por favor ingresa tu email y contrasena")
    }
  }

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1e1c2e" }}>
        <div className="w-full max-w-md px-6">
          <div className="flex flex-col items-center mb-10">
            <img
              src="/images/perfil/perfil_carolina_oscuro.jpg"
              alt="Carolina Eventos"
              className="w-32 h-32 rounded-2xl mb-6 object-cover"
            />
            <p className="text-sm tracking-widest uppercase" style={{ color: "#c8bfb3" }}>
              Sistema de Gestion
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium tracking-wide uppercase mb-2"
                style={{ color: "#a09888" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError("") }}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "#282637",
                  borderColor: "#3a3850",
                  color: "#f2ece6",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium tracking-wide uppercase mb-2"
                style={{ color: "#a09888" }}
              >
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                placeholder="********"
                className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "#282637",
                  borderColor: "#3a3850",
                  color: "#f2ece6",
                }}
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#e55b5b" }}>{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg text-sm font-semibold tracking-wide uppercase transition-all hover:opacity-90"
              style={{
                backgroundColor: "#f2ece6",
                color: "#1e1c2e",
              }}
            >
              Iniciar Sesion
            </button>

            <p className="text-center text-xs mt-4" style={{ color: "#6b6580" }}>
              Demo: admin@carolina.com / admin123
            </p>
          </form>

          <button
            onClick={() => setShowLogin(false)}
            className="mt-8 w-full text-center text-xs tracking-wide uppercase transition-colors hover:opacity-80"
            style={{ color: "#6b6580" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2ece6] via-[#f7f3ee] to-[#e6e0d3]">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-16 lg:py-6 bg-white/80 backdrop-blur-md shadow-sm rounded-b-2xl">
        <div className="flex items-center gap-3">
          <img
            src="/images/LOGO PIE1.1 mail.png"
            alt="Carolina Eventos"
            className="h-10 lg:h-12 object-contain drop-shadow-md"
          />
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-base font-semibold tracking-wide shadow-md bg-gradient-to-r from-[#2d2b3d] to-[#5c5650] text-[#f2ece6] hover:opacity-90 transition-all"
        >
          <Lock className="h-5 w-5" />
          Acceder
        </button>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-16 lg:py-28">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-14 items-center">
          <div className="flex-1">
            <p
              className="text-xs font-bold tracking-[0.3em] uppercase mb-6 text-[#7a7062]"
            >
              EventTech CRM
            </p>
            <h1
              className="text-5xl lg:text-7xl font-extrabold leading-tight mb-8 text-balance bg-gradient-to-r from-[#2d2b3d] via-[#5c5650] to-[#a09888] text-transparent bg-clip-text"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Tu negocio de eventos,<br className="hidden md:block" />
              <span className="font-black">organizado</span>
            </h1>
            <p
              className="text-lg lg:text-xl leading-relaxed max-w-2xl mb-10 text-[#5c5650]"
            >
              CarolinaOS centraliza leads, calendario, propuestas, reservaciones y tareas en una sola plataforma. <span className="font-semibold text-[#2d2b3d]">Diseña tu operación comercial de principio a fin.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center justify-center gap-2 px-10 py-4 rounded-full text-lg font-bold tracking-wide shadow-lg bg-gradient-to-r from-[#2d2b3d] to-[#5c5650] text-[#f2ece6] hover:scale-105 hover:opacity-90 transition-all"
              >
                Entrar al sistema
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-6 items-center">
            <div className="relative w-full max-w-md">
              <img
                src="/images/portadas/PORTADA1.jpg"
                alt="Evento Carolina 1"
                className="rounded-3xl shadow-2xl w-full object-cover border-4 border-white"
                style={{ maxHeight: 340 }}
              />
              <img
                src="/images/portadas/PORTADA2.jpg"
                alt="Evento Carolina 2"
                className="rounded-2xl shadow-lg w-2/3 object-cover border-4 border-white absolute -bottom-10 -right-10 hidden md:block"
                style={{ maxHeight: 140 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-16 lg:py-24">
        <p
          className="text-xs font-medium tracking-[0.3em] uppercase mb-12"
          style={{ color: "#7a7062" }}
        >
          Modulos
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "CRM de Leads",
              description:
                "Pipeline visual con Kanban. Registra interacciones, cambia estados con motivo y lleva el historial completo de cada prospecto.",
            },
            {
              icon: Calendar,
              title: "Calendario Unico",
              description:
                "Una sola fuente de verdad para todas tus fechas. Controla disponibilidad, bloqueos, reservas y confirmaciones.",
            },
            {
              icon: FileText,
              title: "Propuestas Versionadas",
              description:
                "Crea cotizaciones con versiones. Envia, rastrea aceptaciones y vincula propuestas directamente con cada lead.",
            },
            {
              icon: CheckCircle,
              title: "Gestion de Tareas",
              description:
                "Panel Kanban con prioridades, asignaciones y fechas limite. Automatizaciones crean tareas cuando un lead avanza.",
            },
            {
              icon: BarChart3,
              title: "Dashboard Ejecutivo",
              description:
                "Metricas clave del pipeline, eventos por mes, valor estimado, tasa de conversion y tareas vencidas en tiempo real.",
            },
            {
              icon: Lock,
              title: "Acceso Seguro",
              description:
                "Sistema de roles con permisos por modulo. Cada usuario accede solo a lo que necesita para operar.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group p-6 lg:p-8 rounded-xl transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "#ede7df" }}
            >
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-5"
                style={{ backgroundColor: "#2d2b3d" }}
              >
                <feature.icon className="h-5 w-5" style={{ color: "#f2ece6" }} />
              </div>
              <h3
                className="text-base font-semibold mb-3"
                style={{ color: "#2d2b3d" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#6b6460" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 lg:px-16 py-16 lg:py-24">
        <div
          className="rounded-2xl px-8 py-12 lg:px-16 lg:py-16"
          style={{ backgroundColor: "#2d2b3d" }}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { value: "100%", label: "Tus fechas centralizadas" },
              { value: "5", label: "Modulos integrados" },
              { value: "360", label: "Vision completa del lead" },
              { value: "24/7", label: "Acceso desde cualquier lugar" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-3xl lg:text-4xl font-light mb-2"
                  style={{ color: "#f2ece6" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs tracking-wide uppercase"
                  style={{ color: "#a09888" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-16 lg:py-24">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <img
            src="/images/perfil/perfil_carolina_oscuro.jpg"
            alt="Carolina"
            className="w-20 h-20 rounded-full mb-8 object-cover"
          />
          <h2
            className="text-2xl lg:text-4xl font-light mb-6 text-balance"
            style={{ color: "#2d2b3d" }}
          >
            Listo para organizar tu operacion
          </h2>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "#6b6460" }}
          >
            Ingresa al sistema y empieza a gestionar tus leads, fechas y eventos
            desde una sola plataforma.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wide transition-all hover:opacity-90"
            style={{
              backgroundColor: "#2d2b3d",
              color: "#f2ece6",
            }}
          >
            Iniciar Sesion
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 lg:px-16 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t"
        style={{ borderColor: "#d9d0c6" }}
      >
        <img
          src="/images/LOGO PIE1.1 mail.png"
          alt="Carolina Eventos"
          className="h-6 object-contain opacity-60"
        />
        <p className="text-xs" style={{ color: "#9a9088" }}>
          Carolina Eventos - Todos los derechos reservados
        </p>
      </footer>
    </div>
  )
}
