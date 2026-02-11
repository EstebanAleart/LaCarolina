"use client"

import { useState } from "react"
import { Lock } from "lucide-react"

export default function LoginForm({ onLogin, onSwitchToRegister, onBack }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
  e.preventDefault()
  setError("")
  setLoading(true)

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      // Si es cuenta pendiente, mostrar vista especial
      if (data.pending) {
        // Aquí podrías redirigir a la vista de pending
        // Por ahora solo mostramos el error
        setError(data.error || "Cuenta pendiente de aprobación")
      } else {
        setError(data.error || "Error al iniciar sesión")
      }
      setLoading(false)
      return
    }

    if (data.success && data.user) {
      onLogin(data.user)
    }
  } catch (err) {
    setError("Error de conexión. Intenta de nuevo.")
    setLoading(false)
  }
}
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1e1c2e" }}>
      <div className="w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-10">
          <img
            src="/images/perfil/perfil_carolina_oscuro.jpg"
            alt="Carolina Eventos"
            className="w-32 h-32 rounded-2xl mb-6 object-cover"
          />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#f2ece6" }}>
            Iniciar Sesión
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: "#c8bfb3" }}>
            Sistema de Gestión
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
              required
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
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              placeholder="********"
              required
              className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "#282637",
                borderColor: "#3a3850",
                color: "#f2ece6",
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#e55b5b" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold tracking-wide uppercase transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "#f2ece6",
              color: "#1e1c2e",
            }}
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToRegister}
            className="text-sm hover:underline"
            style={{ color: "#a09888" }}
          >
            ¿No tienes cuenta? <span style={{ color: "#f2ece6" }}>Regístrate aquí</span>
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-8 w-full text-center text-xs tracking-wide uppercase transition-colors hover:opacity-80"
          style={{ color: "#6b6580" }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}