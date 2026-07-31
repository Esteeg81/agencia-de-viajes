import 'dotenv/config'

const API_KEY = process.env.SERPAPI_KEY ?? ''
const BASE_URL = 'https://serpapi.com/search'

// ── Aerolíneas low cost por nombre ────────────────────────────────────────────

const LOW_COST_NAMES = new Set([
  'Flybondi', 'JetSMART', 'Spirit Airlines', 'Frontier Airlines',
  'Ryanair', 'EasyJet', 'Vueling', 'Sky Airline', 'Viva Air',
  'Wizz Air', 'Volaris', 'Interjet', 'VivaAerobus',
])

// Mapa nombre → código IATA (para el indicador de aerolínea)
const AIRLINE_TO_IATA: Record<string, string> = {
  'Aerolíneas Argentinas': 'AR',
  'LATAM Airlines': 'LA',
  'LATAM': 'LA',
  'Flybondi': 'FO',
  'JetSMART': 'JA',
  'Copa Airlines': 'CM',
  'American Airlines': 'AA',
  'United Airlines': 'UA',
  'Delta Air Lines': 'DL',
  'Iberia': 'IB',
  'Air Europa': 'UX',
  'Sky Airline': 'H2',
  'Gol': 'G3',
  'Avianca': 'AV',
  'Azul': 'AD',
  'Air France': 'AF',
  'KLM': 'KL',
  'Lufthansa': 'LH',
  'British Airways': 'BA',
  'Turkish Airlines': 'TK',
}

export function classifyAirlineName(name: string): 'low-cost' | 'tradicional' {
  return LOW_COST_NAMES.has(name) ? 'low-cost' : 'tradicional'
}

export function airlineToIata(name: string): string {
  return AIRLINE_TO_IATA[name] ?? name.slice(0, 2).toUpperCase()
}

export function minutesToIsoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `PT${h > 0 ? `${h}H` : ''}${m > 0 ? `${m}M` : '0M'}`
}

export function serpTimeToIso(time: string): string {
  // SerpAPI gives "2024-08-01 14:00" → ISO
  return new Date(time.replace(' ', 'T') + ':00').toISOString()
}

export function getDatesInRange(from: string, to: string): string[] {
  const dates: string[] = []
  const current = new Date(from)
  const end = new Date(to)
  const maxDays = 14
  let count = 0
  while (current <= end && count < maxDays) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
    count++
  }
  return dates
}

// ── Tipos SerpAPI Vuelos ──────────────────────────────────────────────────────

export type SerpFlightSegment = {
  departure_airport: { id: string; name: string; time: string }
  arrival_airport: { id: string; name: string; time: string }
  duration: number
  airplane?: string
  airline: string
  airline_logo?: string
  flight_number: string
  travel_class?: string
  often_delayed_by_over_30_min?: boolean
  overnight?: boolean
}

export type SerpFlight = {
  flights: SerpFlightSegment[]
  layovers?: { duration: number; name: string; id: string }[]
  total_duration: number
  price: number
  type?: string
  airline_logo?: string
  carbon_emissions?: { difference_percent?: number }
}

type SerpFlightsResponse = {
  best_flights?: SerpFlight[]
  other_flights?: SerpFlight[]
  error?: string
  search_metadata?: { status: string }
}

type SearchFlightsParams = {
  departure_id: string
  arrival_id: string
  outbound_date: string
  return_date?: string
  adults: number
  children?: number
  type: 1 | 2
}

export async function searchFlights(params: SearchFlightsParams): Promise<SerpFlight[]> {
  if (!API_KEY) throw new Error('Falta SERPAPI_KEY en las variables de entorno del servidor')

  const query = new URLSearchParams({
    engine: 'google_flights',
    departure_id: params.departure_id,
    arrival_id: params.arrival_id,
    outbound_date: params.outbound_date,
    adults: String(params.adults),
    type: String(params.type),
    currency: 'USD',
    hl: 'es',
    api_key: API_KEY,
  })

  if (params.return_date) query.set('return_date', params.return_date)
  if (params.children && params.children > 0) query.set('children', String(params.children))

  const res = await fetch(`${BASE_URL}?${query}`)
  if (!res.ok) throw new Error(`SerpAPI error: ${res.status}`)

  const data = (await res.json()) as SerpFlightsResponse
  if (data.error) throw new Error(data.error)

  return [...(data.best_flights ?? []), ...(data.other_flights ?? [])]
}

// ── Tipos SerpAPI Hoteles ─────────────────────────────────────────────────────

export type SerpHotel = {
  name: string
  description?: string
  link?: string
  check_in_time?: string
  check_out_time?: string
  rate_per_night?: { extracted_lowest: number }
  total_rate?: { extracted_lowest: number }
  hotel_class?: string
  extracted_hotel_class?: number
  amenities?: string[]
  overall_rating?: number
  reviews?: { rating: number; count: number }
  images?: { thumbnail: string }[]
  type?: string
}

type SerpHotelsResponse = {
  properties?: SerpHotel[]
  error?: string
}

type SearchHotelsParams = {
  destination: string
  check_in_date: string
  check_out_date: string
  adults: number
  rooms: number
}

export async function searchHotels(params: SearchHotelsParams): Promise<SerpHotel[]> {
  if (!API_KEY) throw new Error('Falta SERPAPI_KEY en las variables de entorno del servidor')

  const query = new URLSearchParams({
    engine: 'google_hotels',
    q: `hoteles en ${params.destination}`,
    check_in_date: params.check_in_date,
    check_out_date: params.check_out_date,
    adults: String(params.adults),
    rooms: String(params.rooms),
    currency: 'USD',
    hl: 'es',
    api_key: API_KEY,
  })

  const res = await fetch(`${BASE_URL}?${query}`)
  if (!res.ok) throw new Error(`SerpAPI error: ${res.status}`)

  const data = (await res.json()) as SerpHotelsResponse
  if (data.error) throw new Error(data.error)

  return data.properties ?? []
}
