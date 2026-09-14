Te paso por escrito las funcionalidades que necesitamos incorporar al sistema actual.

La idea es comenzar a implementarlas ahora, ya que son necesarias para mejorar el seguimiento de eventos, servicios, pagos y stock, centralizando la información de cada cliente sin perder el control individual de cada servicio contratado.
Además, considero importante empezar a utilizarlas cuanto antes para poder probarlas en la práctica, detectar posibles mejoras o ajustes necesarios y validar que la dinámica de trabajo propuesta realmente funcione antes de seguir incorporando nuevos servicios.


IDENTIFICACIÓN VISUAL DE COTILLÓN EN EL CALENDARIO

Recientemente incorporamos el servicio de cotillón y sería importante que quede identificado de forma visual dentro del calendario qué eventos tienen cotillón contratado y qué combo tiene cada uno.
Esto debería aplicarse tanto a los eventos nuevos como a los eventos ya contratados para 2027 y 2028.
Idealmente, cada evento podría mostrar:

Si tiene cotillón contratado.
Qué combo corresponde (Combo 1, 2 o 3).
Algún indicador visual (color, etiqueta o ícono) que permita identificarlo rápidamente desde el calendario.



ALERTAS Y AVISOS PREVIOS

Necesitamos algún tipo de alerta o aviso previo que permita identificar rápidamente:

Cliente.
Fecha del evento.
Servicio contratado (Deco, pantalla, mesa dulce,cabañas, adicional).
Combo de cotillón (si corresponde).

La idea es poder configurar avisos con cierta anticipación (por ejemplo 30, 15 y 7 días antes del evento) para organizar compras, armado y logística.
CONTROL DE STOCK DE COTILLÓN

También me serviría para empezar a llevar un mejor control de stock.

Si sé con anticipación qué eventos tienen cotillón contratado y qué combo corresponde a cada uno, puedo registrar los productos que se van a utilizar, proyectar consumos futuros y prever cuándo será necesario realizar nuevas compras sin esperar a quedarnos sin mercadería
Sería ideal que:

Cada combo tenga asociados determinados productos.
El sistema permita ver el stock disponible.
Se pueda visualizar el stock comprometido para eventos futuros.
Existan alertas cuando determinados productos alcancen un mínimo definido.

Al final del documento se detalla la composición de cada uno de los combos de cotillón actualmente disponibles, a modo de referencia para la implementación de las funcionalidades mencionadas anteriormente.
REGISTRO DE SERVICIOS ADICIONALES

Actualmente necesitamos llevar seguimiento de distintos servicios que pueden contratar los clientes:
Salón.
Tarjetas / Catering.
Cotillón.
Decoración y Mobiliario (próximamente).
Pantalla
Mesa Dulce (próximamente).
Cabaña
Servicio de fotografía (próximamente).
Adicional

Por ese motivo, considero importante que el sistema quede preparado para incorporar nuevos servicios sin necesidad de modificar la estructura principal en el futuro.


SEGUIMIENTO DE PAGOS Y SALDOS

Necesito poder registrar y llevar seguimiento de los servicios contratados y de sus respectivos pagos.
Por ejemplo:

Venta de tarjetas.
Cotillón.
Decoración y Mobiliario.
Pantalla.
Otros servicios que puedan incorporarse.

El objetivo es poder:

Consultar rápidamente cuánto debe cada cliente.
Informar saldos cuando el cliente consulte.
Registrar pagos parciales o totales.
Llevar un historial de movimientos.
Tener un control administrativo más ordenado.

FICHA ÚNICA DEL EVENTO

Me gustaría que exista una ficha única por evento donde se pueda visualizar toda la información del cliente.
Sin embargo, aunque la información esté centralizada, cada servicio debería tener su propio seguimiento.
Por ejemplo:

Evento: Juan Pérez – 15/08/2027 SALÓN
Total contratado.
Cobrado.
Saldo.

TARJETAS / CATERING

Cantidad vendida.
Total contratado.
Cobrado.
Saldo.

COTILLÓN

Combo contratado.
Total contratado.
Cobrado.
Saldo.

DECORACIÓN

Estado.
Total contratado.
Cobrado.
Saldo.

MOBILIARIO

Estado.
Total contratado.
Cobrado.
Saldo.
Esto es importante porque las tarjetas corresponden al catering, mientras que el cotillón, decoración, mobiliario y otros servicios tienen una administración distinta. Por eso considero que no conviene que todos los importes se mezclen en un único saldo general.
Lo ideal sería poder ver:

