import { Router } from 'express'
import {
  searchFlights,
  classifyAirlineName,
  airlineToIata,
  minutesToIsoDuration,
  serpTimeToIso,
  getDatesInRange,
} from '../lib/serpapi.js'
import type { SerpFlight } from '../lib/serpapi.js'

const router = Router()

const PASSENGER_MAP: Record<string, { adults: number; children: number }> = {
  '1_adult': { adults: 1, children: 0 },
  '2_adults': { adults: 2, children: 0 },
  '2_adults_2_children': { adults: 2, children: 2 },
}

let offerCounter = 0

function transformFlight(raw: SerpFlight, currency: string, adults: number) {
  const mainAirline = raw.flights[0]?.airline ?? 'Desconocida'
  const airlineCode = airlineToIata(mainAirline)
  const airlineType = classifyAirlineName(mainAirline)
  const stops = Math.max(0, raw.flights.length - 1)

  const segments = raw.flights.map((seg) => ({
    departure: { iataCode: seg.departure_airport.id, at: serpTimeToIso(seg.departure_airport.time) },
    arrival: { iataCode: seg.arrival_airport.id, at: serpTimeToIso(seg.arrival_airport.time) },
    carrierCode: airlineToIata(seg.airline),
    airlineName: seg.airline,
    number: seg.flight_number,
    duration: minutesToIsoDuration(seg.duration),
  }))

  const total = raw.price.toFixed(2)
  const perAdult = (raw.price / adults).toFixed(2)

  return {
    id: `flight-${++offerCounter}-${raw.price}`,
    price: { total, currency, perAdult },
    itineraries: [{ duration: minutesToIsoDuration(raw.total_duration), segments }],
    validatingAirlineCodes: [airlineCode],
    airlineType,
    numberOfStops: stops,
    oneWay: raw.type !== 'Round trip',
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

  const pax = PASSENGER_MAP[passengers] ?? PASSENGER_MAP['1_adult']!
  const departureDates = getDatesInRange(departureFrom, departureTo)
  const returnDate =
    tripType === 'roundtrip' && returnFrom && returnTo ? returnFrom : undefined

  const isRoundTrip = tripType === 'roundtrip' && !!returnDate

  try {
    const allOffers: ReturnType<typeof transformFlight>[] = []
    const searchedDates: string[] = []

    for (const depDate of departureDates) {
      const raw = await searchFlights({
        departure_id: origin,
        arrival_id: destination,
        outbound_date: depDate,
        return_date: isRoundTrip ? returnDate : undefined,
        adults: pax.adults,
        children: pax.children,
        type: isRoundTrip ? 1 : 2,
      })

      searchedDates.push(depDate)
      for (const r of raw) {
        allOffers.push(transformFlight(r, 'USD', pax.adults))
      }
    }

    if (allOffers.length === 0) {
      res.json({ offers: [], cheapest: null, searchedDates, currency: 'USD' })
      return
    }

    allOffers.sort((a, b) => Number(a.price.total) - Number(b.price.total))

    res.json({
      offers: allOffers,
      cheapest: allOffers[0] ?? null,
      searchedDates,
      currency: 'USD',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    res.status(500).json({ message })
  }
})

export default router
