# CarolinaOS — Resumen operativo

Para el equipo de Carolina Eventos. Explica cómo se trabaja en el sistema de punta a punta. Versión del 22/09/2026.

## La idea en una línea

Hay dos mundos: **la venta** (CRM Leads: desde que alguien consulta hasta que reserva o se pierde) y **la organización** (Eventos: la fiesta ya vendida). El pasaje de uno al otro es automático cuando la reserva queda confirmada.

## El recorrido de una venta

| Paso | Qué hace el equipo | Qué hace el sistema |
|---|---|---|
| 1. Consulta | Cargar el lead en CRM Leads: nombre, teléfono, tipo de evento, fecha tentativa, canal. | Queda en **Lead nuevo**. |
| 2. Visita | En la ficha del lead, Editar y cargar la fecha de visita al salón. | Pasa a **Visita agendada** y la visita aparece en el Calendario. |
| 3. Visita hecha | Cambiar el estado a **Visita realizada** (botón o arrastrando la tarjeta en el Kanban). | Crea el borrador del contrato en Contratos. |
| 4. Seña | En la ficha del lead, **Registrar seña**: monto, fecha, método. Puede ser antes o en el momento del contrato. | Reserva la fecha en el Calendario (Reservada) y guarda la seña. |
| 5. Contrato | En Contratos, completar y marcar **Firmada**. | Registra la fecha de firma. |
| 6. Reserva confirmada | Nada. | Cuando están las tres cosas (seña, fecha reservada, contrato firmado), el lead pasa solo a **Reserva confirmada** y se crea el **Evento** con los datos del contrato, la seña como primer pago confirmado y la fecha confirmada en el Calendario. |
| Perdido | Si no avanza: estado **Perdido** y elegir el motivo. | Guarda el motivo para los reportes. |

El orden de la seña y el contrato no importa: el sistema chequea las tres condiciones cada vez que se cumple una. Si alguien intenta marcar Reserva confirmada a mano y falta algo, el sistema lo rechaza y dice qué falta. La ficha del lead muestra el cuadro **Reserva** con las tres condiciones tildadas.

## Clientes y seguimiento

- **Cliente y lead son cosas distintas.** El cliente es la persona o empresa, permanente. Cada consulta es un lead. Un cliente con dos fiestas tiene dos leads. Al cargar un lead, si la persona ya es cliente se la elige arriba del formulario; si no, se crea sola con los datos de contacto.
- **Seguimiento por lead:** responsable, próximo paso y fecha de vencimiento. Se cargan desde Editar. En la lista y en el tablero, un próximo paso vencido se ve en rojo. El último contacto sale de la última interacción.

## La organización del evento

- El evento aparece en **Eventos** con los datos del contrato, la fecha, los servicios y la seña ya cobrada.
- **Ficha del evento**: arriba total contratado, cobrado y saldo; abajo pestañas Datos, Servicios, Producción, Invitados, Pagos y Portal. Se abre desde Eventos, desde Alertas, desde el Calendario y desde Pagos.
- **Estado del evento**: En planificación → Próximo evento (a 30 días, solo) → Evento realizado (al día siguiente de la fecha, solo; no se puede marcar antes) → Post-evento / cerrado (cuando se completan las tareas post-evento). Se cambia arrastrando en el tablero de Eventos o desde la pestaña Producción.
- **Tareas post-evento**: al pasar a Evento realizado se crean solas: verificar saldos, verificar devoluciones, registrar incidencias, mensaje de agradecimiento al día siguiente, pedido de feedback y reseña a los dos días. Se tildan en la ficha o en Tareas.
- **Alertas**: eventos de los próximos 30 días con servicios, combo y saldo. En el Dashboard, la campanita muestra un resumen.

## Reglas fijas

- Perdido siempre pide motivo: Precio, Fecha no disponible, Eligió otro salón, Canceló el evento, No respondió, Otro (con descripción).
- Reserva confirmada exige seña + fecha reservada + contrato firmado. No hay excepción manual.
- El estado del contrato (Enviada, Aprobada, Rechazada) no mueve el lead. Solo Firmada cuenta, y solo como una de las tres condiciones.
- No puede haber dos clientes con la misma fecha reservada o confirmada.
- Los pagos no se borran: se anulan y se carga el correcto. El total cobrado solo suma pagos confirmados.
- Los leads marcados como **históricos** (cartera anterior a la app) no cuentan en la conversión ni en el embudo.

## Qué mirar cada día

1. **Dashboard**: leads, conversión, eventos, saldo por cobrar a 30 días. Cada tarjeta lleva a su sección.
2. **CRM Leads en Kanban**: qué hay en cada estado y qué leads llevan tiempo sin moverse.
3. **Alertas**: qué fiesta viene, qué falta cobrar, qué combo de cotillón hay que preparar.

## Qué validar en esta entrega

- Un lead nuevo recorre consulta → visita → seña + contrato → Reserva confirmada sin pasos intermedios.
- Marcar Perdido obliga a elegir motivo y el reporte de motivos lo muestra.
- Al cumplirse las tres condiciones se crea el evento solo, con seña, saldo y fecha correctos.
- Un evento con fecha pasada figura Realizado sin tocar nada.
- Las fechas se ven bien en todos lados, incluido el alta de pago.
