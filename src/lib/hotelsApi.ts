import type { HotelSearchParams, HotelSearchResult } from '../types/travel'

export async function searchHotels(params: HotelSearchParams): Promise<HotelSearchResult> {
  const query = new URLSearchParams({
    cityCode: params.cityCode,
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    adults: String(params.adults),
    rooms: String(params.rooms),
  })

  const res = await fetch(`/api/hotels/search?${query}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error desconocido' }))
    throw new Error((err as { message?: string }).message ?? 'Error al buscar hoteles')
  }
  return res.json() as Promise<HotelSearchResult>
}
