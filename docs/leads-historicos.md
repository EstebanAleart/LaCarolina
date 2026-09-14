# Leads: cartera histórica y métricas del dashboard (R-03)

**Fecha del análisis:** 14/09/2026, sobre copia de prod (`backups-local/prod_sept2026.dump`).
**Registros:** 108 leads, 104 eventos.

## Por qué el dashboard decía 96% de conversión

La tasa se calculaba como eventos ÷ leads sobre toda la tabla: 104 ÷ 108 = 96%. Y el pipeline
mostraba 103 de 108 leads en "Contrato firmado". Dos causas, las dos de datos, no de código:

1. **Carga inicial de la cartera (marzo 2026).** No hubo importación por script: entre el 10 y
   el 25 de marzo de 2026 se cargaron a mano **72 leads**, 71 ya con contrato firmado y evento.
   Eran los clientes que la empresa ya tenía antes de usar la app, con fiestas de 2026 a 2028.
   En 63 de ellos el historial de estados completo (propuesta enviada, aprobada, firmada) se
   generó en menos de 2 minutos desde el alta: se cargaron directamente como firmados.
2. **Práctica de carga posterior.** Del 26 de marzo en adelante entraron 36 leads, y 32 también están
   firmados. La operación carga al cliente cuando firma (o cuando visita el salón), no en el
   primer contacto. Con esa práctica la conversión siempre va a dar alta, porque el sistema no
   ve a los que no firmaron.

| Grupo | Leads | Firmados | Eventos | Conversión |
|---|---|---|---|---|
| Hasta el 25/03/2026 (carga inicial) | 72 | 71 | 72 | 100% |
| Del 26/03/2026 en adelante | 36 | 32 | 32 | 89% |
| Total (lo que mostraba el dashboard) | 108 | 103 | 104 | 96% |

## Qué se hizo

- **Etiqueta `es_historico` en leads** (migración `migrations/004_leads_historico.sql`, la corre el
  dueño). Marca como históricos los 72 leads creados hasta el 25 de marzo de 2026 inclusive, última
  jornada de carga masiva. Los 3 leads del 31 de marzo quedan operativos: uno de ellos firmó recién
  en mayo, o sea que fue un prospecto real. Es una columna editable: si algún lead de marzo era un
  prospecto real, se destilda por SQL.
- **Dashboard y Reportes** calculan conversión, pipeline y canal de origen **sin los históricos**,
  y muestran cuántos quedaron afuera. Los eventos, pagos, calendario y alertas de esos clientes
  no cambian en nada.
- **Chip "Histórico"** en la lista y en la ficha del lead.

Con la migración aplicada el dashboard pasa a mostrar **36 leads operativos, 89% de conversión,
72 históricos**.

## Qué no arregla el código

El 89% sigue sin ser una tasa de conversión real, por la causa 2. Para tener un número defendible
hay que cargar el lead en el primer contacto (consulta por Instagram, WhatsApp, referido) y dejar
que pase por los estados hasta firmar o perderse. Es un cambio de práctica de Sol y su equipo, no
de la app. Desde que se haga eso, la tasa del dashboard mide lo que dice medir.
