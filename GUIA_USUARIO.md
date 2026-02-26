# CarolinaOS - Guia de Usuario

Sistema de gestion para salones de eventos. Desde el primer contacto hasta el evento realizado.
> La guia tambien esta disponible dentro de la plataforma en el menu lateral → **Guia**.

---

## Acceso al Sistema

### Registrar nuevo usuario
1. Click en "Registrate aqui" en la pantalla de login
2. Completar nombre, email y password (minimo 6 caracteres)
3. Al registrarse, la cuenta queda **pendiente de aprobacion**
4. Un administrador debe activar la cuenta para que pueda ingresar

---

## Flujo Principal de Trabajo

```
LEAD NUEVO → CONTACTADO → ESPERANDO VISITA → VISITA REALIZADA → PROPUESTA → RESERVA → CONTRATO → EVENTO
```

---

## 1. CRM Leads

### Crear un lead

1. Ir a **CRM Leads** en el menu lateral → **"Nuevo Lead"**
2. Completar los campos:

| Campo | Obligatorio | Detalle |
|---|---|---|
| Nombre | SI | Nombre completo del contacto |
| Canal de origen | SI | WhatsApp, Web, Referido, Instagram, etc. |
| Tipo de evento | SI | Fiesta de 15, Casamiento, Egresados, etc. |
| Fecha del evento | No | Fecha tentativa del evento |
| Valor estimado | No | Escribir el numero, los puntos de miles se agregan solos (ej: `1500000` → `1.500.000`) |
| Cantidad de invitados | No | Se copia automaticamente al evento al firmar contrato |
| Fecha visita al salon | No | Al cargarla, el estado pasa automaticamente a "Esperando visita" |

### Pipeline de estados

Los leads siguen este flujo. Los estados con ⚡ cambian **automaticamente**:

| # | Estado | Cuando ocurre | Avance |
|---|---|---|---|
| 1 | Lead nuevo | Al crearse en el sistema | — |
| 2 | Contactado | Se establecio contacto | ⚡ Al registrar primera interaccion saliente |
| 3 | Esperando visita | Visita agendada | ⚡ Al cargar fecha de visita al salon |
| 4 | Visita al salon realizada | Fue al salon | Manual |
| 5 | Enviar propuesta | Hay que preparar propuesta | Manual |
| 6 | Propuesta enviada | Se envio la propuesta | ⚡ Al marcar propuesta como "Enviada" |
| 7 | Propuesta Aceptada | El cliente acepto | ⚡ Al marcar propuesta como "Aceptada" |
| 8 | Propuesta Rechazada | El cliente rechazo | ⚡ Al marcar propuesta como "Rechazada" |
| 9 | Esperando Reserva | En negociacion de senal | Manual |
| 10 | Reserva tomada | Pago la senal | ⚡ Al confirmar fecha como "Reservada" en calendario |
| 11 | Contrato firmado | Firmo el contrato | ⚡ Al confirmar fecha como "Confirmada" en calendario |
| 12 | Cliente activo | Evento proximo | Manual |
| 13 | Evento realizado | El evento ocurrio | Manual |
| 14 | Post-evento / cerrado | Cierre total | Manual |
| 15 | Perdido | No avanzo (requiere motivo) | Manual |

### Cambiar estado manualmente

Desde el detalle del lead → boton **"Cambiar estado"** → seleccionar nuevo estado → **Confirmar**.

- Para "Perdido" es obligatorio escribir un motivo
- El boton se deshabilita durante el procesamiento (evita doble click)

### Editar un lead

Click en el icono de lapiz (✏️) en la lista de leads.

- El campo **Fecha de firma de contrato** solo aparece a partir del estado "Visita al salon realizada"
- El campo **Fecha limite de pago** se calcula automaticamente (fecha evento - 30 dias), no es editable

### Vistas disponibles

- **Vista lista**: tabla con busqueda por nombre/email/telefono, filtros por año, estado y canal
- **Vista Kanban**: board por columnas de estado. El board ocupa el alto de pantalla disponible y cada columna scrollea internamente
- **Vista movil**: cards desplegables por lead, sin scroll horizontal

### Detalle de un lead (Timeline)

Click en un lead para abrir el panel lateral. Muestra pestanas:
- **Timeline**: historial cronologico de interacciones, visitas, cambios de estado y propuestas
- **Interacciones**: registrar contactos
- **Propuestas**: propuestas asociadas al lead

---

## 2. Interacciones

Desde el detalle del lead, pestana **Timeline** → seccion "Registrar interaccion".

| Tipo | Descripcion | Efecto automatico |
|---|---|---|
| Saliente (OUT) | Vos contactaste al lead | ⚡ Si el lead esta en "Lead nuevo", pasa a "Contactado" |
| Entrante (IN) | El lead te contacto a vos | Sin efecto automatico |

Canales disponibles: WhatsApp, Llamada, Email, Reunion, Web.

---

## 3. Propuestas

### Crear propuesta

1. Ir a **Propuestas** → **"Nueva Propuesta"**
2. Seleccionar el lead asociado
3. Escribir el contenido (descripcion de servicios, condiciones, precios)
4. Ingresar el precio total
5. La propuesta se crea como **Borrador**

### Ciclo de estados de una propuesta

```
Borrador → Enviada → Aceptada
                  ↘ Rechazada
```

| Accion | Efecto en la propuesta | Efecto automatico en el lead |
|---|---|---|
| Click "Enviar" | Propuesta → Enviada + registra fecha de envio | Lead → "Propuesta enviada" |
| Click "Aceptar" | Propuesta → Aceptada | Lead → "Propuesta Aceptada" |
| Click "Rechazar" | Propuesta → Rechazada | Lead → "Propuesta Rechazada" |

