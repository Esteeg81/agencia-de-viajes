import type { SearchParams, SearchResult } from '../types/travel'

const API_BASE = '/api'

export async function searchFlights(params: SearchParams): Promise<SearchResult> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    departureFrom: params.departureFrom,
    departureTo: params.departureTo,
    passengers: params.passengers,
    tripType: params.tripType,
    ...(params.returnFrom ? { returnFrom: params.returnFrom } : {}),
    ...(params.returnTo ? { returnTo: params.returnTo } : {}),
  })

  const res = await fetch(`${API_BASE}/flights/search?${query}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error desconocido' }))
    throw new Error(err.message ?? 'Error al buscar vuelos')
  }
  return res.json() as Promise<SearchResult>
}
