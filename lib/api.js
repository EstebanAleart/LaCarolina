// ============================================================
// CarolinaOS - API client (fetch wrappers para /api/*)
// Reemplaza a store.js para conectar frontend con PostgreSQL
// ============================================================

const API = '/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la API');
  return data;
}

// --- LEADS ---
export async function fetchLeads(filters = {}) {
  const params = new URLSearchParams();
  if (filters.estado) params.set('estado', filters.estado);
  if (filters.anio) params.set('anio', filters.anio);
  const qs = params.toString();
  return request(`${API}/leads${qs ? `?${qs}` : ''}`);
}

export async function fetchLeadById(id) {
  return request(`${API}/leads/${id}`);
}

export async function apiCreateLead(data) {
  return request(`${API}/leads`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateLead(id, data) {
  return request(`${API}/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiDeleteLead(id) {
  return request(`${API}/leads/${id}`, { method: 'DELETE' });
}

export async function apiChangeLeadStatus(id, estado, motivo, user_id) {
  return request(`${API}/leads/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ estado, motivo, user_id }),
  });
}

// --- INTERACTIONS ---
export async function fetchInteractionsByLead(leadId) {
  return request(`${API}/leads/${leadId}/interactions`);
}

export async function apiCreateInteraction(leadId, data) {
  return request(`${API}/leads/${leadId}/interactions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- VISITS ---
export async function fetchVisitsByLead(leadId) {
  return request(`${API}/leads/${leadId}/visits`);
}

export async function apiCreateVisit(leadId, data) {
  return request(`${API}/leads/${leadId}/visits`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- PROPOSALS ---
export async function fetchProposalsByLead(leadId) {
  return request(`${API}/leads/${leadId}/proposals`);
}

export async function fetchAllProposals() {
  return request(`${API}/proposals`);
}

export async function apiCreateProposal(leadId, data) {
  return request(`${API}/leads/${leadId}/proposals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateProposal(id, data) {
  return request(`${API}/proposals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// --- CALENDAR ---
export async function fetchCalendarDates() {
  return request(`${API}/calendar`);
}

export async function apiSetCalendarDate(data) {
  return request(`${API}/calendar`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiRemoveCalendarDate(fecha) {
  return request(`${API}/calendar/${fecha}`, { method: 'DELETE' });
}

// --- RESERVATIONS ---
export async function fetchReservations() {
  return request(`${API}/reservations`);
}

export async function apiCreateReservation(data) {
  return request(`${API}/reservations`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateReservation(id, data) {
  return request(`${API}/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// --- EVENTS ---
export async function fetchEvents() {
  return request(`${API}/events`);
}

export async function apiCreateEvent(data) {
  return request(`${API}/events`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateEvent(id, data) {
  return request(`${API}/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// --- TASKS ---
export async function fetchTasks() {
  return request(`${API}/tasks`);
}

export async function apiCreateTask(data) {
  return request(`${API}/tasks`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateTask(id, data) {
  return request(`${API}/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiDeleteTask(id) {
  return request(`${API}/tasks/${id}`, { method: 'DELETE' });
}

// --- USERS ---
export async function fetchUsers() {
  return request(`${API}/users`);
}

// --- CONSTANTES (se mantienen en el frontend) ---
export const LEAD_STATES = [
  "Lead nuevo",
  "Contactado",
  "Esperando visita",
  "Visita al salón realizada",
  "Enviar propuesta",
  "Propuesta enviada",
  "Propuesta Aceptada",
  "Propuesta Rechazada",
  "Esperando Reserva",
  "Reserva tomada",
  "Contrato firmado",
  "Cliente activo",
  "Evento realizado",
  "Post-evento / cerrado",
  "Perdido",
];

export const TIPOS_CLIENTE = ["Particular", "Empresa", "Institucional"];

export const CALENDAR_STATES = ["Disponible", "Bloqueada", "Reservada", "Confirmada", "Visita"];

export const CANALES = ["WhatsApp", "Web", "Referido", "Instagram", "Facebook", "Telefono"];

export const TIPOS_EVENTO = ["Fiesta de 15", "Egresados", "Casamiento", "Evento Corporativo", "Otro"];

export const TASK_STATES = ["Pendiente", "En Proceso", "Hecho", "Cancelado"];

export const TASK_PRIORITIES = ["Alta", "Media", "Baja"];

// --- EVENTOS ---
export const ESTADOS_PAGO = ["Pendiente", "Parcial", "Completo"];

export const MODALIDADES_PRECIO = ["Precio fijo", "Precio por tarjeta", "Mixto"];

export const SERVICIOS_BASE = ["Salón", "Catering"];

export const SERVICIOS_ADICIONALES = ["Mesa dulce", "Fotografía", "Video", "DJ extra", "Decoración especial", "Otros"];

// --- PAGOS ---
export const TIPOS_PAGO = ["seña", "pago_parcial", "pago_final", "devolucion"];

export const METODOS_PAGO = ["efectivo", "transferencia", "tarjeta", "cheque", "otro"];

export async function fetchPayments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.event_id) params.set('event_id', filters.event_id);
  const qs = params.toString();
  return request(`${API}/payments${qs ? `?${qs}` : ''}`);
}

export async function fetchPaymentsByEvent(eventId) {
  return request(`${API}/payments?event_id=${eventId}`);
}

export async function apiCreatePayment(data) {
  return request(`${API}/payments`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdatePayment(id, data) {
  return request(`${API}/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// --- INTERACTIONS (global, para reportes) ---
export async function fetchAllInteractions() {
  return request(`${API}/interactions`);
}
