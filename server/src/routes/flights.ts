import { Router } from 'express'
import { searchFlightOffers, classifyAirline, getDatesInRange } from '../lib/amadeus.js'
import type { AmadeusFlightOffer } from '../lib/amadeus.js'

const router = Router()

const PASSENGER_MAP: Record<string, { adults: number; children: number }> = {
  '1_adult': { adults: 1, children: 0 },
  '2_adults': { adults: 2, children: 0 },
  '2_adults_2_children': { adults: 2, children: 2 },
}

function transformOffer(raw: AmadeusFlightOffer, currency: string) {
  const airlineType = classifyAirline(raw.validatingAirlineCodes)
  const totalStops = raw.itineraries.reduce((acc, itin) => acc + Math.max(0, itin.segments.length - 1), 0)

  return {
    id: raw.id,
    price: {
      total: raw.price.total,
      currency,
      perAdult: raw.price.perAdult?.total ?? raw.price.total,
    },
    itineraries: raw.itineraries.map((itin) => ({
      duration: itin.duration,
      segments: itin.segments.map((seg) => ({
        departure: seg.departure,
        arrival: seg.arrival,
        carrierCode: seg.carrierCode,
        airlineName: seg.carrierCode,
        number: seg.number,
        duration: seg.duration,
      })),
    })),
    validatingAirlineCodes: raw.validatingAirlineCodes,
    airlineType,
    numberOfStops: totalStops,
    oneWay: raw.oneWay,
  }
}

router.get('/search', async (req, res) => {
  const {
    origin,
    destination,
    departureFrom,
    departureTo,
    returnFrom,
    returnTo,
    passengers = '1_adult',
    tripType = 'roundtrip',
  } = req.query as Record<string, string>

  if (!origin || !destination || !departureFrom || !departureTo) {
    res.status(400).json({ message: 'Faltan parámetros requeridos' })
    return
  }

  const pax = PASSENGER_MAP[passengers] ?? PASSENGER_MAP['1_adult']
  const departureDates = getDatesInRange(departureFrom, departureTo)
  const returnDates =
    tripType === 'roundtrip' && returnFrom && returnTo
      ? getDatesInRange(returnFrom, returnTo)
      : undefined

  try {
    const allOffers: ReturnType<typeof transformOffer>[] = []
    const searchedDates: string[] = []

    for (const depDate of departureDates) {
      const retDate = returnDates ? returnDates[0] : undefined
      const raw = await searchFlightOffers({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: depDate,
        returnDate: retDate,
        adults: pax.adults,
        children: pax.children,
        max: 5,
      })

      searchedDates.push(depDate)
      for (const rawOffer of raw) {
        const currency = rawOffer.price.currency ?? 'USD'
        allOffers.push(transformOffer(rawOffer, currency))
      }
    }

    if (allOffers.length === 0) {
      res.json({ offers: [], cheapest: null, searchedDates, currency: 'ARS' })
      return
    }

    allOffers.sort((a, b) => Number(a.price.total) - Number(b.price.total))

    const currency = allOffers[0]?.price.currency ?? 'ARS'
    const uniqueById = allOffers.filter(
      (o, i, arr) => arr.findIndex((x) => x.id === o.id) === i
    )

    res.json({
      offers: uniqueById,
      cheapest: uniqueById[0] ?? null,
      searchedDates,
      currency,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    res.status(500).json({ message })
  }
})

export default router
