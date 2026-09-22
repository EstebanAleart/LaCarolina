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
    icon: BookOpen, title: "Cómo usar esta guía",
    intro: "CarolinaOS ordena el trabajo en dos partes: la venta (Leads) y la organización de la fiesta ya vendida (Eventos). Esta guía explica cada pantalla y, sobre todo, el recorrido completo desde que alguien consulta hasta que la fiesta se realiza.",
    steps: [
      "El menú de la izquierda tiene todas las secciones: Dashboard, CRM Leads, Calendario, Contratos, Eventos, Pagos, Stock, Alertas, Reportes y Guía.",
      "Navegá esta guía con los botones Anterior y Siguiente, o tocando el nombre del tema en la fila de arriba.",
      "La primera vez conviene leer los temas en orden. Después sirve como referencia puntual.",
    ],
  },
  {
    icon: Users, title: "1. Leads: el recorrido de una venta",
    intro: "Un lead es una persona que consultó por un evento. El CRM lo acompaña por cuatro estados hasta que reserva o se pierde. Los estados son: Lead nuevo → Visita agendada → Visita realizada → Reserva confirmada, más Perdido.",
    steps: [
      "Alta: en CRM Leads tocá Nuevo Lead. Si la persona ya es cliente (contrató antes), buscala arriba en \"¿Ya es cliente?\" y elegila: el nuevo lead queda atado a ese cliente y se ve todo su historial. Si es nueva, cargá nombre, teléfono, tipo de evento, fecha tentativa y por dónde llegó; el cliente se crea solo. Si es un cliente anterior que estás pasando al sistema, marcá el tilde naranja Lead histórico: no cuenta como venta nueva.",
      "Seguimiento: en cada lead cargá el responsable, el próximo paso y su fecha de vencimiento (Editar, sección Seguimiento). En la lista y en el kanban el próximo paso vencido se ve en rojo. El último contacto se toma de la última interacción cargada.",
      "Visita agendada: abrí el lead, tocá Editar y cargá la fecha de visita al salón. El lead cambia solo a Visita agendada y la visita aparece en el Calendario.",
      "Visita realizada: cuando la visita se hizo, cambiá el estado a Visita realizada (botón Cambiar Estado, o arrastrando la tarjeta en la vista Kanban). El sistema crea el borrador del contrato en la sección Contratos.",
      "Seña: cuando el cliente deja la seña, en la ficha del lead tocá Registrar seña y cargá monto, fecha y método. Esto reserva la fecha en el Calendario y deja la seña anotada. La seña puede cargarse antes o en el mismo momento que el contrato.",
      "Contrato: en Contratos completá el contrato y marcalo como Firmada.",
      "Reserva confirmada: se produce sola cuando están las tres cosas: seña registrada, fecha reservada en el calendario y contrato firmado. En ese momento el sistema crea el Evento con los datos del contrato, carga la seña como primer pago y confirma la fecha. La ficha del lead muestra un cuadro Reserva con las tres condiciones y una tilde en cada una que se cumple.",
      "Perdido: si el cliente no avanza, cambiá el estado a Perdido y elegí el motivo (Precio, Fecha no disponible, Eligió otro salón, Canceló el evento, No respondió u Otro con descripción). El motivo es obligatorio y se usa en los reportes.",
    ],
    notas: [
      "No se puede marcar Reserva confirmada a mano si falta alguna de las tres condiciones: el sistema lo rechaza e indica qué falta.",
      "Cada vez que hablás con el cliente, anotalo en la pestaña Interacciones de su ficha. Queda el historial y ayuda al seguimiento.",
      "La vista Kanban muestra una columna por estado, con 5, 10 o 20 tarjetas por columna y Ver más para el resto. Arrastrar una tarjeta a otra columna cambia el estado; si la soltás en Perdido, te pide el motivo. El botón Históricos filtra la cartera anterior.",
      "Cliente y lead son cosas distintas: el cliente es la persona (permanente) y cada lead es una consulta. Un cliente puede tener varias fiestas: cada una es un lead nuevo del mismo cliente.",
    ],
  },
  {
    icon: FileText, title: "2. Contratos",
    intro: "Cada lead tiene su contrato, con versiones. El estado del contrato se maneja únicamente desde esta sección.",
    steps: [
      "En Contratos, buscá el contrato del cliente (se crea solo al marcar Visita realizada) o tocá Nuevo Contrato.",
      "Completá los datos del cliente, el precio del salón, las tarjetas y los servicios contratados.",
      "El contrato avanza por Creada → Enviada → Aprobada → Firmada. Marcá cada paso cuando ocurre.",
      "Al marcar Firmada se registra la fecha de firma. Si la seña ya está cargada y la fecha reservada, el lead pasa a Reserva confirmada y se crea el Evento con los datos del contrato.",
      "El botón Imprimir abre el contrato listo para guardar en PDF.",
    ],
    notas: [
      "Un contrato firmado queda bloqueado para edición.",
      "Cambiar el estado del contrato no cambia el estado del lead. Lo único que confirma la reserva es tener seña, fecha y contrato firmado.",
    ],
  },
  {
    icon: CalendarDays, title: "3. Calendario",
    intro: "Es la fuente de las fechas del sistema: visitas, fechas reservadas y confirmadas, y días bloqueados.",
    steps: [
      "Tocá un día para ver qué tiene o para cargar una visita, una reserva o un bloqueo.",
      "Cada color es un estado: libre, visita, reservada, confirmada, bloqueada.",
      "Una fecha Reservada es la que tiene seña. Pasa a Confirmada sola cuando se confirma la reserva del lead.",
    ],
    notas: [
      "El sistema no permite dos clientes distintos en la misma fecha reservada o confirmada.",
      "Las fechas reservadas y confirmadas se copian a Google Calendar.",
      "Si el evento lleva cotillón, el día muestra el combo (C1, C2 o C3) arriba a la derecha.",
    ],
  },
  {
    icon: Sparkles, title: "4. Eventos y la Ficha del evento",
    intro: "Un evento es una fiesta ya vendida. Se crea solo al confirmarse la reserva y trae los datos del contrato, la seña y la fecha. Acá se organiza la producción y se sigue la plata.",
    steps: [
      "En Eventos podés ver la lista o el tablero Kanban por estado: En planificación, Próximo evento, Evento realizado y Post-evento / cerrado. En el tablero, arrastrar una tarjeta cambia el estado.",
      "Los cambios por fecha son automáticos: a 30 días de la fiesta el evento pasa a Próximo evento; al día siguiente de la fecha pasa a Evento realizado y se crean las tareas post-evento (verificar saldos y devoluciones, registrar incidencias, mensaje de agradecimiento, pedido de feedback y reseña). Cuando esas tareas se completan, el evento queda Post-evento / cerrado.",
      "No se puede marcar Evento realizado antes de la fecha: lo hace el sistema.",
      "Tocá un evento para abrir la Ficha del evento. Arriba siempre se ven total contratado, cobrado y saldo. Abajo hay pestañas: Datos (cliente, contacto, fecha, contrato, observaciones comerciales), Servicios (cada servicio con su cuenta), Producción (estado del evento, preparación de cada servicio y tareas post-evento), Invitados (cantidad y tarjetas), Pagos (todos los pagos y registrar uno nuevo) y Portal (lo que va a ver el cliente, en el Ciclo 3).",
      "La ficha también se abre desde Alertas (tocando la tarjeta), desde el Calendario (botón Ficha en la fecha) y desde Pagos (tocando el nombre del cliente).",
      "La seña que cargaste en el lead aparece como el primer pago confirmado del evento.",
      "Desde la ficha se agregan servicios y se registran pagos por servicio.",
    ],
    notas: [
      "El estado del evento (organización) es independiente del estado del lead (venta). No se pisan.",
      "Las tareas post-evento aparecen en la sección Tareas con su fecha límite, y también en la pestaña Producción de la ficha, donde se tildan al completarlas. Cuando están todas hechas, el evento pasa a Post-evento / cerrado.",
      "Tareas tiene vista de tablero: arrastrar una tarjeta cambia su estado (Pendiente, En Proceso, Hecho, Cancelado).",
    ],
  },
  {
    icon: ClipboardList, title: "5. Servicios del evento",
    intro: "Cada evento puede tener varios servicios: salón, tarjetas, cotillón, decoración y otros. Cada uno lleva su propia cuenta para que la plata no se mezcle.",
    steps: [
      "En la Ficha del evento tocá Agregar servicio y elegí el tipo.",
      "Si es cotillón, elegí el combo (1, 2 o 3).",
      "Cargá el total contratado por ese servicio y guardá.",
      "Cada servicio tiene su estado: Contratado → En preparación → Listo → Entregado.",
    ],
    notas: [
      "Al elegir un combo de cotillón, el sistema reserva los productos en el stock. Al marcar Entregado los descuenta. Si quitás el servicio, los devuelve.",
    ],
  },
  {
    icon: CreditCard, title: "6. Pagos",
    intro: "Los pagos se registran dentro del servicio que corresponde, así se sabe cuánto debe el cliente de cada cosa. También hay una vista general en la sección Pagos.",
    steps: [
      "En la Ficha del evento, en el servicio que cobraste, tocá Registrar pago.",
      "Cargá el monto (con puntos de miles), el método, el concepto y la fecha.",
      "El cobrado y el saldo del servicio se actualizan al guardar.",
      "Para devolver dinero, registrá un pago de tipo devolución.",
    ],
    notas: [
      "Los pagos no se borran: si hay un error, se anula el pago y se carga el correcto. El total cobrado solo cuenta los pagos confirmados.",
      "Los pagos viejos sin servicio asignado aparecen como Pagos sin asignar en la ficha; podés asignarlos a un servicio.",
    ],
  },
  {
    icon: Boxes, title: "7. Stock de cotillón",
    intro: "Control de productos de cotillón y de lo que lleva cada combo.",
    steps: [
      "En Stock, la pestaña Combos muestra el Combo 1, 2 y 3 con sus productos.",
      "La pestaña Productos muestra cada producto con stock actual, reservado, disponible y mínimo.",
      "Para registrar una compra, tocá Movimiento en el producto y elegí ingreso con la cantidad.",
      "Para corregir un número a mano, tocá Editar.",
    ],
    notas: [
      "El reservado lo maneja el sistema según los combos contratados en los eventos.",
      "Un producto por debajo del mínimo se muestra en rojo.",
    ],
  },
  {
    icon: Bell, title: "8. Alertas",
    intro: "Lista de los eventos de los próximos 30 días, agrupados por urgencia, con servicios, combo y saldo pendiente. Sirve para organizar compras, armado y cobranza.",
    steps: [
      "Tocá Alertas en el menú, o la campanita del Dashboard para ver un resumen.",
      "Los grupos son: hoy, próximos 7 días, 8 a 15 días y 16 a 30 días.",
      "Cada tarjeta muestra cliente, fecha, servicios, combo de cotillón, saldo y teléfono.",
    ],
    notas: [
      "Se arma sola a partir de los eventos. No hay nada que cargar.",
      "Los eventos realizados dejan de aparecer.",
    ],
  },
  {
    icon: LayoutDashboard, title: "9. Dashboard y Reportes",
    intro: "Números generales del negocio.",
    steps: [
      "Dashboard: cantidad de leads, conversión, eventos confirmados, valor estimado y saldo por cobrar a 30 días. Cada tarjeta lleva a la sección de donde sale el dato.",
      "Reportes: embudo de ventas por estado, motivos de pérdida, finanzas (cobrado y pendiente) y comunicaciones.",
    ],
    notas: [
      "La conversión y el embudo no cuentan los leads históricos (la cartera anterior a la app). El Dashboard tiene tres vistas: Operativo (sin históricos, la de todos los días), Con históricos (todo sumado) e Históricos vs actuales, que muestra lado a lado los números completos de cada grupo: leads, eventos, conversión, perdidos y motivos, valor estimado, facturado, cobrado, saldo, ticket promedio, invitados, días hasta la firma, pipeline, canales, estado de pago, tipo y año de evento.",
      "En el Dashboard, la campanita muestra las próximas alertas y cada tarjeta lleva a la sección de donde sale el dato.",
      "Las listas largas (Leads, Eventos, Contratos, Pagos, Productos) tienen paginado arriba y abajo, con selector de cantidad por página.",
    ],
  },
  {
    icon: Zap, title: "10. Lo que el sistema hace solo",
    intro: "Resumen de las automatizaciones, para saber qué no hace falta hacer a mano.",
    steps: [
      "Cargar la fecha de visita en el lead lo pasa a Visita agendada y crea la visita en el Calendario.",
      "Marcar Visita realizada crea el borrador del contrato.",
      "Registrar la seña reserva la fecha en el Calendario.",
      "Con seña, fecha reservada y contrato firmado, el lead pasa a Reserva confirmada y se crea el Evento con los datos del contrato, la seña como primer pago y la fecha confirmada.",
      "A 30 días de la fecha, el evento pasa a Próximo evento. Al día siguiente de la fecha pasa a Evento realizado y se crean las tareas post-evento. Al completarlas, queda Post-evento / cerrado.",
      "Al cargar pagos, el estado de pago del evento pasa de Pendiente a Parcial y a Completo.",
      "Al contratar un combo de cotillón, el stock se reserva; al entregarlo, se descuenta.",
    ],
    notas: [
      "Marcar Perdido siempre pide el motivo.",
      "Reserva confirmada no se puede forzar a mano si falta seña, fecha o contrato firmado.",
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
              "rounded-full px-3 py-2.5 text-xs font-medium transition-colors sm:py-1",
              i === page ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"
            )}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Página actual */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
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
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 sm:flex-none sm:py-2"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <span className="text-xs text-muted-foreground">{page + 1} / {total}</span>
        <button
          onClick={() => setPage(p => Math.min(total - 1, p + 1))}
          disabled={page === total - 1}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 sm:flex-none sm:py-2"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
