import { Router } from 'express'
import { getHotelsByCity, searchHotelOffers } from '../lib/amadeus.js'
import type { AmadeusHotelOffer } from '../lib/amadeus.js'

const router = Router()

function nightsBetween(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay))
}

function transformOffer(raw: AmadeusHotelOffer) {
  const offer = raw.offers[0]!
  const nights = nightsBetween(offer.checkInDate, offer.checkOutDate)
  const total = offer.price.total
  const perNight = (Number(total) / nights).toFixed(2)
  const currency = offer.price.currency

  return {
    id: offer.id,
    hotelId: raw.hotel.hotelId,
    hotelName: raw.hotel.name,
    rating: raw.hotel.rating,
    cityCode: raw.hotel.cityCode,
    price: { total, currency, perNight },
    checkInDate: offer.checkInDate,
    checkOutDate: offer.checkOutDate,
    nights,
    boardType: offer.boardType,
    description: raw.hotel.description?.text,
    amenities: raw.hotel.amenities?.slice(0, 5),
  }
}

router.get('/search', async (req, res) => {
  const { cityCode, checkInDate, checkOutDate, adults = '1', rooms = '1' } = req.query as Record<string, string>

  if (!cityCode || !checkInDate || !checkOutDate) {
    res.status(400).json({ message: 'Faltan parámetros: cityCode, checkInDate, checkOutDate' })
    return
  }

  if (checkInDate >= checkOutDate) {
    res.status(400).json({ message: 'La fecha de check-out debe ser posterior al check-in' })
    return
  }

  try {
    const hotels = await getHotelsByCity(cityCode)
    if (hotels.length === 0) {
      res.json({ offers: [], cheapest: null, currency: 'USD' })
      return
    }

    const hotelIds = hotels.map((h) => h.hotelId)
    const rawOffers = await searchHotelOffers({
      hotelIds,
      checkInDate,
      checkOutDate,
      adults: Number(adults),
      roomQuantity: Number(rooms),
    })

    const offers = rawOffers.map(transformOffer)
    offers.sort((a, b) => Number(a.price.total) - Number(b.price.total))

    const currency = offers[0]?.price.currency ?? 'USD'
    res.json({ offers, cheapest: offers[0] ?? null, currency })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    res.status(500).json({ message })
  }
})

export default router
