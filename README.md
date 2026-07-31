# Agencia de Viajes

Buscador de vuelos con comparación de precios, fechas flexibles y clasificación de aerolíneas.

## Características

- Búsqueda por destino (código IATA o ciudad)
- Rango de fechas flexible de salida y regreso
- Salida desde: Santa Fe, Rosario, Aeroparque (AEP) o Ezeiza (EZE)
- Opciones de pasajeros: 1 adulto / 2 adultos / 2 adultos + 2 menores
- Comparativa de precios (mínimo, promedio, máximo)
- Indicador de aerolínea **Low Cost** vs **Tradicional**
- Resultados ordenados por precio
- Datos en tiempo real via **Amadeus API**

## Setup

### 1. Clonar y configurar variables de entorno

```bash
# Frontend
cp .env.example .env

# Backend
cd server
cp .env.example .env
```

### 2. Obtener API keys gratuitas de Amadeus

1. Ir a [developers.amadeus.com](https://developers.amadeus.com)
2. Crear cuenta gratuita
3. Crear una nueva app → obtenés `Client ID` y `Client Secret`
4. Completar en `server/.env`:

```
AMADEUS_CLIENT_ID=tu_client_id
AMADEUS_CLIENT_SECRET=tu_client_secret
AMADEUS_ENV=test
```

### 3. Instalar dependencias y correr

```bash
# Frontend (desde raíz)
npm install
npm run dev

# Backend (en otra terminal)
cd server
npm install
npm run dev
```

El frontend corre en `http://localhost:5173` y el backend en `http://localhost:3001`.

## Aerolíneas Low Cost en Argentina

Las siguientes aerolíneas se marcan como **Low Cost** (mayor restricción para cambios/cancelaciones):
- **FO** – Flybondi
- **JA** – JetSMART
- **W4** – (otros operadores low cost)

Las demás (Aerolíneas Argentinas, LATAM, Copa, Iberia, etc.) se clasifican como **Tradicionales**.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Node.js + Express + TypeScript
- **API**: Amadeus Flight Offers Search v2
