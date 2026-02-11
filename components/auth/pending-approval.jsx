"use client"

import { Mail, Clock } from "lucide-react"

export default function PendingApproval({ onBack }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1e1c2e" }}>
      <div className="w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-10">
          <img
            src="/images/perfil/perfil_carolina_oscuro.jpg"
            alt="Carolina Eventos"
            className="w-32 h-32 rounded-2xl mb-6 object-cover"
          />
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "#3a3850" }}
          >
            <Clock className="h-8 w-8" style={{ color: "#f2ece6" }} />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-center" style={{ color: "#f2ece6" }}>
            Cuenta Pendiente de Aprobación
          </h1>
          <p className="text-sm text-center leading-relaxed" style={{ color: "#c8bfb3" }}>
            Tu cuenta ha sido creada exitosamente y está siendo revisada por un administrador.
          </p>
        </div>

        <div 
          className="p-6 rounded-xl mb-8"
          style={{ backgroundColor: "#282637" }}
        >
          <div className="flex items-start gap-3 mb-4">
            <Mail className="h-5 w-5 mt-0.5" style={{ color: "#a09888" }} />
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "#f2ece6" }}>
                Te notificaremos por email
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#a09888" }}>
                Recibirás un correo cuando tu cuenta sea aprobada y puedas acceder al sistema.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-0.5" style={{ color: "#a09888" }} />
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "#f2ece6" }}>
                Tiempo de revisión
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#a09888" }}>
                Normalmente aprobamos las cuentas en 24-48 horas hábiles.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full py-3 rounded-lg text-sm font-semibold tracking-wide uppercase transition-all hover:opacity-90"
          style={{
            backgroundColor: "#3a3850",
            color: "#f2ece6",
          }}
        >
          Volver al inicio
        </button>

        <p className="text-center text-xs mt-6" style={{ color: "#6b6580" }}>
          ¿Necesitas ayuda? Contáctanos a soporte@carolina.com
        </p>
      </div>
    </div>
  )
}