> Los botones se deshabilitan durante el procesamiento para evitar doble envio.

### Ver propuesta

Cada card de propuesta tiene un boton **Ver** (👁) que abre un modal con el contenido completo, estado, precio total y fecha de envio.

---

## 4. Calendario

### Estados de fecha

| Estado | Significado |
|---|---|
| Disponible | Sin reserva |
| Visita | Hay una visita al salon agendada ese dia |
| Bloqueada | Fecha bloqueada manualmente |
| Reservada | Senal tomada → lead pasa a "Reserva tomada" automaticamente |
| Confirmada | Contrato firmado → lead pasa a "Contrato firmado" automaticamente |

### Reglas importantes

- No pueden existir dos leads en la misma fecha con estado Reservada o Confirmada
- Al cargar fecha de visita en el lead, se crea automaticamente un registro de Visita en el calendario
- Al confirmar un evento, se crea automaticamente el evento en el modulo Eventos

### Liberar una fecha

Click en el dia → boton **"Liberar fecha"** (rojo).

---

## 5. Eventos

Muestra los eventos con contrato firmado. Click en un evento para expandir el detalle.

### Campos editables

| Campo | Detalle |
|---|---|
| Invitados estimados | Cantidad inicial copiada del lead, editable |
| Tipo de evento | Actualizable si cambia |
| Estado operativo | Pendiente / En preparacion / Listo / Realizado |
| Estado de pago | Pendiente / Parcial / Completo |
| Modalidad de precios | Precio fijo / Por tarjeta / Mixto |
| Menu y tarjetas | Tipo de menu, minimo tarjetas, valores por tipo de comensal |
| Valor total | Precio acordado total |

### Registrar pagos

Desde el detalle del evento → seccion Pagos → boton **"Nuevo Pago"**:
- Monto, tipo (seña / parcial / final / devolucion), metodo, fecha, estado

---

## 6. Tareas

Vista **Kanban** con 4 columnas: **Pendiente / En Proceso / Hecho / Cancelado**.

### Crear tarea manualmente

Click en **"Nueva Tarea"** → completar titulo, descripcion, lead asociado (opcional), usuario asignado, prioridad y fecha limite.

### Cambiar estado

Click en el icono circular de la tarea para rotar: Pendiente → En Proceso → Hecho → Pendiente.

### Tareas automaticas

| Disparador | Tarea creada | Prioridad | Vencimiento |
|---|---|---|---|
| Lead pasa a "Enviar propuesta" | "Enviar propuesta - [nombre lead]" | Alta | 1 dia |
| Lead pasa a "Propuesta enviada" | "Seguimiento propuesta - [nombre lead]" | Alta | 3 dias |

---

## 7. Dashboard

Vista general con metricas del negocio:
- Total de leads activos por estado (grafico de pipeline)
- Leads por canal de origen
- Eventos proximos
- Graficos de conversion

---

## Automatizaciones completas del sistema

| Accion del usuario | Que pasa automaticamente |
|---|---|
| Crear primera interaccion saliente en un "Lead nuevo" | Lead → "Contactado" |
| Cargar fecha de visita al salon (lead en "Lead nuevo" o "Contactado") | Lead → "Esperando visita" + crea entrada Visita en calendario |
| Marcar propuesta como "Enviada" | Lead → "Propuesta enviada" |
| Marcar propuesta como "Aceptada" | Lead → "Propuesta Aceptada" |
| Marcar propuesta como "Rechazada" | Lead → "Propuesta Rechazada" |
| Reservar fecha con lead en calendario | Lead → "Reserva tomada" + crea Reservation + propuesta → "Aceptada" |
| Confirmar fecha con lead en calendario | Lead → "Contrato firmado" + crea Event con invitados del lead + propuesta → "Aceptada" |
| Lead pasa a "Enviar propuesta" | Tarea de alta prioridad (vence en 1 dia) |
| Lead pasa a "Propuesta enviada" | Tarea de seguimiento (vence en 3 dias) |
| Lead pasa a "Contrato firmado" (con fecha tentativa) | Crea Event + CalendarDate "Confirmada" + auto-set fecha firma |
| Lead pasa a "Reserva tomada" o "Contrato firmado" | Ultima propuesta → "Aceptada" |
| Lead pasa a "Perdido" | Ultima propuesta → "Rechazada" (si no estaba Aceptada) |
| Cambiar valor estimado del lead | Actualiza precio_total de la ultima propuesta |

Todos los cambios de estado automaticos quedan registrados en el historial del lead con motivo descriptivo.

---

## Filtros disponibles

| Vista | Filtros |
|---|---|
| Leads | Buscar nombre/email/telefono, filtrar por año, estado, canal |
| Propuestas | Filtrar por estado (Borrador, Enviada, Aceptada, Rechazada) |
| Eventos | Filtrar por estado operativo |
| Tareas | Filtrar por estado y usuario asignado |

---

## Notificaciones

El sistema muestra notificaciones en la esquina de la pantalla:
- **Verde**: Operacion exitosa
- **Rojo**: Error
- **Amarillo**: Advertencia o validacion

---

## Navegacion

- **Desktop**: Menu lateral izquierdo, se puede colapsar
- **Mobile**: Boton hamburguesa (tres lineas) para abrir el menu. La lista de leads muestra cards desplegables en lugar de tabla horizontal
