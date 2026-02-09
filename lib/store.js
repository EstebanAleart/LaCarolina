// ============================================================
// CarolinaOS - In-memory data store with localStorage persistence
// ============================================================

const STORAGE_KEY = "carolina_os_data"

const LEAD_STATES = [
  "Consulta inicial",
  "Propuesta enviada",
  "Esperando respuesta",
  "Visita agendada",
  "En negociacion",
  "Reserva tomada",
  "Evento confirmado",
  "Perdido",
]

const CALENDAR_STATES = ["Disponible", "Bloqueada", "Reservada", "Confirmada"]

const CANALES = ["WhatsApp", "Web", "Referido", "Instagram", "Facebook", "Telefono"]

const TIPOS_EVENTO = ["Boda", "15 anos", "18 anos", "Corporativo", "Baby Shower", "Cumpleanos", "Otro"]

const TASK_STATES = ["Pendiente", "En Proceso", "Hecho", "Cancelado"]

const TASK_PRIORITIES = ["Alta", "Media", "Baja"]

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function getInitialData() {
  if (typeof window === "undefined") return createEmptyData()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) {
    // ignore
  }
  return createEmptyData()
}

function createEmptyData() {
  return {
    users: [
      { id: "u1", nombre: "Carolina", email: "carolina@eventos.com", rol: "Admin", activo: true },
      { id: "u2", nombre: "Maria", email: "maria@eventos.com", rol: "Comercial", activo: true },
      { id: "u3", nombre: "Luis", email: "luis@eventos.com", rol: "Operaciones", activo: true },
    ],
    leads: [],
    interactions: [],
    visits: [],
    proposals: [],
    calendarDates: [],
    reservations: [],
    events: [],
    tasks: [],
    leadStatusHistory: [],
  }
}

let data = null

function getData() {
  if (!data) data = getInitialData()
  return data
}

function persist() {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    // ignore
  }
}

// --- LEADS ---
function getLeads() {
  return getData().leads
}

function getLeadById(id) {
  return getData().leads.find((l) => l.id === id) || null
}

