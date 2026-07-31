# Agencia de Viajes

Buscador de vuelos y hoteles con comparación de precios, fechas flexibles y clasificación de aerolíneas.
Datos en tiempo real via **SerpAPI** (Google Flights + Google Hotels).

## Características

- **Vuelos**: origen (SFN, ROS, AEP, EZE), destino libre, rango de fechas, pasajeros, indicador Low Cost / Tradicional
- **Hoteles**: búsqueda por ciudad o destino, check-in / check-out, adultos y habitaciones
- Comparativa de precios (mínimo, promedio, máximo) en ambas secciones
- Traslados: próximamente

## Setup

### 1. Obtener API key gratuita de SerpAPI

1. Ir a [serpapi.com](https://serpapi.com)
2. Crear cuenta gratuita → obtenés **100 búsquedas/mes** sin tarjeta
3. Copiar la API Key del dashboard

### 2. Configurar variables de entorno

```bash
cd server
cp .env.example .env
# Editar .env y pegar la SERPAPI_KEY
```

### 3. Instalar y correr

```bash
# Frontend (desde raíz)
npm install
npm run dev

# Backend (en otra terminal)
cd server
npm install
npm run dev
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:3001`

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Node.js + Express + TypeScript
- **API**: SerpAPI — Google Flights y Google Hotels

## Aerolíneas Low Cost detectadas

Flybondi, JetSMART, Spirit, Frontier, Ryanair, EasyJet, Vueling, Sky Airline, Viva Air, Wizz Air, Volaris, VivaAerobus