El detalle por servicio.
La deuda total por servicio.
Un resumen general consolidado del evento.





IMPORTACIÓN DE DATOS DESDE EXCEL

Actualmente estoy cargando toda esta información en una planilla de Excel compuesta por tres hojas:
Clientes:

ID.
Cliente.
Fecha de evento.
Tipo de evento.
Valor salón.
Mínimo de tarjetas.
Valor adulto.
Valor adolescente.
Valor niño.

Pagos:

Cliente.
ID.
Fecha evento.
Fecha pago.
Concepto (Seña salon, tarjetas adultos, tarjetas adolescentes, tarjetas niños, cotillón, adicional)
Cantidad.
Precio unitario.
Importe.
Método de pago.

Seguimiento:

Cliente.
Fecha evento.
Días para evento.
Valor salón.
Cobrado salón.
Debe salón.

Cantidad de adultos.
Cantidad de adolescentes.
Cantidad de niños.
Total tarjetas.
Total estimado.
Total cobrado.
Saldo.
Último pago.
Días sin pagar.
Estado.

Sería ideal que el sistema permita importar o migrar esta información para evitar tener que cargar nuevamente todos los datos de forma manual.
OBJETIVO GENERAL

La idea es contar con una herramienta que permita administrar integralmente cada evento, visualizar los servicios contratados, controlar pagos y saldos, gestionar el stock de cotillón y dejar preparada una estructura escalable para incorporar nuevos servicios en el futuro sin tener que rediseñar el sistema nuevamente.


COMBOS COTILLÓN



COMBO 1
Producto
Cantidad
Sombrero Bombin Fluo
20
Antifaz fluo
15
Tiara hawaiana
25
Asusta suegra
45
Moño fluo / estampado
15
Corbata Fluo
10
Silbato pelota fluo
15
Anteojos plásticos mariposas/manos surtidos
10
Anteojos plásticos circulos
25
Collar hawaiano fluo
20
PRODUCTOS:
200
TOTAL: $130,000.00




COMBO 2
Producto
Cantidad
Sombrero Bombin Fluo
20
Antifaz fluo
10
Tiara hawaiana
30
Maraca choclo
10
Rompecoco luminoso
10
Asusta suegra
30
Moño fluo / estampado
25
Corbata Fluo
15
Silbato pelota fluo
30
Tubo pulsera neon
100
Anteojos plásticos mariposas/manos surtidos
15
Anteojos plásticos circulos
15
Collar hawaiano fluo
20
PRODUCTOS:
330
TOTAL:$250,000.00






COMBO 3
Producto
Cantidad
Sombrero tanguero
5
Sombrero Bombin Fluo
10
Sombreros cowboy fluo
3
Sombreros vaquero
2
Tiara hawaiana
35
Tiara Luminosa
5
Maraca choclo
20
Rompecoco luminoso
20
Asusta suegra
20
Moño fluo / estampado
25
Capa Luminosa ala led 110 cm
1
Corbata Fluo
15
Anteojos acrílicos estrellas
5




Anteojos acrílicos corazón
5
Silbato pelota fluo
25
Anteojos plásticos mariposas/manos surtidos
25
Anteojos plásticos circulos
10
Collar hawaiano fluo
10
PRODUCTOS:
341
TOTAL: $380,000.00




