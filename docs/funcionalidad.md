# Funcionalidad del sitio

Agencia de Viajes es una aplicación web orientada a usuarios argentinos que quieren monitorear precios de vuelos y hoteles, detectar ofertas y recibir alertas automáticas por WhatsApp.

---

## Navegación general

La interfaz se organiza en cuatro pestañas:

| Pestaña | Color | Función |
|---|---|---|
| Vuelos | Azul | Búsqueda de vuelos con fechas flexibles |
| Hoteles | Ámbar | Búsqueda de alojamiento con filtros de ocupación |
| Traslados | Violeta | Búsqueda de traslados aeroportuarios |
| Tareas | Índigo | Panel de monitoreo de precios programado |

Un encabezado fijo con logo y el aviso legal de precios orientativos aparecen en toda la aplicación.

---

## Vuelos

### Formulario de búsqueda

- **Tipo de viaje**: ida y vuelta o solo ida.
- **Origen**: selector fijo con cuatro aeropuertos argentinos — Santa Fe (SFN), Rosario (ROS), Aeroparque (AEP) y Ezeiza (EZE).
- **Destino**: campo de texto libre con autocompletado de ciudades a partir de dos caracteres.
- **Rango de salida**: dos fechas (desde / hasta) que definen el intervalo de búsqueda flexible.
- **Rango de regreso** (solo ida y vuelta): igual que el anterior, siempre posterior a la salida.
- **Pasajeros**: 1 adulto, 2 adultos, o 2 adultos + 2 menores.

El formulario valida todos los campos antes de enviar y muestra errores en línea.

### Resultados de vuelos

Encabezado de resultados:
- Cantidad total de opciones encontradas.
- Tres indicadores: precio más bajo (verde), precio promedio (azul) y precio más alto (rojo).
- Fecha de salida del vuelo más barato.

Filtros rápidos disponibles:
- Todas las opciones.
- Solo aerolíneas low cost.
- Solo aerolíneas tradicionales.
- Filtro combinado "≤ 12 h · ≤ 1 escala" (activo por defecto).

Cada tarjeta de vuelo muestra:
- Insignia "Mejor precio encontrado" en la opción más económica.
- Segmentos de ida y vuelta: aeropuerto de origen/destino, horario, duración, número de vuelo.
- Duración total, cantidad de escalas y si es directo.
- Aerolínea con clasificación visual (low cost / tradicional) y tooltip explicativo.
- Precio total y precio por adulto.
- Enlace directo a Google Flights para verificar y comprar.
- Nota sobre flexibilidad de cambios según tipo de aerolínea.

### Integración entre pestañas

Desde cualquier tarjeta de hotel, el botón "Buscar vuelos para estas fechas" completa automáticamente el formulario de vuelos con destino, origen predeterminado y ventanas de fecha ±5 días alrededor del check-in/check-out, y ejecuta la búsqueda sin intervención del usuario.

---

## Hoteles

### Formulario de búsqueda

- Destino con autocompletado de ciudades.
- Fecha de check-in y cantidad de noches (1 a 21); el check-out se calcula automáticamente.
- Cantidad de adultos (1 a 4).
- Hijos con selector de edad por niño (0 a 17 años).
- Casilla de verificación "All Inclusive".

### Resultados de hoteles

Cada tarjeta de hotel muestra:
- Insignia "Mejor precio encontrado" en la opción más económica.
- Imagen, nombre, categoría de estrellas y calificación general con cantidad de reseñas.
- Insignia "Todo Incluido" cuando corresponde.
- Noches, check-in, check-out.
- Descripción breve y amenidades disponibles.
- Precio total y precio por noche.
- Enlace a Google Hotels para verificar y reservar.
- Aviso en las propiedades all inclusive indicando que el precio mostrado es el valor de habitación base (tarifa de referencia); el precio de paquete AI puede diferir y debe consultarse directamente con el hotel.

---

## Traslados

Permite buscar traslados aeroportuarios (privados, compartidos o taxi) indicando punto de origen, destino, fecha, hora y cantidad de pasajeros. Los resultados muestran tipo de vehículo, asientos, proveedor, duración estimada, distancia y precio.

---

## Tareas — Monitoreo de precios

El panel de tareas es la funcionalidad central de seguimiento. Las tareas se guardan en el navegador y se sincronizan con el servidor.

### Creación y edición de tareas

El modal de tarea acepta los mismos parámetros que los formularios de búsqueda y agrega:

- **Nombre de la tarea**: etiqueta identificatoria libre.
- **Precio objetivo (USD)**: umbral opcional. Si el precio encontrado baja de este valor, el sistema envía una alerta automática por WhatsApp.

El tipo de tarea (hotel o vuelo) no puede cambiarse una vez creada.

### Panel de tareas

Barra de acciones:
- Cantidad de tareas activas y nota de horario del informe automático.
- **Nueva tarea**: abre el modal de creación.
- **Ejecutar todas**: lanza todas las tareas en secuencia y actualiza resultados.
- **Enviar informe WS**: envía manualmente el resumen actual por WhatsApp.

Cada tarjeta de tarea muestra:
- Icono y nombre de la tarea.
- Si tiene precio objetivo: etiqueta "objetivo: USD X" o insignia verde "Bajo objetivo" cuando el precio actual lo alcanza o supera.
- Resumen de parámetros de búsqueda.
- Botones de acción: ejecutar ahora, editar, eliminar.
- Panel de resultado: cantidad de ofertas, precio más bajo, mejor hotel o fecha de salida más económica.
- **Tendencia de precio**: flecha verde (↓ bajó X %) o roja (↑ subió X %) comparando los dos últimos registros.
- Timestamp de última ejecución y cantidad de mediciones acumuladas.
- Borde verde en tarjetas cuyo precio actual está por debajo del objetivo.

### Historial de precios

Cada tarea almacena un historial de hasta 10 mediciones (fecha, precio, cantidad de ofertas). La tendencia se calcula comparando las dos últimas entradas y se muestra visualmente en la tarjeta.

### Alertas automáticas por WhatsApp

- **Alerta inmediata**: al ejecutar una tarea (manualmente o por cron), si el precio encontrado es igual o menor al precio objetivo, el sistema envía automáticamente un mensaje de alerta al número configurado.
- **Informe diario**: todos los días a las **08:00 ART** el servidor ejecuta todas las tareas, actualiza los resultados y envía un resumen por WhatsApp con tendencias (↑ / ↓ %) y marcas 🎯 para las tareas que alcanzaron su objetivo.

El formato del informe agrupa tareas por tipo, muestra precio, cantidad de ofertas y tendencia en una línea por tarea.

---

## Consideraciones sobre los precios

Los precios provienen de Google Flights y Google Hotels a través de SerpAPI y son **valores de referencia orientativos**. No representan una cotización oficial ni garantizan disponibilidad. En particular, los hoteles all inclusive muestran la tarifa base de la habitación, no el precio del paquete completo. Siempre se recomienda verificar en el sitio oficial antes de reservar.
