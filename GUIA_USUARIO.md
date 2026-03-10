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
| 7 | Propuesta Aceptada | El cliente acepto verbalmente | ⚡ Al marcar propuesta como "Aprobada" |
| 8 | Propuesta Rechazada | El cliente rechazo | ⚡ Al marcar propuesta como "Rechazada" |
| 9 | Esperando Reserva | En negociacion de senal | Manual |
| 10 | Reserva tomada | Pago la senal | ⚡ Al confirmar fecha como "Reservada" en calendario |
| 11 | Contrato firmado | Firmo el contrato | ⚡ Al marcar contrato como "Firmada" O al confirmar fecha como "Confirmada" en calendario |
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

## 3. Contratos

La seccion antes llamada "Propuestas" ahora se llama **Contratos**. Incluye todos los datos del acuerdo comercial con el cliente.

### Crear contrato

1. Ir a **Contratos** → **"Nuevo Contrato"**
2. Seleccionar el lead asociado
3. Completar los campos del contrato (ver tabla abajo)
4. El contrato se crea como **Creada**

### Campos del contrato

| Seccion | Campo | Detalle |
|---|---|---|
| Evento | Tipo de evento | Se copia al Evento al firmar |
| Evento | Cantidad de invitados estimados | Se copia al Evento al firmar |
| Financiero | Precio de seña ($) | Monto del anticipo/seña. Se copia al Evento al firmar |
| Financiero | Valor total del evento ($) | Precio total acordado. Se copia al Evento al firmar |
| Financiero | Modalidad de actualizacion de precios | Precio fijo / Por tarjeta / Mixto. Se copia al Evento |
| Servicios base | Salon / Catering | Seleccion multiple. Se copia al Evento al firmar |
| Adicionales | Nombre + opciones de precio | Ver detalle abajo. Se copian al Evento al firmar |
| Produccion | Menu seleccionado | Se copia al Evento al firmar |
| Produccion | Minimo de tarjetas | Se copia al Evento al firmar |
| Produccion | Valor tarjeta Adulto / Adolescente / Niño | Se copia al Evento al firmar |
| Notas | Condiciones especiales | Texto libre |

### Adicionales con multiples opciones de precio

Cada adicional (DJ extra, Fotografia, Decoracion, etc.) puede tener **mas de una opcion de precio**. El cliente elige una al firmar.

- Click **"Agregar Adicional"** → escribir el nombre del servicio
- Click **"Agregar otra opcion"** → agregar descripcion y precio por opcion
- Hacer click en el **circulo verde** a la izquierda de la opcion para marcarla como elegida por el cliente
- La opcion elegida se muestra destacada en verde en la vista de detalle

### Ciclo de estados de un contrato

```
Creada → Enviada → Aprobada → Firmada
                ↘ Rechazada
                            ↘ Rechazada
```

| Estado | Significado | Botones disponibles |
|---|---|---|
| Creada | Borrador inicial, no enviado al cliente | Enviar / Editar |
| Enviada | Enviado al cliente, esperando respuesta | Aprobar / Rechazar / Editar |
| Aprobada | El cliente aprueba verbalmente | Firmar / Editar |
| Rechazada | El cliente rechazo | — |
| Firmada | Contrato firmado fisicamente — **estado final** | Imprimir (solo lectura) |

| Accion | Efecto en el contrato | Efecto automatico en el lead | Efecto en el Evento |
|---|---|---|---|
| Click "Enviar" | → Enviada + registra fecha de envio | Lead → "Propuesta enviada" | — |
| Click "Aprobar" | → Aprobada | Lead → "Propuesta Aceptada" | — |
| Click "Rechazar" | → Rechazada | Lead → "Propuesta Rechazada" | — |
| Click "Firmar" | → Firmada | Lead → "Contrato firmado" + auto-set fecha firma | Crea o actualiza con TODOS los datos del contrato. Crea CalendarDate "Confirmada" si hay fecha tentativa |

> Al **firmar** un contrato, todos los campos (invitados, seña, servicios, adicionales, tarjetas, etc.) se copian automaticamente al Evento.
> Si el Evento aun no existe, se crea automaticamente con los datos del contrato.

> Un contrato **Firmada** es inmutable: no tiene boton Editar. Solo tiene el boton **Imprimir**.
> Los botones se deshabilitan mientras cualquier peticion esta en curso para evitar doble envio.

### Editar contrato

Los contratos en estado **Creada**, **Enviada** o **Aprobada** tienen un boton **Editar** (lapiz) que abre el formulario completo precargado con todos los datos actuales.

Los contratos en estado **Firmada** son inmutables: no tienen boton Editar. Solo muestran el boton **Imprimir**.

### Ver detalle del contrato

El boton **Ver** (ojo) abre un modal con todos los campos: financiero, produccion, servicios base, adicionales con sus opciones (resaltando la elegida) y notas.

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

### Multiples entradas por dia

Un mismo dia puede tener varias entradas (por ejemplo, tres visitas distintas). Al hacer click en un dia con entradas existentes, el modal muestra la lista de entradas con opciones para **Editar** o **Eliminar** cada una, y un boton **"Agregar otra entrada"** para sumar una nueva.

### Reglas importantes

- Puede haber multiples entradas (Visita, Bloqueada, etc.) en el mismo dia
- No pueden existir dos leads DISTINTOS con estado Reservada o Confirmada en el mismo dia (un solo evento por fecha)
- Al cargar fecha de visita en el lead, se crea automaticamente un registro de Visita en el calendario para ese lead
- Al confirmar un evento, se crea automaticamente el evento en el modulo Eventos

### Gestionar entradas de un dia

Click en el dia → el modal muestra las entradas existentes con botones **Editar** / **Eliminar** por entrada → **Agregar otra entrada** para sumar una nueva.

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
| Marcar propuesta como "Aprobada" | Lead → "Propuesta Aceptada" |
| Marcar propuesta como "Rechazada" | Lead → "Propuesta Rechazada" |
| Marcar propuesta como "Firmada" | Lead → "Contrato firmado" + auto-set fecha firma + copia datos al Evento + CalendarDate "Confirmada" (si hay fecha tentativa) |
| Reservar fecha con lead en calendario | Lead → "Reserva tomada" + crea Reservation + propuesta → "Aprobada" |
| Confirmar fecha con lead en calendario | Lead → "Contrato firmado" + crea Event con datos del contrato + propuesta → "Firmada" |
| Lead pasa a "Enviar propuesta" | Tarea de alta prioridad (vence en 1 dia) |
| Lead pasa a "Propuesta enviada" | Tarea de seguimiento (vence en 3 dias) |
| Lead pasa a "Contrato firmado" (con fecha tentativa) | Crea Event con datos del contrato firmado + CalendarDate "Confirmada" + auto-set fecha firma |
| Lead pasa a "Reserva tomada" | Ultima propuesta → "Aprobada" |
| Lead pasa a "Contrato firmado" o "Cliente activo" | Ultima propuesta → "Firmada" |
| Lead pasa a "Perdido" | Ultima propuesta → "Rechazada" (si no estaba Firmada o Rechazada) |
| Cambiar valor estimado del lead | Actualiza precio_total de la ultima propuesta |

Todos los cambios de estado automaticos quedan registrados en el historial del lead con motivo descriptivo.

---

## Filtros disponibles

| Vista | Filtros |
|---|---|
| Leads | Buscar nombre/email/telefono, filtrar por año, estado, canal |
| Contratos | Filtrar por estado (Creada, Enviada, Aprobada, Rechazada, Firmada) |
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
