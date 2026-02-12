# CarolinaOS - Guia de Usuario

Sistema de gestion para salones de eventos. Desde el primer contacto hasta el evento realizado.
> La guia tambien esta disponible dentro de la plataforma en el menu lateral → **Guia**.

---

## Acceso al Sistema

### Primer ingreso (usuarios demo)
Al abrir la app por primera vez se crean 3 usuarios automaticamente:

| Email | Password | Rol |
|---|---|---|
| carolina@lacarolina.com | admin123 | Admin |
| maria@lacarolina.com | comercial123 | Comercial |
| luis@lacarolina.com | operaciones123 | Operaciones |

### Registrar nuevo usuario
1. Click en "Registrate aqui" en la pantalla de login
2. Completar nombre, email y password (minimo 6 caracteres)
3. Al registrarse, la cuenta queda **pendiente de aprobacion**
4. Un administrador debe activar la cuenta para que pueda ingresar

---

## Flujo Principal de Trabajo

```
CONSULTA  →  PROPUESTA  →  NEGOCIACION  →  RESERVA  →  EVENTO
 INICIAL      ENVIADA                       TOMADA     CONFIRMADO
```

### 1. Crear un Lead (nuevo contacto)
- Ir a **CRM Leads** en el menu lateral
- Click en **"Nuevo Lead"**
- Completar: nombre (obligatorio), telefono, email, canal de origen, tipo de evento, fecha tentativa, valor estimado
- El lead se crea con estado **"Consulta inicial"**

### 2. Gestionar el Lead
Desde la vista de leads, click en el nombre o el icono de ojo para abrir el **panel de detalle**:

- **Cambiar Estado**: Click en "Cambiar Estado" y seleccionar el nuevo estado
  - Si se marca como "Perdido", es obligatorio escribir un motivo
- **Registrar Interacciones**: En la pestana "Interacciones", seleccionar tipo (WhatsApp, Llamada, Email, Reunion) y escribir la descripcion
- **Timeline**: Muestra todo el historial del lead (cambios de estado, interacciones, propuestas)

### 3. Crear una Propuesta
- Ir a **Propuestas** en el menu lateral
- Click en **"Nueva Propuesta"**
- Seleccionar el lead, escribir contenido y precio total
- La propuesta se crea como **"Borrador"**

**Ciclo de la propuesta:**
- **Borrador** → click "Enviar" → pasa a **Enviada** (se registra fecha de envio)
- **Enviada** → click "Aceptar" o "Rechazar"

> Las propuestas se actualizan automaticamente cuando cambia el estado del lead:
> - Lead pasa a "Reserva tomada" o "Evento confirmado" → ultima propuesta pasa a **Aceptada**
> - Lead pasa a "Perdido" → ultima propuesta pasa a **Rechazada**

### 4. Calendario - Reservar una Fecha
- Ir a **Calendario** en el menu lateral
- Click en el dia que se quiere gestionar
- Se abre un modal con opciones:

**Estados de fecha:**
| Color | Estado | Significado |
|---|---|---|
| Verde claro | Disponible | Fecha libre |
| Amarillo | Bloqueada | Fecha bloqueada (sin lead asociado) |
| Azul | Reservada | Fecha reservada para un lead |
| Verde | Confirmada | Evento confirmado en esa fecha |
| Violeta | Tentativa | Lead tiene fecha_tentativa en ese dia (se muestra automaticamente) |

**Reservar una fecha:**
1. Click en el dia
2. Si hay leads con fecha tentativa en ese dia, aparecen en violeta. Click para seleccionar uno
3. Elegir estado **"Reservada"**
4. Click **"Guardar"**

> Al reservar con un lead, automaticamente:
> - El lead pasa a estado "Reserva tomada"
> - Se limpia la fecha tentativa (desaparece el marcador violeta)
> - Se crea un registro de Reservation
> - La ultima propuesta del lead pasa a "Aceptada"

**Confirmar una fecha:**
1. Click en el dia que ya esta Reservada
2. Cambiar estado a **"Confirmada"**
3. Click **"Guardar"**

> Al confirmar, automaticamente:
> - El lead pasa a estado "Evento confirmado"
> - Se crea un registro de Event (con tipo de evento del lead)
> - Aparece en la vista de Eventos

