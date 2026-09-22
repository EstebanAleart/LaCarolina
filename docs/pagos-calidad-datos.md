# Pagos: origen y calidad de los datos (R-04)

**Fecha del análisis:** 14/09/2026, sobre copia de prod (`backups-local/prod_sept2026.dump`).
**Registros:** 150 pagos.

## Origen

No hubo importación masiva. Los 150 pagos se cargaron **a mano desde la app** (módulo Pagos),
entre el 10/03/2026 y el 26/08/2026, en 17 días distintos. Las jornadas de carga inicial fueron
el 18, 19 y 20 de marzo (95 pagos). Los scripts `import-*.js` del repo restauran backups en la
base local; no importan datos de planillas.

## Pares anulado / confirmado con diferencia de $1 o $2

Son 5, todos de marzo de 2026. En cada par, el registro anulado se creó **entre 16 y 58 segundos
antes** que el confirmado con el monto redondo: la operadora cargó el pago, el monto quedó $1 o $2
abajo, lo anuló y lo volvió a cargar bien.

| Cliente | Anulado | Confirmado | Fecha | id anulado |
|---|---|---|---|---|
| Fabian Gallardo | 149.999 | 150.000 | 11/03 | `61a15ad9-9fd3-42f8-8c0d-f3f59eef8170` |
| Mirta Arocha | 249.999 | 250.000 | 18/03 | `f3913e9d-aecf-48d4-87fb-160ae95859f0` |
| Valeria Velacoz | 399.999 | 400.000 | 19/03 | `7a312de2-f650-4e42-b4a4-9d00d17f2b90` |
| Rocio Acuña | 549.998 | 550.000 | 19/03 | `b9501ae7-d951-4305-8dc0-51469e313cae` |
| Augusto Argutti | 199.999 | 200.000 | 19/03 | `683cb0ad-9ba9-41b8-af3a-dddb875e6810` |

**Causa:** hasta el 06/04/2026 el campo Monto era un `<input type="number">`. Ese tipo de input
cambia el valor con la rueda del mouse o las flechas del teclado mientras tiene el foco, y muestra
flechitas de +1/−1. Ese día el input de Pagos pasó a texto con puntos de miles (commit `a9fbc7a`)
y no volvieron a aparecer casos. Quedaban 12 inputs numéricos con el mismo problema en otras
pantallas (ficha del evento, stock, reportes, leads, dashboard).

**Corrección (este cambio):** guardia global que anula rueda y flechas ↑↓ en todo input numérico
(`components/providers/number-input-guard.jsx`) y CSS que oculta las flechitas (`app/globals.css`).
No hace falta tocar cada pantalla.

**Impacto en totales: ninguno.** Todos los cálculos de cobrado (Pagos, ficha del evento,
`estado_pago`, alertas) cuentan solo pagos `confirmado`. Los 13 anulados (5 espurios + 8 anulaciones
reales) suman $3.929.994 y no entran. Total cobrado confirmado: $63.902.500.

**Decisión sobre los 5 registros:** se dejan como están (anulados). Son la traza de lo que pasó y no
afectan nada. Si se prefiere borrarlos, es un `DELETE` por id sobre los 5 de la tabla; lo corre el dueño.

## Columna Concepto vacía (150 de 150)

**Causa:** el formulario de Pagos siempre mandó el concepto (Salon / Tarjeta / Otro), pero ni el
modelo Sequelize `Payment` ni el `POST /api/payments` conocían el campo, así que se descartaba antes
de llegar a la base. La columna `concepto` existe en la tabla desde antes.

**Corrección (este cambio):** el modelo y el POST guardan `concepto`. El form de pagos de la ficha
del evento ahora también lo manda, preseleccionado según el servicio (Salón → Salon,
Tarjetas / Catering → Tarjeta, el resto → Otro) y editable.

**Los 150 pagos viejos quedan sin concepto.** Completarlos requiere que alguien sepa qué fue cada
pago; el sistema no lo puede inferir. Si se decide completarlos, se hace por `UPDATE` sobre la
tabla, lo corre el dueño. Mientras tanto, en el listado se muestran como "—".