CAROLINAOS: Documento de Arquitectura Funcional (DAF)
Evolución funcional – Gestión integral de eventos
Versión 1.0: Junio 2026
Índice
Introducción
Objetivo general
Principios de arquitectura
Evolución del sistema
Arquitectura general
Nuevos módulos
Modelo de datos
Relaciones entre entidades
Reglas de negocio
Casos de uso
Requerimientos funcionales
Requerimientos no funcionales
Migración de datos
Roadmap de desarrollo
Consideraciones técnicas
1. Introducción
El presente documento tiene como finalidad transformar las necesidades operativas relevadas por dirección en una arquitectura funcional consistente para la evolución de CarolinaOS.
Las solicitudes realizadas no deben interpretarse como funcionalidades aisladas, sino como la incorporación de nuevos componentes dentro del sistema operativo de Carolina.
El objetivo principal es mantener una arquitectura escalable, desacoplada y preparada para el crecimiento futuro del negocio, evitando desarrollos puntuales que generen deuda técnica o limiten futuras incorporaciones de servicios.
La evolución propuesta transforma a CarolinaOS desde un sistema centrado en clientes y eventos hacia una plataforma integral de gestión operativa, administrativa y logística.
2. Objetivo general
Construir una plataforma capaz de administrar de forma centralizada toda la operación de Carolina Eventos mediante una ficha única por evento, integrando:
Gestión comercial.
Gestión administrativa.
Gestión de servicios.
Gestión financiera.
Gestión logística.
Gestión de inventario.
Gestión documental.
Gestión operativa.
Todo ello bajo una única arquitectura de datos.
3. Principios de arquitectura
Todo nuevo desarrollo deberá respetar los siguientes principios.
Centralización
Toda la información pertenece al Evento.
No deberán existir módulos que almacenen información duplicada.
Modularidad
Cada servicio debe funcionar como un módulo independiente.
Esto permitirá incorporar nuevos servicios sin modificar la estructura general del sistema.
Escalabilidad
Agregar un nuevo servicio no debe requerir modificaciones estructurales de la base de datos. Simplemente deberá crearse un nuevo tipo de servicio.
Reutilización
Las funcionalidades deberán ser reutilizables entre todos los servicios.
Ejemplo: Registro de pagos, no debe desarrollarse uno para Cotillón y otro para pantalla. Debe existir un único módulo de pagos reutilizable.
Integridad. Toda modificación deberá mantener la consistencia entre:
Evento
↓
Servicios
↓
Pagos
↓
Stock
↓
Agenda
4. Evolución del sistema
Actualmente CarolinaOS administra principalmente:
Clientes.
Eventos.
Calendario.
La nueva evolución incorpora cinco grandes capacidades:
Gestión integral de servicios.
Gestión financiera.
Gestión de inventario.
Automatización operativa.
Escalabilidad de productos.
En consecuencia CarolinaOS evoluciona desde un CRM hacia un ERP especializado para la gestión integral de eventos.
5. Nuevos módulos
5.1 Módulo servicios
Responsabilidad: Administrar todos los servicios contratados para un evento.
Cada servicio deberá contener:
Tipo
Estado
Responsable
Precio
Fecha
Observaciones
Pagos
Saldo
Documentación
Servicios iniciales:
Salón
Catering / Tarjetas
Cotillón
Pantalla
Cabaña
Decoración
Mobiliario
Mesa Dulce
Fotografía
Adicionales
La arquitectura deberá permitir crear nuevos servicios sin modificar el sistema.
5.2 Módulo pagos
Cada servicio administrará su propia cuenta corriente. Información:
Importe contratado
Pagos parciales
Fecha
Método de pago
Responsable
Observaciones
Saldo pendiente
Cada movimiento quedará registrado históricamente. Nunca se eliminarán movimientos, solo podrán agregarse movimientos compensatorios.
5.3 Módulo stock
Nueva entidad: Producto. Cada producto tendrá:
Nombre
Código
Categoría
Unidad
Stock actual
Stock mínimo
Stock reservado
Stock disponible
5.4 Módulo Combos
Nueva entidad: Combo
Cada combo estará compuesto por múltiples productos.
Ejemplo:
Combo 2
Producto A
Producto B
Producto C
Producto D
Cuando un cliente contrata un combo: No se descuentan productos inmediatamente. Los productos quedan: Reservados.
Al finalizar el evento se descuentan definitivamente. Esto evita errores por cancelaciones.
5.5 Agenda inteligente
El calendario deberá visualizar:
Servicios contratados
Estado
Cotillón
Combo
Alertas
Pendientes
Pagos
Iconografía configurable
5.6 Sistema de alertas
Alertas automáticas configurables. Ejemplos:
90 días
60 días
30 días
15 días
7 días
1 día
Las alertas podrán dispararse por:
Servicio
Pago pendiente
Compra necesaria
Stock insuficiente
Documentación faltante
6. Modelo de datos
Entidades principales:
Cliente
Evento
Servicio
Pago
Movimiento
Producto
Combo
Proveedor
Alerta
Compra
Inventario
Usuario
7. Relaciones
Cliente
↓
N Eventos
Evento
↓
N Servicios
Servicio
↓
N Pagos
Servicio
↓
1 Combo
Combo
↓
N Productos
Producto
↓
N Movimientos de Stock
Evento
↓
N Alertas
Proveedor
↓
N Productos
8. Reglas de negocio
Regla 1: Todo Evento puede tener múltiples servicios.
Regla 2: Cada servicio administra sus propios pagos.
Regla 3: Los saldos nunca se mezclan entre servicios.
Regla 4: El resumen del evento será la suma consolidada de todos los servicios.
Regla 5: Los productos pertenecen al inventario. No al evento.
Regla 6: Los eventos únicamente reservan stock. No modifican inventario hasta ejecutarse.
Regla 7: Toda operación financiera genera historial. Nunca se elimina información.
Regla 8: Los combos son configurables. No deben programarse de forma fija.
Regla 9: Los tipos de servicio deberán ser parametrizables. No deberán existir desarrollos específicos para cada servicio.
9. Casos de uso
CU-01: Crear evento
CU-02: Agregar servicio
CU-03: Modificar servicio
CU-04: Registrar pago
CU-05: Consultar saldo
CU-06: Asignar combo
CU-07: Reservar stock
CU-08: Generar alerta
CU-09: Importar excel
CU-10: Consultar ficha integral del evento
CU-11: Ver agenda operativa
CU-12: Visualizar stock comprometido
CU-13: Registrar compra
CU-14: Actualizar inventario
CU-15: Consultar dashboard administrativo
10. Requerimientos funcionales
El sistema deberá permitir:
Crear servicios dinámicos.
Asociar múltiples servicios a un evento.
Gestionar pagos independientes por servicio.
Generar una ficha única consolidada del evento.
Visualizar indicadores dentro del calendario.
Configurar alertas automáticas.
Reservar stock.
Administrar inventario.
Configurar combos.
Importar datos históricos.
Incorporar nuevos servicios sin modificar la arquitectura.
Consultar reportes administrativos.
11. Requerimientos no funcionales
Arquitectura modular.
Base de datos normalizada.
API desacoplada.
Componentes reutilizables.
Auditoría completa.
Escalabilidad horizontal.
Permisos por rol.
Registro histórico de operaciones.
Alto rendimiento en consultas.
Compatibilidad con futuras integraciones de IA.
12. Migración de datos
El sistema deberá incorporar un proceso de importación desde excel para evitar la carga manual de información histórica.
Se contemplará la migración de:
Clientes.
Eventos.
Pagos.
Seguimiento.
Servicios contratados.
La importación deberá validar la integridad de los datos antes de su incorporación y generar un reporte de inconsistencias cuando corresponda.
13. Roadmap de desarrollo
Fase 1 – Modelo de Datos
Nuevas entidades.
Relaciones.
Migraciones de base de datos.
Fase 2 – Servicios
CRUD de servicios.
Tipologías parametrizables.
Asociación con eventos.
Fase 3 – Pagos
Cuenta corriente por servicio.
Historial de movimientos.
Resúmenes financieros.
Fase 4 – Stock e Inventario
Productos.
Combos.
Reservas.
Movimientos.
Alertas de stock.
Fase 5 – Agenda inteligente
Indicadores visuales.
Filtros.
Alertas temporales.
Vista operativa.
Fase 6 – Migración
Importación desde Excel.
Validación.
Corrección de inconsistencias.
Fase 7 – Dashboards
Estado de eventos.
Servicios contratados.
Cobros.
Saldos.
Inventario.
Compras futuras.
Indicadores operativos.
15. Consideraciones técnicas
La evolución propuesta no incorpora funcionalidades aisladas, sino que redefine la arquitectura funcional de CarolinaOS para consolidarlo como una plataforma integral de gestión de eventos. El principio rector será que el Evento constituye la unidad central del sistema, mientras que los Servicios se comportan como componentes modulares asociados a dicho evento. Cada servicio (Salón, catering, cotillón, decoración, pantalla, cabañas, fotografía, entre otros) gestionará de forma independiente su ciclo operativo, financiero y documental, evitando dependencias entre módulos y permitiendo la incorporación de nuevas líneas de negocio sin rediseñar la estructura existente.
Desde la perspectiva tecnológica, esta arquitectura deja preparada la base para las siguientes etapas de evolución de CarolinaOS: Automatización de procesos, incorporación de agentes de IA especializados, análisis predictivo, planificación de compras, recomendaciones operativas y construcción de memoria organizacional. De esta forma, cada nueva funcionalidad no solo resolverá una necesidad puntual, sino que incrementará las capacidades del sistema como plataforma de inteligencia operativa para Carolina Eventos.


-------------------------------------------------------------------------------

