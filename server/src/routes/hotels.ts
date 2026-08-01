import { Router } from 'express'
import { searchHotels } from '../lib/serpapi.js'
import type { SerpHotel } from '../lib/serpapi.js'

const router = Router()

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(1, Math.round(ms / 86400000))
}

let hotelCounter = 0

function transformHotel(raw: SerpHotel, checkIn: string, checkOut: string) {
  const nights = nightsBetween(checkIn, checkOut)
  const total = raw.total_rate?.extracted_lowest ?? (raw.rate_per_night?.extracted_lowest ?? 0) * nights
  const perNight = raw.rate_per_night?.extracted_lowest ?? (total / nights)

  return {
    id: `hotel-${++hotelCounter}-${raw.name.slice(0, 8)}`,
    hotelId: raw.name.replace(/\s+/g, '-').toLowerCase(),
    hotelName: raw.name,
    rating: raw.extracted_hotel_class ? String(raw.extracted_hotel_class) : undefined,
    cityCode: '',
    price: {
      total: total.toFixed(2),
      currency: 'USD',
      perNight: perNight.toFixed(2),
    },
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nights,
    boardType: undefined,
    description: raw.description,
    amenities: raw.amenities?.slice(0, 6),
    imageUrl: raw.images?.[0]?.thumbnail,
    link: raw.link,
    overallRating: raw.overall_rating,
    reviewCount: raw.reviews?.count,
  }
}

router.get('/search', async (req, res) => {
  const {
    destination,
    checkInDate,
    checkOutDate,
    adults = '1',
    rooms = '1',
    allInclusive = 'false',
    childrenAges = '',
  } = req.query as Record<string, string>

  const childrenAgeList = childrenAges
    ? childrenAges.split(',').map(Number).filter((n) => !isNaN(n))
    : []

  if (!destination || !checkInDate || !checkOutDate) {
    res.status(400).json({ message: 'Faltan parámetros: destination, checkInDate, checkOutDate' })
    return
  }

  if (checkInDate >= checkOutDate) {
    res.status(400).json({ message: 'El check-out debe ser posterior al check-in' })
    return
  }

  const wantsAllInclusive = allInclusive === 'true'

  try {
    const raw = await searchHotels({
      destination,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      adults: Number(adults),
      all_inclusive: wantsAllInclusive,
    })

    let offers = raw
      .filter((h) => h.total_rate?.extracted_lowest || h.rate_per_night?.extracted_lowest)
      .map((h) => transformHotel(h, checkInDate, checkOutDate))

    if (wantsAllInclusive) {
      const AI_KEYWORDS = ['all inclusive', 'todo incluido', 'all-inclusive', 'todo-incluido']
      offers = offers.filter((o) => {
        const haystack = [
          ...(o.amenities ?? []),
          o.description ?? '',
          o.hotelName,
        ].join(' ').toLowerCase()
        return AI_KEYWORDS.some((kw) => haystack.includes(kw))
      })
    }

    offers.sort((a, b) => Number(a.price.total) - Number(b.price.total))

    res.json({ offers, cheapest: offers[0] ?? null, currency: 'USD' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    res.status(500).json({ message })
  }
})

export default router
