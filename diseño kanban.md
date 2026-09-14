para una vista kanba que tiene muchos elemento como conviene acomodar eso ? un scroll infinito no me parece buena idea .. un paginado dentro del kanba quizas ?osea en cada columna .. y una vista de maximo 5 ? algo asi quizas?

Sí, un scroll infinito dentro de un Kanban con muchas columnas suele terminar siendo bastante incómodo. Y paginar cada columna técnicamente funciona, pero tiene un problema: para drag & drop empezás a mover tarjetas entre “páginas invisibles”.

Yo haría un enfoque híbrido:

Máximo 5–8 tarjetas visibles por columna en la vista normal.
Header tipo Pendiente · 37 para que siempre se vea el total.
Abajo: Ver 32 más.
Al tocarlo, esa columna puede expandirse o abrir un panel lateral/modal con listado completo y ahí sí usar paginado de 10/20.
Mantener arriba las tarjetas según el criterio importante: más recientes, próximas a vencer, prioridad, etc.
Agregar búsqueda/filtros globales para que el Kanban nunca tenga que representar literalmente cientos de elementos.

Algo así:

┌────────────────────┐
│ Pendiente      37  │
├────────────────────┤
│ Cliente A           │
│ Cliente B           │
│ Cliente C           │
│ Cliente D           │
│ Cliente E           │
│                    │
│ Ver 32 más →       │
└────────────────────┘

Y al abrir:

Pendiente — 37

[ Buscar... ]     [10 ▼]

1  Cliente A
2  Cliente B
3  Cliente C
...
10 Cliente J

←  1  2  3  4  →

Para mí es mejor esto que meter paginación visible directamente abajo de cada columna tipo 1 2 3 4, porque con 5 columnas terminás teniendo cinco paginadores distintos y visualmente se vuelve un quilombo.

Además, en mobile haría algo todavía más agresivo: 3–5 cards por estado y Ver todos. Incluso podés cambiar las columnas por tabs:

[ Pendiente 37 ] [ En proceso 12 ] [ Cerrado 81 ]

┌───────────────┐
│ Card          │
├───────────────┤
│ Card          │
├───────────────┤
│ Card          │
└───────────────┘

Ver todos los 37

Para un CRM / sistema de gestión, mi elección sería 5 por defecto, selector opcional 5 / 10, contador total y “Ver todos” por columna. El Kanban queda como vista rápida de trabajo, no como lugar para visualizar los 300 registros simultáneamente. Ahí sí me parece mucho más limpio.

me gusta una version asi .. si 
gracias .. la vy a  implementar 

Sí, me parece una buena decisión. Te va a mantener el Kanban usable y rápido, sobre todo cuando empiecen a crecer los registros.

La combinación de 5 visibles + contador total + “Ver más” por columna te da bastante margen sin complicar la UX. Y si después ves que una columna concentra muchísimos elementos, podés evolucionar ese “Ver más” a drawer/panel con búsqueda y paginado sin tocar demasiado la vista principal.

Para drag & drop, yo además mantendría siempre visibles esos primeros 5 según un orden consistente —por prioridad, fecha o último movimiento— para que el comportamiento no sorprenda al usuario.