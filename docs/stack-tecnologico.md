# Stack tecnológico

## Visión general

La aplicación es un monorepo con frontend y backend en el mismo repositorio. En producción ambos corren en un único proceso Node.js: el servidor Express sirve la SPA compilada como archivos estáticos y expone la API bajo `/api/`.

```
agencia-de-viajes/
├── src/          ← frontend (React + Vite)
├── server/       ← backend (Node.js + Express)
└── docs/         ← documentación
```

---

## Frontend

### React 19 + TypeScript

La interfaz es una Single Page Application (SPA) construida con **React 19** y **TypeScript 5.7**. El estado de la aplicación se maneja íntegramente con hooks propios de React (`useState`, `useEffect`) sin librerías de gestión de estado externas.

### Vite 6

El bundler de desarrollo y build es **Vite 6** con el plugin oficial `@vitejs/plugin-react`. Provee hot module replacement en desarrollo y genera el bundle optimizado para producción en `dist/`.

### Tailwind CSS v4

Los estilos se escriben con clases utilitarias de **Tailwind CSS versión 4**, integrado mediante el plugin `@tailwindcss/vite`. No requiere archivo de configuración separado; la integración con Vite es directa.

### Lucide React

Los íconos de la interfaz provienen de la librería **Lucide React** (versión 0.469), que ofrece SVGs como componentes React con soporte de tamaño y color vía props.

### Persistencia local

Las tareas de monitoreo se persisten en **localStorage** del navegador bajo la clave `agencia_tasks_v1`. Cada vez que el usuario guarda cambios, el cliente sincroniza la lista completa al servidor en segundo plano vía `POST /api/tasks/sync`.

---

## Backend

### Node.js + Express 4

El servidor es una aplicación **Express 4.21** ejecutada con **Node.js**. Gestiona las rutas de la API, sirve el frontend compilado en producción y contiene toda la lógica de negocio (llamadas a APIs externas, cron, WhatsApp).

### TypeScript con tsx

El servidor está escrito en TypeScript y se ejecuta directamente con **tsx 4.19** (TypeScript executor), sin paso de compilación previo. Esto simplifica el flujo de desarrollo y el arranque en producción.

### node-cron

La ejecución automática diaria se implementa con **node-cron 4.6**. Al iniciar el servidor se registra un job con la expresión `0 11 * * *` (11:00 UTC = 08:00 ART), ajustable mediante la variable de entorno `CRON_SCHEDULE`.

### dotenv

Las variables de entorno se cargan con **dotenv 16**, permitiendo usar un archivo `.env` en desarrollo sin modificar el código.

### cors

El middleware **cors 2.8** habilita los encabezados Cross-Origin necesarios durante el desarrollo local, donde frontend y backend corren en puertos distintos.

---

## APIs externas

### SerpAPI

Toda la información de vuelos y hoteles proviene de **SerpAPI**, que scrapeael contenido de Google en tiempo real y lo expone como JSON.

| Motor | Uso |
|---|---|
| `google_flights` | Búsqueda de vuelos: segmentos, horarios, precios, aerolíneas |
| `google_hotels` | Búsqueda de hoteles: precios, calificaciones, amenidades, imágenes |

La clave de API se configura en la variable de entorno `SERPAPI_KEY`. Las búsquedas de vuelos iteran sobre rangos de fechas (hasta 14 días) para encontrar el precio más bajo en el intervalo indicado.

### CallMeBot (WhatsApp)

El envío de mensajes de WhatsApp se realiza a través de **CallMeBot**, una pasarela gratuita que permite enviar mensajes a un único número preconfigurado mediante una solicitud HTTP GET.

```
https://api.callmebot.com/whatsapp.php?phone=…&text=…&apikey=…
```

La integración es unidireccional: solo envía mensajes, no los recibe. Requiere dos variables de entorno en el servidor: `CALLMEBOT_API_KEY` y `WHATSAPP_ADMIN_PHONE`.

---

## Persistencia de datos

| Capa | Mecanismo | Alcance |
|---|---|---|
| Tareas (frontend) | `localStorage` del navegador | Por dispositivo y navegador |
| Tareas (servidor) | Archivo JSON en `/tmp/agencia/tasks.json` | Persiste entre reinicios por inactividad; se pierde al redesplegar |
| Historial de precios | Dentro del mismo JSON de tareas | Últimas 10 mediciones por tarea |

El cliente sincroniza con el servidor en cada guardado; el servidor usa su copia para el cron nocturno.

---

## Despliegue

La aplicación está desplegada en **Render** (plan gratuito) como un único servicio web de tipo Node.js, definido en `render.yaml`.

| Etapa | Comando |
|---|---|
| Build | `npm install && npm run build && npm install --prefix server` |
| Start | `NODE_ENV=production tsx server/src/index.ts` |

**Consideraciones del plan gratuito:**
- El servidor entra en modo de espera tras 15 minutos sin tráfico; el primer request lo despierta con una demora de ~30 segundos.
- El sistema de archivos se reinicia con cada redespliegue, por lo que el historial de tareas en `/tmp` se pierde en esos casos (el cliente re-sincroniza las tareas al abrirse).
- Las variables de entorno sensibles (`SERPAPI_KEY`, `CALLMEBOT_API_KEY`, `WHATSAPP_ADMIN_PHONE`) se configuran directamente en el dashboard de Render y nunca se exponen al frontend.

---

## Variables de entorno requeridas

| Variable | Dónde se usa | Descripción |
|---|---|---|
| `SERPAPI_KEY` | Servidor | Clave de API para Google Flights / Google Hotels |
| `CALLMEBOT_API_KEY` | Servidor | Clave de la pasarela CallMeBot |
| `WHATSAPP_ADMIN_PHONE` | Servidor | Número de teléfono destino (con código de país, sin +) |
| `CRON_SCHEDULE` | Servidor (opcional) | Expresión cron del informe diario. Por defecto: `0 11 * * *` |
| `PORT` | Servidor (opcional) | Puerto HTTP. Por defecto: `3001` |
