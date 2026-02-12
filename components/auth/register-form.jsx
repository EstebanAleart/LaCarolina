"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Check, X, Eye, EyeOff } from "lucide-react"

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin, onBack }) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Validaciones en tiempo real
  const validations = {
    nombreValid: nombre.trim().length >= 2,
    emailValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    passwordLength: password.length >= 6,
    passwordsMatch: password.length > 0 && password === confirmPassword,
  }

  const allValid = Object.values(validations).every(v => v)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    // Validar nombre
    if (!validations.nombreValid) {
      setError("El nombre debe tener al menos 2 caracteres")
      return
    }

    // Validar email formato
    if (!validations.emailValid) {
      setError("Ingresa un email válido")
      return
    }

    // Validar contraseñas coinciden
    if (!validations.passwordsMatch) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Validar longitud mínima
    if (!validations.passwordLength) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre: nombre.trim(), 
          email: email.trim(), 
          password 
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al registrarse")
        setError(data.error || "Error al registrarse")
        setLoading(false)
        return
      }

      toast.success("Cuenta creada. Pendiente de aprobacion.")
      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        onRegisterSuccess()
      }, 3000)

    } catch (err) {
      toast.error("Error de conexion")
      setError("Error de conexión. Intenta de nuevo.")
      setLoading(false)
    }
  }

  function ValidationIndicator({ isValid, label }) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {isValid ? (
          <Check className="h-4 w-4" style={{ color: "#4ade80" }} />
        ) : (
          <X className="h-4 w-4" style={{ color: "#6b6580" }} />
        )}
        <span style={{ color: isValid ? "#4ade80" : "#6b6580" }}>
          {label}
        </span>
      </div>
    )
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
            Crear Cuenta
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: "#c8bfb3" }}>
            Sistema de Gestión
          </p>
        </div>

        {/* Mensaje de éxito */}
        {success && (
          <div 
            className="p-4 rounded-lg mb-6 text-center border"
            style={{ backgroundColor: "#1e3a1e", borderColor: "#4ade80" }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: "#4ade80" }}>
              ✓ Cuenta creada exitosamente
            </p>
            <p className="text-xs" style={{ color: "#86efac" }}>
              Tu cuenta está pendiente de aprobación por un administrador
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="nombre"
              className="block text-xs font-medium tracking-wide uppercase mb-2"
              style={{ color: "#a09888" }}
            >
              Nombre Completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError("") }}
              placeholder="Carolina González"
              disabled={success}
              className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                backgroundColor: "#282637",
                borderColor: validations.nombreValid && nombre ? "#4ade80" : "#3a3850",
                color: "#f2ece6",
              }}
            />
            {nombre && (
              <div className="mt-2">
                <ValidationIndicator 
                  isValid={validations.nombreValid} 
                  label="Mínimo 2 caracteres" 
                />
              </div>
            )}
          </div>

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
              disabled={success}
              className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                backgroundColor: "#282637",
                borderColor: validations.emailValid && email ? "#4ade80" : "#3a3850",
                color: "#f2ece6",
              }}
            />
            {email && (
              <div className="mt-2">
                <ValidationIndicator 
                  isValid={validations.emailValid} 
                  label="Formato de email válido" 
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium tracking-wide uppercase mb-2"
              style={{ color: "#a09888" }}
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                placeholder="Mínimo 6 caracteres"
                disabled={success}
                className="w-full px-4 py-3 pr-12 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "#282637",
                  borderColor: validations.passwordLength && password ? "#4ade80" : "#3a3850",
                  color: "#f2ece6",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:opacity-80"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" style={{ color: "#6b6580" }} />
                ) : (
                  <Eye className="h-4 w-4" style={{ color: "#6b6580" }} />
                )}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <ValidationIndicator 
                  isValid={validations.passwordLength} 
                  label="Mínimo 6 caracteres" 
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-medium tracking-wide uppercase mb-2"
              style={{ color: "#a09888" }}
            >
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError("") }}
                placeholder="Repite tu contraseña"
                disabled={success}
                className="w-full px-4 py-3 pr-12 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "#282637",
                  borderColor: validations.passwordsMatch && confirmPassword ? "#4ade80" : "#3a3850",
                  color: "#f2ece6",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:opacity-80"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" style={{ color: "#6b6580" }} />
                ) : (
                  <Eye className="h-4 w-4" style={{ color: "#6b6580" }} />
                )}
              </button>
            </div>
            {confirmPassword && (
              <div className="mt-2">
                <ValidationIndicator 
                  isValid={validations.passwordsMatch} 
                  label="Las contraseñas coinciden" 
                />
              </div>
            )}
          </div>

          {error && (
            <div 
              className="p-3 rounded-lg text-sm text-center"
              style={{ backgroundColor: "#3a2828", color: "#e55b5b" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !allValid || success}
            className="w-full py-3 rounded-lg text-sm font-semibold tracking-wide uppercase transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: allValid && !success ? "#f2ece6" : "#3a3850",
              color: allValid && !success ? "#1e1c2e" : "#6b6580",
            }}
          >
            {loading ? "Creando cuenta..." : success ? "Cuenta creada ✓" : "Registrarse"}
          </button>
        </form>

        {!success && (
          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-sm hover:underline"
              style={{ color: "#a09888" }}
            >
              ¿Ya tienes cuenta? <span style={{ color: "#f2ece6" }}>Inicia sesión</span>
            </button>
          </div>
        )}

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