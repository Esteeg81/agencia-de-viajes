import 'dotenv/config'

const CLIENT_ID = process.env.AMADEUS_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET ?? ''
const ENV = process.env.AMADEUS_ENV === 'production' ? 'production' : 'test'

const BASE_URL =
  ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com'

const LOW_COST_AIRLINES = new Set(['FO', 'JA', 'W4', 'VJ', 'XL', 'F9', 'NK', 'WN', 'B6'])

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`Amadeus auth error: ${res.status}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.value
}

export type AmadeusFlightOffer = {
  id: string
  price: { total: string; currency: string; perAdult?: { total: string } }
  itineraries: {
    duration: string
    segments: {
      departure: { iataCode: string; at: string }
      arrival: { iataCode: string; at: string }
      carrierCode: string
      number: string
      duration: string
    }[]
  }[]
  validatingAirlineCodes: string[]
  oneWay: boolean
  numberOfBookableSeats: number
}

type SearchFlightParams = {
  originLocationCode: string
  destinationLocationCode: string
  departureDate: string
  returnDate?: string
  adults: number
  children?: number
  max?: number
}

export async function searchFlightOffers(params: SearchFlightParams): Promise<AmadeusFlightOffer[]> {
  const token = await getAccessToken()

  const query = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: String(params.adults),
    max: String(params.max ?? 10),
    currencyCode: 'ARS',
  })

  if (params.returnDate) query.set('returnDate', params.returnDate)
  if (params.children && params.children > 0) query.set('children', String(params.children))

  const res = await fetch(`${BASE_URL}/v2/shopping/flight-offers?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 404 || res.status === 400) return []
  if (!res.ok) throw new Error(`Amadeus search error: ${res.status}`)

  const data = (await res.json()) as { data?: AmadeusFlightOffer[] }
  return data.data ?? []
}

export function classifyAirline(codes: string[]): 'low-cost' | 'tradicional' {
  return codes.some((c) => LOW_COST_AIRLINES.has(c)) ? 'low-cost' : 'tradicional'
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

// ── Hoteles ───────────────────────────────────────────────────────────────────

export type AmadeusHotel = {
  hotelId: string
  name: string
  rating?: string
  cityCode: string
}

export type AmadeusHotelOffer = {
  id: string
  hotel: {
    hotelId: string
    name: string
    rating?: string
    cityCode: string
    amenities?: string[]
    description?: { text: string }
  }
  offers: {
    id: string
    checkInDate: string
    checkOutDate: string
    boardType?: string
    price: { total: string; currency: string; base?: string }
  }[]
  available: boolean
}

export async function getHotelsByCity(cityCode: string): Promise<AmadeusHotel[]> {
  const token = await getAccessToken()

  const query = new URLSearchParams({
    cityCode: cityCode.toUpperCase(),
    radius: '10',
    radiusUnit: 'KM',
    hotelSource: 'ALL',
  })

  const res = await fetch(`${BASE_URL}/v1/reference-data/locations/hotels/by-city?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 400 || res.status === 404) return []
  if (!res.ok) throw new Error(`Amadeus hotels/city error: ${res.status}`)

  const data = (await res.json()) as { data?: AmadeusHotel[] }
  return data.data ?? []
}

type SearchHotelParams = {
  hotelIds: string[]
  checkInDate: string
  checkOutDate: string
  adults: number
  roomQuantity: number
}

export async function searchHotelOffers(params: SearchHotelParams): Promise<AmadeusHotelOffer[]> {
  const token = await getAccessToken()

  const ids = params.hotelIds.slice(0, 20).join(',')
  const query = new URLSearchParams({
    hotelIds: ids,
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    adults: String(params.adults),
    roomQuantity: String(params.roomQuantity),
    currency: 'USD',
    bestRateOnly: 'true',
  })

  const res = await fetch(`${BASE_URL}/v3/shopping/hotel-offers?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 400 || res.status === 404) return []
  if (!res.ok) throw new Error(`Amadeus hotel-offers error: ${res.status}`)

  const data = (await res.json()) as { data?: AmadeusHotelOffer[] }
  return (data.data ?? []).filter((h) => h.available && h.offers.length > 0)
}

// ── Traslados ─────────────────────────────────────────────────────────────────

export type AmadeusTransferOffer = {
  id: string
  transferType: string
  start: { dateTime: string; locationCode: string }
  end: { address?: { line: string; cityName: string; countryCode: string }; name?: string }
  vehicle: { code: string; description: string; seats?: { count: number }[] }
  serviceProvider: { name: string; logoUrl?: string }
  quotation: { monetaryAmount: string; currencyCode: string }
  distance?: { value: number; unit: string }
  duration?: string
}

type SearchTransferParams = {
  startLocationCode: string
  endAddressLine: string
  endCityName: string
  endCountryCode: string
  endName: string
  startDateTime: string
  passengers: number
  transferType: string
}

export async function searchTransferOffers(params: SearchTransferParams): Promise<AmadeusTransferOffer[]> {
  const token = await getAccessToken()

  const body = {
    startLocationCode: params.startLocationCode,
    endAddressLine: params.endAddressLine,
    endCityName: params.endCityName,
    endCountryCode: params.endCountryCode,
    endName: params.endName,
    startDateTime: params.startDateTime,
    passengers: params.passengers,
    transferType: params.transferType,
  }

  const res = await fetch(`${BASE_URL}/v1/shopping/transfer-offers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 400 || res.status === 404) return []
  if (!res.ok) throw new Error(`Amadeus transfer error: ${res.status}`)

  const data = (await res.json()) as { data?: AmadeusTransferOffer[] }
  return data.data ?? []
}