**Liberar una fecha:**
- Click en el dia → click **"Liberar fecha"** (boton rojo)

### 5. Eventos
- Ir a **Eventos** en el menu lateral
- Se muestran todos los eventos confirmados
- Click en un evento para expandir el detalle

**Estado operativo del evento:**
| Estado | Significado |
|---|---|
| Pendiente | Evento registrado, sin preparacion |
| En preparacion | Se esta organizando el evento |
| Listo | Todo preparado para el dia del evento |
| Realizado | El evento ya se llevo a cabo |

Desde el detalle expandido se puede:
- Cambiar el estado operativo (click en los botones)
- Editar tipo de evento e invitados estimados
- Ver datos de contacto del lead

### 6. Tareas
- Ir a **Tareas** en el menu lateral
- Vista **Kanban** con 4 columnas: Pendiente / En Proceso / Hecho / Cancelado

**Crear tarea:**
1. Click en **"Nueva Tarea"**
2. Completar: titulo (obligatorio), descripcion, lead asociado (opcional), asignar a usuario, prioridad, fecha limite

**Cambiar estado:**
- Click en el icono circular de la tarea para rotar: Pendiente → En Proceso → Hecho → Pendiente

**Tareas automaticas:**
- Cuando un lead pasa a "Propuesta enviada", se crea automaticamente una tarea de seguimiento con prioridad Alta y vencimiento en 3 dias

### 7. Dashboard
- Ir a **Dashboard** en el menu lateral
- Muestra metricas generales:
  - Total de leads por estado (pipeline)
  - Leads por canal de origen
  - Tareas vencidas
  - Eventos proximos
  - Graficos de barras y torta

---

## Filtros Disponibles

| Vista | Filtros |
|---|---|
| Leads | Buscar por nombre/email/telefono, filtrar por ano, estado, canal |
| Propuestas | Filtrar por estado (Borrador, Enviada, Aceptada, Rechazada) |
| Eventos | Filtrar por estado operativo |
| Tareas | Filtrar por estado, filtrar por usuario asignado |

---

## Vistas disponibles

| Vista | Que muestra | Como se accede |
|---|---|---|
| **Dashboard** | Metricas y graficos | Menu lateral |
| **CRM Leads** | Todos los contactos (tabla o kanban) | Menu lateral |
| **Calendario** | Fechas con estados y tentativas | Menu lateral |
| **Propuestas** | Propuestas comerciales por estado | Menu lateral |
| **Eventos** | Eventos confirmados y su estado | Menu lateral |
| **Tareas** | Panel kanban de tareas | Menu lateral |

---

## Tipos de Evento

- Fiesta de 15
- Egresados
- Casamiento
- Evento Corporativo
- Otro

---

## Automatizaciones del Sistema

El sistema ejecuta estas acciones automaticamente para mantener la consistencia:

| Accion del usuario | Que pasa automaticamente |
|---|---|
| Reservar fecha con lead en calendario | Lead → "Reserva tomada" + crea Reservation + propuesta → "Aceptada" |
| Confirmar fecha con lead en calendario | Lead → "Evento confirmado" + crea Event + propuesta → "Aceptada" |
| Cambiar lead a "Propuesta enviada" | Se crea tarea de seguimiento (prioridad Alta, vence en 3 dias) |
| Cambiar lead a "Reserva tomada" | Ultima propuesta → "Aceptada" |
| Cambiar lead a "Evento confirmado" | Ultima propuesta → "Aceptada" |
| Cambiar lead a "Perdido" | Ultima propuesta → "Rechazada" (si no estaba Aceptada) |
| Enviar propuesta (Borrador → Enviada) | Se registra fecha de envio |

---

## Notificaciones

El sistema muestra notificaciones tipo "toast" en la esquina superior derecha:
- **Verde**: Operacion exitosa
- **Rojo**: Error
- **Amarillo**: Advertencia o validacion

Para eliminar un lead se pide confirmacion via toast con boton "Eliminar" / "Cancelar".

---

## Navegacion

- **Desktop**: Menu lateral izquierdo, se puede colapsar con la flecha
- **Mobile**: Boton hamburguesa (tres lineas) arriba a la izquierda para abrir el menu