function createLead(leadData) {
  const d = getData()
  const lead = {
    id: generateId(),
    nombre: leadData.nombre || "",
    telefono: leadData.telefono || "",
    email: leadData.email || "",
    canal_origen: leadData.canal_origen || "WhatsApp",
    tipo_evento: leadData.tipo_evento || "Boda",
    fecha_tentativa: leadData.fecha_tentativa || "",
    anio_evento: leadData.anio_evento || new Date().getFullYear(),
    estado_actual: "Consulta inicial",
    valor_estimado: leadData.valor_estimado || 0,
    notas: leadData.notas || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  d.leads.push(lead)
  persist()
  return lead
}

function updateLead(id, updates) {
  const d = getData()
  const idx = d.leads.findIndex((l) => l.id === id)
  if (idx === -1) return null
  d.leads[idx] = { ...d.leads[idx], ...updates, updated_at: new Date().toISOString() }
  persist()
  return d.leads[idx]
}

function changeLeadStatus(leadId, newStatus, userId, motivo) {
  const d = getData()
  const lead = d.leads.find((l) => l.id === leadId)
  if (!lead) return null
  const oldStatus = lead.estado_actual

  if (newStatus === "Perdido" && !motivo) {
    return { error: "Motivo obligatorio para marcar como Perdido" }
  }

  d.leadStatusHistory.push({
    id: generateId(),
    lead_id: leadId,
    estado_anterior: oldStatus,
    estado_nuevo: newStatus,
    motivo: motivo || null,
    changed_by_user_id: userId || "u1",
    changed_at: new Date().toISOString(),
  })

  lead.estado_actual = newStatus
  lead.updated_at = new Date().toISOString()

  // Automation: if moved to "Propuesta enviada", create follow-up task
  if (newStatus === "Propuesta enviada") {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    createTask({
      titulo: "Seguimiento propuesta - " + lead.nombre,
      descripcion: "Hacer seguimiento de propuesta enviada",
      lead_id: leadId,
      assigned_to_user_id: userId || "u1",
      prioridad: "Alta",
      due_date: dueDate.toISOString().split("T")[0],
    })
  }

  persist()
  return lead
}

function deleteLead(id) {
  const d = getData()
  d.leads = d.leads.filter((l) => l.id !== id)
  d.interactions = d.interactions.filter((i) => i.lead_id !== id)
  d.visits = d.visits.filter((v) => v.lead_id !== id)
  d.proposals = d.proposals.filter((p) => p.lead_id !== id)
  d.leadStatusHistory = d.leadStatusHistory.filter((h) => h.lead_id !== id)
  d.reservations = d.reservations.filter((r) => r.lead_id !== id)
  d.tasks = d.tasks.filter((t) => t.lead_id !== id)
  persist()
}

// --- INTERACTIONS ---
function getInteractionsByLead(leadId) {
  return getData().interactions.filter((i) => i.lead_id === leadId)
}

function createInteraction(intData) {
  const d = getData()
  const interaction = {
    id: generateId(),
    lead_id: intData.lead_id,
    tipo: intData.tipo || "WhatsApp",
    descripcion: intData.descripcion || "",
    fecha: intData.fecha || new Date().toISOString(),
    created_by_user_id: intData.created_by_user_id || "u1",
  }
  d.interactions.push(interaction)
  persist()
  return interaction
}

// --- VISITS ---
function getVisitsByLead(leadId) {
  return getData().visits.filter((v) => v.lead_id === leadId)
}

function createVisit(visitData) {
  const d = getData()
  const visit = {
    id: generateId(),
    lead_id: visitData.lead_id,
    fecha_visita: visitData.fecha_visita || new Date().toISOString().split("T")[0],
    resultado: visitData.resultado || "neutral",
    notas: visitData.notas || "",
    created_by_user_id: visitData.created_by_user_id || "u1",
  }
  d.visits.push(visit)
  persist()
  return visit
}

// --- PROPOSALS ---
function getProposalsByLead(leadId) {
  return getData().proposals.filter((p) => p.lead_id === leadId)
}

function getAllProposals() {
  return getData().proposals
}

function createProposal(propData) {
  const d = getData()
  const existingVersions = d.proposals.filter((p) => p.lead_id === propData.lead_id)
  const proposal = {
    id: generateId(),
    lead_id: propData.lead_id,
    version: existingVersions.length + 1,
    contenido: propData.contenido || "",
    precio_total: propData.precio_total || 0,
    estado: "Borrador",
    fecha_envio: null,
    created_by_user_id: propData.created_by_user_id || "u1",
    created_at: new Date().toISOString(),
  }
  d.proposals.push(proposal)
  persist()
  return proposal
}

function updateProposal(id, updates) {
  const d = getData()
  const idx = d.proposals.findIndex((p) => p.id === id)
  if (idx === -1) return null
  d.proposals[idx] = { ...d.proposals[idx], ...updates }
  if (updates.estado === "Enviada" && !d.proposals[idx].fecha_envio) {
    d.proposals[idx].fecha_envio = new Date().toISOString()
  }
  persist()
  return d.proposals[idx]
}

// --- CALENDAR ---
function getCalendarDates() {
  return getData().calendarDates
}

function getCalendarDateByDate(fecha) {
  return getData().calendarDates.find((c) => c.fecha === fecha) || null
}

function setCalendarDate(calData) {
  const d = getData()
  const existing = d.calendarDates.findIndex((c) => c.fecha === calData.fecha)

  // Business rule: can't have two leads on same reserved/confirmed date
  if (calData.lead_id && (calData.estado_fecha === "Reservada" || calData.estado_fecha === "Confirmada")) {
    const conflict = d.calendarDates.find(
      (c) =>
        c.fecha === calData.fecha &&
        c.lead_id !== calData.lead_id &&
        (c.estado_fecha === "Reservada" || c.estado_fecha === "Confirmada")
    )
    if (conflict) {
      return { error: "Ya existe una reserva o confirmacion para esta fecha" }
    }
  }

  const entry = {
    id: existing >= 0 ? d.calendarDates[existing].id : generateId(),
    fecha: calData.fecha,
    estado_fecha: calData.estado_fecha || "Bloqueada",
    fuente: calData.fuente || "CRM",
    lead_id: calData.lead_id || null,
    evento_id: calData.evento_id || null,
    nota: calData.nota || "",
    created_at: existing >= 0 ? d.calendarDates[existing].created_at : new Date().toISOString(),
  }

  if (existing >= 0) {
    d.calendarDates[existing] = entry
  } else {
    d.calendarDates.push(entry)
  }
  persist()
  return entry
}

function removeCalendarDate(fecha) {
  const d = getData()
  d.calendarDates = d.calendarDates.filter((c) => c.fecha !== fecha)
  persist()
}

// --- RESERVATIONS ---
function getReservations() {
  return getData().reservations
}

function createReservation(resData) {
  const d = getData()
  // One reservation per lead
  const existing = d.reservations.find((r) => r.lead_id === resData.lead_id)
  if (existing) return { error: "Este lead ya tiene una reserva" }

  const reservation = {
    id: generateId(),
    lead_id: resData.lead_id,
    calendar_date_id: resData.calendar_date_id || null,
    monto_senia: resData.monto_senia || 0,
    fecha_pago: resData.fecha_pago || new Date().toISOString().split("T")[0],
    metodo_pago: resData.metodo_pago || "Efectivo",
    comprobante_url: resData.comprobante_url || "",
    estado: "Pendiente",
  }
  d.reservations.push(reservation)
  persist()
  return reservation
}

function updateReservation(id, updates) {
  const d = getData()
  const idx = d.reservations.findIndex((r) => r.id === id)
  if (idx === -1) return null
  d.reservations[idx] = { ...d.reservations[idx], ...updates }
  persist()
  return d.reservations[idx]
}

// --- EVENTS ---
function getEvents() {
  return getData().events
}

function createEvent(evData) {
  const d = getData()
  const existing = d.events.find((e) => e.lead_id === evData.lead_id)
  if (existing) return { error: "Este lead ya fue convertido en evento" }

  const ev = {
    id: generateId(),
    lead_id: evData.lead_id,
    fecha_confirmada: evData.fecha_confirmada,
    tipo_evento: evData.tipo_evento || "",
    invitados_estimados: evData.invitados_estimados || 0,
    servicios_contratados: evData.servicios_contratados || [],
    estado_operativo: "Pendiente",
    contrato_url: evData.contrato_url || "",
    created_at: new Date().toISOString(),
  }
  d.events.push(ev)

  // Update calendar
  setCalendarDate({
    fecha: evData.fecha_confirmada,
    estado_fecha: "Confirmada",
    lead_id: evData.lead_id,
    evento_id: ev.id,
    fuente: "CRM",
  })

  // Update lead status
  changeLeadStatus(evData.lead_id, "Evento confirmado", "u1")

  persist()
  return ev
}

function updateEvent(id, updates) {
  const d = getData()
  const idx = d.events.findIndex((e) => e.id === id)
  if (idx === -1) return null
  d.events[idx] = { ...d.events[idx], ...updates }
  persist()
  return d.events[idx]
}

// --- TASKS ---
function getTasks() {
  return getData().tasks
}

function createTask(taskData) {
  const d = getData()
  const task = {
    id: generateId(),
    titulo: taskData.titulo || "",
    descripcion: taskData.descripcion || "",
    lead_id: taskData.lead_id || null,
    evento_id: taskData.evento_id || null,
    assigned_to_user_id: taskData.assigned_to_user_id || "u1",
    estado: "Pendiente",
    prioridad: taskData.prioridad || "Media",
    due_date: taskData.due_date || "",
    created_at: new Date().toISOString(),
  }
  d.tasks.push(task)
  persist()
  return task
}

function updateTask(id, updates) {
  const d = getData()
  const idx = d.tasks.findIndex((t) => t.id === id)
  if (idx === -1) return null
  d.tasks[idx] = { ...d.tasks[idx], ...updates }
  persist()
  return d.tasks[idx]
}

function deleteTask(id) {
  const d = getData()
  d.tasks = d.tasks.filter((t) => t.id !== id)
  persist()
}

// --- STATUS HISTORY ---
function getLeadStatusHistory(leadId) {
  return getData().leadStatusHistory.filter((h) => h.lead_id === leadId)
}

// --- USERS ---
function getUsers() {
  return getData().users
}

// --- SEED DATA ---
function seedDemoData() {
  const d = getData()
  if (d.leads.length > 0) return // already seeded

  const leads = [
    { nombre: "Sofia Martinez", telefono: "+54 11 5555-1234", email: "sofia@mail.com", canal_origen: "WhatsApp", tipo_evento: "Boda", fecha_tentativa: "2026-06-15", anio_evento: 2026, valor_estimado: 450000 },
    { nombre: "Valentina Lopez", telefono: "+54 11 5555-5678", email: "valen@mail.com", canal_origen: "Instagram", tipo_evento: "15 anos", fecha_tentativa: "2026-08-20", anio_evento: 2026, valor_estimado: 280000 },
    { nombre: "Rodrigo Perez", telefono: "+54 11 5555-9012", email: "rodrigo@corp.com", canal_origen: "Web", tipo_evento: "Corporativo", fecha_tentativa: "2026-04-10", anio_evento: 2026, valor_estimado: 520000 },
    { nombre: "Camila Fernandez", telefono: "+54 11 5555-3456", email: "cami@mail.com", canal_origen: "Referido", tipo_evento: "Boda", fecha_tentativa: "2026-09-05", anio_evento: 2026, valor_estimado: 380000 },
    { nombre: "Lucas Garcia", telefono: "+54 11 5555-7890", email: "lucas@mail.com", canal_origen: "Facebook", tipo_evento: "18 anos", fecha_tentativa: "2026-07-12", anio_evento: 2026, valor_estimado: 200000 },
    { nombre: "Martina Ruiz", telefono: "+54 11 5555-2345", email: "martina@mail.com", canal_origen: "WhatsApp", tipo_evento: "Baby Shower", fecha_tentativa: "2026-05-18", anio_evento: 2026, valor_estimado: 150000 },
    { nombre: "Diego Sanchez", telefono: "+54 11 5555-6789", email: "diego@corp.com", canal_origen: "Telefono", tipo_evento: "Corporativo", fecha_tentativa: "2026-03-22", anio_evento: 2026, valor_estimado: 600000 },
    { nombre: "Ana Torres", telefono: "+54 11 5555-0123", email: "ana@mail.com", canal_origen: "Instagram", tipo_evento: "Cumpleanos", fecha_tentativa: "2026-10-30", anio_evento: 2026, valor_estimado: 180000 },
  ]

  const states = ["Consulta inicial", "Propuesta enviada", "Esperando respuesta", "Visita agendada", "En negociacion", "Reserva tomada", "Evento confirmado", "Perdido"]

  leads.forEach((leadData, i) => {
    const lead = createLead(leadData)
    const targetState = states[i % states.length]
    if (targetState !== "Consulta inicial") {
      changeLeadStatus(lead.id, targetState, "u1", targetState === "Perdido" ? "Sin presupuesto" : null)
    }
    // Add some interactions
    createInteraction({ lead_id: lead.id, tipo: "WhatsApp", descripcion: "Primer contacto, consulta sobre disponibilidad", fecha: new Date(Date.now() - 86400000 * (10 - i)).toISOString() })
    if (i % 2 === 0) {
      createInteraction({ lead_id: lead.id, tipo: "Llamada", descripcion: "Seguimiento telefonico", fecha: new Date(Date.now() - 86400000 * (5 - i)).toISOString() })
    }
  })

  // Some calendar dates
  setCalendarDate({ fecha: "2026-06-15", estado_fecha: "Reservada", fuente: "CRM", nota: "Boda Sofia Martinez" })
  setCalendarDate({ fecha: "2026-08-20", estado_fecha: "Bloqueada", fuente: "CRM", nota: "15 anos Valentina" })
  setCalendarDate({ fecha: "2026-04-10", estado_fecha: "Confirmada", fuente: "CRM", nota: "Evento Corporativo" })
  setCalendarDate({ fecha: "2026-09-05", estado_fecha: "Disponible", fuente: "CRM", nota: "" })

  // Some tasks
  createTask({ titulo: "Enviar presupuesto actualizado", descripcion: "Actualizar precios y enviar a Sofia", lead_id: d.leads[0]?.id, assigned_to_user_id: "u2", prioridad: "Alta", due_date: "2026-02-12" })
  createTask({ titulo: "Confirmar menu degustacion", descripcion: "Coordinar menu para la visita", lead_id: d.leads[1]?.id, assigned_to_user_id: "u3", prioridad: "Media", due_date: "2026-02-15" })
  createTask({ titulo: "Revisar contrato corporativo", descripcion: "Revision legal del contrato", lead_id: d.leads[2]?.id, assigned_to_user_id: "u1", prioridad: "Alta", due_date: "2026-02-10" })
  createTask({ titulo: "Llamar proveedor flores", descripcion: "Confirmar arreglos florales", assigned_to_user_id: "u3", prioridad: "Baja", due_date: "2026-02-20" })
  createTask({ titulo: "Preparar propuesta nueva", descripcion: "Crear propuesta para evento de Lucas", lead_id: d.leads[4]?.id, assigned_to_user_id: "u2", prioridad: "Media", due_date: "2026-02-18" })

  // Create proposals for some leads
  if (d.leads[0]) createProposal({ lead_id: d.leads[0].id, contenido: "Paquete Premium Boda: Salon principal, catering 150 personas, decoracion completa, DJ, fotografo.", precio_total: 450000 })
  if (d.leads[1]) createProposal({ lead_id: d.leads[1].id, contenido: "Paquete 15 Anos: Salon secundario, catering 80 personas, decoracion tematica, DJ.", precio_total: 280000 })
  if (d.leads[2]) {
    createProposal({ lead_id: d.leads[2].id, contenido: "Evento Corporativo v1: Sala conferencias, coffee break, almuerzo ejecutivo.", precio_total: 480000 })
    createProposal({ lead_id: d.leads[2].id, contenido: "Evento Corporativo v2: Salon completo, catering premium, equipamiento AV, cocktail.", precio_total: 520000 })
  }

  persist()
}

export {
  LEAD_STATES,
  CALENDAR_STATES,
  CANALES,
  TIPOS_EVENTO,
  TASK_STATES,
  TASK_PRIORITIES,
  generateId,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  changeLeadStatus,
  deleteLead,
  getInteractionsByLead,
  createInteraction,
  getVisitsByLead,
  createVisit,
  getProposalsByLead,
  getAllProposals,
  createProposal,
  updateProposal,
  getCalendarDates,
  getCalendarDateByDate,
  setCalendarDate,
  removeCalendarDate,
  getReservations,
  createReservation,
  updateReservation,
  getEvents,
  createEvent,
  updateEvent,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getLeadStatusHistory,
  getUsers,
  seedDemoData,
}
