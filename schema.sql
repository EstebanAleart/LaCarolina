-- LaCarolina Database Schema
-- Run this script on your local PostgreSQL database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(255) NOT NULL DEFAULT 'Comercial' CHECK (rol IN ('Admin', 'Comercial', 'Operaciones', 'Viewer')),
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(255),
  email VARCHAR(255),
  canal_origen VARCHAR(255),
  tipo_evento VARCHAR(255),
  fecha_tentativa DATE,
  anio_evento INTEGER,
  estado_actual VARCHAR(255),
  tipo_cliente VARCHAR(255),
  fecha_visita_salon DATE,
  fecha_firma_contrato DATE,
  fecha_limite_pago_total DATE,
  valor_estimado FLOAT,
  invitados_estimados INTEGER,
  notas TEXT,
  managed_by_user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (managed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE,
  calendar_date_id UUID,
  fecha_confirmada DATE,
  tipo_evento VARCHAR(255),
  invitados_estimados INTEGER,
  servicios_contratados JSONB,
  estado_operativo VARCHAR(255),
  contrato_url VARCHAR(255),
  valor_total_evento FLOAT,
  estado_pago VARCHAR(255),
  modalidad_actualizacion_precios VARCHAR(255),
  precio_senia FLOAT,
  adicionales JSONB DEFAULT '[]'::jsonb,
  menu_seleccionado VARCHAR(255),
  minimo_tarjetas INTEGER,
  valor_tarjeta_adulto FLOAT,
  valor_tarjeta_adolescente FLOAT,
  valor_tarjeta_nino FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_date_id) REFERENCES calendar_dates(id) ON DELETE SET NULL
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  version INTEGER NOT NULL,
  contenido_html TEXT,
  precio_total FLOAT,
  precio_senia FLOAT,
  tipo_evento VARCHAR(255),
  invitados_estimados INTEGER,
  valor_total_evento FLOAT,
  modalidad_actualizacion_precios VARCHAR(255),
  servicios_base JSONB DEFAULT '[]'::jsonb,
  adicionales JSONB DEFAULT '[]'::jsonb,
  menu_seleccionado VARCHAR(255),
  minimo_tarjetas INTEGER,
  valor_tarjeta_adulto FLOAT,
  valor_tarjeta_adolescente FLOAT,
  valor_tarjeta_nino FLOAT,
  estado VARCHAR(255),
  fecha_envio TIMESTAMP,
  created_by_user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Calendar Dates table
CREATE TABLE IF NOT EXISTS calendar_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  estado_fecha VARCHAR(255),
  fuente VARCHAR(255),
  lead_id UUID,
  evento_id UUID,
  nota TEXT,
  google_event_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  tipo VARCHAR(255),
  canal VARCHAR(255),
  direction VARCHAR(255),
  descripcion TEXT,
  fecha TIMESTAMP,
  created_by_user_id UUID,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  fecha_visita TIMESTAMP,
  resultado VARCHAR(255),
  notas TEXT,
  created_by_user_id UUID,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  lead_id UUID,
  evento_id UUID,
  assigned_to_user_id UUID,
  estado VARCHAR(255),
  prioridad VARCHAR(255),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Lead Status History table
CREATE TABLE IF NOT EXISTS lead_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  estado_anterior VARCHAR(255),
  estado_nuevo VARCHAR(255),
  motivo VARCHAR(255),
  changed_by_user_id UUID,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE,
  calendar_date_id UUID NOT NULL,
  monto_senia FLOAT,
  fecha_pago DATE,
  metodo_pago VARCHAR(255),
  comprobante_url VARCHAR(255),
  estado VARCHAR(255),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_date_id) REFERENCES calendar_dates(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  lead_id UUID,
  monto FLOAT NOT NULL,
  tipo VARCHAR(255),
  metodo_pago VARCHAR(255),
  fecha_pago DATE,
  estado VARCHAR(255) DEFAULT 'pendiente',
  observacion TEXT,
  created_by_user_id UUID,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_estado_actual ON leads(estado_actual);
CREATE INDEX IF NOT EXISTS idx_leads_anio_evento ON leads(anio_evento);
CREATE INDEX IF NOT EXISTS idx_events_lead_id ON events(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendar_dates_fecha ON calendar_dates(fecha);
CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
