"use client"

import { useState } from "react"
import {
  BookOpen, Users, FileText, CalendarDays, Sparkles, CreditCard, Boxes,
  LayoutDashboard, ChevronLeft, ChevronRight, Zap, ClipboardList, Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Guía paginada, paso a paso. Lenguaje simple y amigable.
const PAGES = [
  {
    icon: BookOpen, title: "Bienvenida",
    intro: "¡Hola! Esta es tu guía. Te vamos a explicar todo bien fácil, paso por paso. No hace falta saber nada de antes. Tomate tu tiempo. 🙂",
    steps: [
      "A la izquierda hay un menú con todas las secciones: Dashboard, Leads, Calendario, Contratos, Eventos, Pagos, Stock, Reportes y Guía.",
      "Para leer esta guía, usá los botones 'Anterior' y 'Siguiente' de abajo.",
      "Si querés ir directo a un tema, tocá su nombre en la fila de botones de arriba.",
      "Consejo: leé los temas en orden la primera vez. Después usás la guía solo cuando te traba algo.",
    ],
  },
  {
    icon: Users, title: "1. Leads (clientes nuevos)",
    intro: "Un 'lead' es alguien que preguntó por un evento pero todavía no contrató. Acá los anotás a todos para no perder ninguno.",
    steps: [
      "Tocá 'CRM Leads' en el menú.",
      "Tocá el botón 'Nuevo Lead'.",
      "Escribí el nombre, el teléfono, el mail, qué tipo de evento quiere y para qué fecha.",
      "Tocá guardar. ¡Listo, ya quedó anotado!",
      "Si tocás un lead, podés anotar cada vez que hablás con él (WhatsApp, llamada) y mover en qué etapa está.",
    ],
    notas: [
      "No te preocupes si no tenés todos los datos: cargá lo que tengas y después lo completás.",
      "Anotar cada charla con el cliente te ayuda a acordarte de todo. Hacelo siempre que puedas.",
    ],
  },
  {
    icon: FileText, title: "2. Contratos",
    intro: "Cuando el cliente se decide, le armás el contrato. Un mismo cliente puede tener varias versiones del contrato.",
    steps: [
      "Tocá 'Contratos' y después 'Nuevo Contrato'.",
      "Elegí de qué cliente es.",
      "Completá los datos (DNI, dirección), el precio del salón, las tarjetas y los servicios que contrata.",
      "El contrato va cambiando de etapa: Creada → Enviada → Aprobada → Firmada.",
      "Cuando lo marcás 'Firmada', el sistema crea solo el evento y reserva la fecha en el calendario. ¡No tenés que hacer nada más!",
      "El botón 'Imprimir' te abre el contrato listo para guardarlo en PDF (con los logos y la marca de agua).",
    ],
    notas: [
      "Una vez firmado, el contrato queda bloqueado para que nadie lo cambie sin querer.",
    ],
  },
  {
    icon: CalendarDays, title: "3. Calendario",
    intro: "Es el calendario del salón. De un vistazo ves qué días están libres, reservados o confirmados.",
    steps: [
      "Tocá 'Calendario'.",
      "Tocá un día para ver qué hay o para anotar algo (una reserva, una visita, etc.).",
      "Cada color significa un estado distinto (libre, reservado, confirmado, visita).",
    ],
    notas: [
      "Tranqui: el sistema no te deja poner dos clientes distintos el mismo día. Te avisa solo.",
      "Las fechas confirmadas se copian solas a Google Calendar.",
      "Si un evento tiene cotillón, ese día aparece un globito de color con el combo (C1, C2 o C3) arriba a la derecha. Así ves de un vistazo qué fiestas llevan cotillón.",
    ],
  },
  {
    icon: Sparkles, title: "4. Eventos y la Ficha del evento",
    intro: "El evento se crea solo cuando firmás el contrato. La 'Ficha del evento' es la pantalla donde ves TODA la plata de ese evento, ordenada y clara.",
    steps: [
      "Tocá 'Eventos' y después tocá el evento que querés ver.",
      "Tocá el botón negro grande: 'Ficha del evento · saldos por servicio'.",
      "Arriba ves tres números grandes: cuánto se contrató, cuánto ya pagó y cuánto falta (el saldo).",
      "Más abajo ves cada servicio por separado (salón, tarjetas, cotillón…), cada uno con su propia plata.",
      "Si un cliente te pregunta '¿cuánto debo?', mirás el número 'Saldo' de arriba y listo.",
    ],
    notas: [
      "Los eventos viejos (de antes de esta mejora) se quedan igual que siempre: la ficha te muestra el total de toda la vida, sin separar por servicio. No se tocó nada de ellos.",
      "Separar la plata por servicio es para los eventos NUEVOS de acá en adelante.",
      "¿Querés separar también un evento viejo? Solo agregale los servicios a mano dentro de la ficha. Nada se rompe.",
    ],
  },
  {
    icon: ClipboardList, title: "5. Servicios del evento",
    intro: "Cada evento puede tener varios servicios (salón, tarjetas, cotillón, decoración…). Cada uno lleva su propia cuenta, así no se mezcla la plata.",
    steps: [
      "Dentro de la Ficha del evento, tocá 'Agregar servicio'.",
      "Elegí qué servicio es (por ejemplo: Cotillón).",
      "Si es Cotillón, elegí el Combo (1, 2 o 3).",
      "Escribí cuánto se contrató por ese servicio y guardá.",
      "Cada servicio tiene su estado: Contratado → Listo → Entregado. Andá moviéndolo según avanza.",
    ],
    notas: [
      "Magia del cotillón: al elegir un combo, el sistema RESERVA solo los productos de ese combo en el stock.",
      "Cuando marcás el cotillón como 'Entregado', el sistema DESCUENTA esos productos del stock real.",
      "Si te equivocaste y quitás el servicio, el sistema te DEVUELVE esos productos al stock. No tenés que tocar nada del stock a mano.",
    ],
  },
  {
    icon: CreditCard, title: "6. Pagos (la plata)",
    intro: "Cada pago se anota DENTRO del servicio que pagó. Así siempre sabés cuánto debe el cliente de cada cosa.",
    steps: [
      "En la Ficha, buscá el servicio que te pagaron y tocá 'Registrar pago'.",
      "Poné cuánto pagó, cómo pagó (efectivo, transferencia…) y la fecha.",
      "Guardá. El 'cobrado' y el 'saldo' de ese servicio se actualizan solos.",
      "Si tenés que devolver plata, cargá un pago de tipo 'devolución' (resta sola).",
    ],
    notas: [
      "Los pagos que ya estaban cargados de antes aparecen abajo como 'Pagos sin asignar'. Tocá el selector y elegí a qué servicio corresponde cada uno.",
      "Los pagos NUNCA se borran: queda todo el historial. Si algo está mal, se arregla con una devolución, no borrando.",
    ],
  },
  {
    icon: Boxes, title: "7. Stock de cotillón",
    intro: "Acá controlás cuántos productos de cotillón tenés y qué lleva cada combo.",
    steps: [
      "Tocá 'Stock'.",
      "En la pestaña 'Combos' ves el Combo 1, 2 y 3 con todo lo que lleva cada uno.",
      "En la pestaña 'Productos' ves cada producto y cuánto tenés.",
      "¿Compraste mercadería? Tocá 'Movimiento' en ese producto y elegí 'ingreso' con la cantidad.",
      "¿Querés corregir un número a mano? Tocá 'Editar' (el lápiz ✏️) y cambiá el stock.",
    ],
    notas: [
      "Hay cuatro números por producto: 'actual' (lo que tenés), 'reservado' (apartado para eventos), 'disponible' (lo que queda libre = actual − reservado) y 'mínimo' (el límite que vos definís).",
      "El 'reservado' lo maneja el sistema solo (cuando un evento contrata un combo). No lo toques a mano.",
      "Si un producto baja del mínimo que pusiste, se pinta de rojo para avisarte que hay que comprar.",
    ],
  },
  {
    icon: Bell, title: "8. Alertas",
    intro: "Es tu lista de 'no me olvido de nada'. Te muestra los eventos que se vienen, para que prepares compras, armado y cobranza a tiempo.",
    steps: [
      "Tocá 'Alertas' en el menú.",
      "Vas a ver los eventos agrupados por urgencia: Hoy y vencidos, próximos 7, 15 y 30 días.",
      "Cada tarjeta te dice: el cliente, la fecha, qué servicios tiene, si lleva combo de cotillón y cuánto falta pagar (saldo).",
      "Usala para dos cosas: comprar/armar lo que haga falta (mirá el combo) y llamar a cobrar (mirá el saldo y el teléfono).",
    ],
    notas: [
      "No hay que cargar nada acá: se arma sola con los eventos y sus fechas.",
      "Solo aparecen eventos de los próximos 30 días (y los recién vencidos que todavía no marcaste como 'Realizado').",
      "Si un evento ya está 'Realizado' o 'Cancelado', no molesta más en las alertas.",
    ],
  },
  {
    icon: LayoutDashboard, title: "9. Dashboard y Reportes",
    intro: "Son las pantallas de números generales, para ver cómo va el negocio.",
    steps: [
      "'Dashboard': cuántos clientes tenés, cuántos se convirtieron y de dónde llegan.",
      "'Reportes': el embudo de ventas, la plata (cobrado vs lo que falta) y las comunicaciones.",
    ],
    notas: [
      "No hace falta cargar nada acá: se llenan solos con lo que vas haciendo en el resto del sistema.",
    ],
  },
  {
    icon: Zap, title: "10. Cosas que el sistema hace solo",
    intro: "Para que no te olvides de nada, el sistema hace varias cosas automáticamente.",
    steps: [
      "Cuando anotás que le escribiste a un cliente nuevo, pasa solo a 'Contactado'.",
      "Cuando marcás 'Enviar propuesta', te crea una tarea para acordarte.",
      "Cuando firmás el contrato, crea el evento y reserva la fecha solo.",
      "Cuando cargás pagos, el evento pasa solo de 'Pendiente' a 'Parcial' y a 'Completo'.",
    ],
    notas: [
      "Todo esto pasa automático: vos hacés tu trabajo normal y el sistema acomoda lo demás.",
    ],
  },
]

export default function GuideView() {
  const [page, setPage] = useState(0)
  const total = PAGES.length
  const P = PAGES[page]
  const Icon = P.icon

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Guía paso a paso</h1>
      </div>

      {/* Índice */}
      <div className="flex flex-wrap gap-1.5">
        {PAGES.map((p, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              i === page ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"
            )}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Página actual */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">{P.title}</h2>
            <p className="text-xs text-muted-foreground">Página {page + 1} de {total}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{P.intro}</p>

        <ol className="mt-4 flex flex-col gap-3">
          {P.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              <span className="pt-0.5 text-sm text-foreground">{s}</span>
            </li>
          ))}
        </ol>

        {P.notas && P.notas.length > 0 && (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-800">Aclaraciones importantes</p>
            <ul className="flex flex-col gap-1.5">
              {P.notas.map((n, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-900">
                  <span className="text-amber-500">•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <span className="text-xs text-muted-foreground">{page + 1} / {total}</span>
        <button
          onClick={() => setPage(p => Math.min(total - 1, p + 1))}
          disabled={page === total - 1}
          className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
