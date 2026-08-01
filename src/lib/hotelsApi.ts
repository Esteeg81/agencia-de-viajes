import type { HotelSearchParams, HotelSearchResult } from '../types/travel'

export async function searchHotels(params: HotelSearchParams): Promise<HotelSearchResult> {
  const query = new URLSearchParams({
    destination: params.destination,
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    nights: String(params.nights),
    adults: String(params.adults),
    rooms: String(params.rooms),
    allInclusive: String(params.allInclusive),
  })

  if (params.children.length > 0) {
    query.set('childrenAges', params.children.join(','))
  }

  const res = await fetch(`/api/hotels/search?${query}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error desconocido' }))
    throw new Error((err as { message?: string }).message ?? 'Error al buscar hoteles')
  }
  return res.json() as Promise<HotelSearchResult>
}
