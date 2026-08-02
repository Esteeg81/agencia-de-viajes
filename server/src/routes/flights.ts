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

// Mapa de nombres de ciudad/país → código IATA de aeropuerto principal
const CITY_TO_IATA: Record<string, string> = {
  // Argentina
  'buenos aires': 'BUE', 'cordoba': 'COR', 'córdoba': 'COR',
  'rosario': 'ROS', 'mendoza': 'MDZ', 'bariloche': 'BRC',
  'salta': 'SLA', 'tucuman': 'TUC', 'tucumán': 'TUC',
  'mar del plata': 'MDQ', 'iguazu': 'IGR', 'iguazú': 'IGR',
  'neuquen': 'NQN', 'neuquén': 'NQN', 'santa fe': 'SFN',
  'jujuy': 'JUJ', 'posadas': 'PSS', 'ushuaia': 'USH',
  'resistencia': 'RES', 'comodoro rivadavia': 'CRD', 'puerto madryn': 'PMY',
  'san luis': 'LUQ', 'villa mercedes': 'VME', 'la rioja': 'IRJ',
  'catamarca': 'CTC', 'san juan': 'UAQ', 'viedma': 'VDM',
  // Brasil
  'sao paulo': 'GRU', 'são paulo': 'GRU', 'rio de janeiro': 'GIG',
  'rio': 'GIG', 'recife': 'REC', 'salvador': 'SSA',
  'florianopolis': 'FLN', 'florianópolis': 'FLN', 'fortaleza': 'FOR',
  'curitiba': 'CWB', 'brasilia': 'BSB', 'brasília': 'BSB',
  'belo horizonte': 'CNF', 'manaus': 'MAO', 'natal': 'NAT',
  'porto alegre': 'POA', 'foz do iguacu': 'IGU', 'foz do iguaçu': 'IGU',
  'maceio': 'MCZ', 'maceió': 'MCZ', 'belem': 'BEL', 'belém': 'BEL',
  // Chile
  'santiago': 'SCL', 'antofagasta': 'ANF', 'valparaíso': 'VAP',
  // Peru
  'lima': 'LIM', 'cusco': 'CUZ', 'cuzco': 'CUZ', 'arequipa': 'AQP',
  // Colombia
  'bogota': 'BOG', 'bogotá': 'BOG', 'cartagena': 'CTG',
  'medellin': 'MDE', 'medellín': 'MDE', 'cali': 'CLO',
  // Ecuador
  'quito': 'UIO', 'guayaquil': 'GYE',
  // Bolivia
  'la paz': 'LPB', 'santa cruz': 'VVI', 'cochabamba': 'CBB',
  // Paraguay
  'asuncion': 'ASU', 'asunción': 'ASU',
  // Uruguay
  'montevideo': 'MVD', 'punta del este': 'PDP',
  // Venezuela
  'caracas': 'CCS',
  // México
  'cancun': 'CUN', 'cancún': 'CUN', 'mexico city': 'MEX',
  'ciudad de mexico': 'MEX', 'ciudad de méxico': 'MEX',
  'guadalajara': 'GDL', 'monterrey': 'MTY', 'los cabos': 'SJD',
  'puerto vallarta': 'PVR', 'mazatlan': 'MZT',
  // Caribe
  'punta cana': 'PUJ', 'santo domingo': 'SDQ',
  'la habana': 'HAV', 'habana': 'HAV', 'havana': 'HAV',
  'cuba': 'HAV', 'cancun': 'CUN',
  // Centroamérica
  'panama': 'PTY', 'panamá': 'PTY', 'san jose': 'SJO', 'san josé': 'SJO',
  // USA
  'miami': 'MIA', 'new york': 'JFK', 'nueva york': 'JFK',
  'los angeles': 'LAX', 'orlando': 'MCO', 'chicago': 'ORD',
  'houston': 'IAH', 'dallas': 'DFW', 'atlanta': 'ATL',
  'washington': 'IAD', 'san francisco': 'SFO', 'boston': 'BOS',
  'las vegas': 'LAS', 'seattle': 'SEA', 'denver': 'DEN',
  // Europa
  'madrid': 'MAD', 'barcelona': 'BCN', 'paris': 'CDG',
  'london': 'LHR', 'londres': 'LHR', 'amsterdam': 'AMS',
  'frankfurt': 'FRA', 'roma': 'FCO', 'rome': 'FCO',
  'milan': 'MXP', 'milán': 'MXP', 'zurich': 'ZRH', 'zürich': 'ZRH',
  'lisboa': 'LIS', 'lisbon': 'LIS', 'brussels': 'BRU', 'bruselas': 'BRU',
  'vienna': 'VIE', 'viena': 'VIE', 'berlin': 'BER', 'berlín': 'BER',
  'munich': 'MUC', 'múnich': 'MUC', 'warsaw': 'WAW', 'varsovia': 'WAW',
  'praga': 'PRG', 'prague': 'PRG', 'budapest': 'BUD', 'bucarest': 'OTP',
  'copenhague': 'CPH', 'stockholm': 'ARN', 'oslo': 'OSL', 'helsinki': 'HEL',
  'atenas': 'ATH', 'athens': 'ATH', 'dubrovnik': 'DBV', 'dubai': 'DXB',
  // Medio Oriente
  'dubai': 'DXB', 'abu dhabi': 'AUH', 'istanbul': 'IST',
  'estambul': 'IST', 'doha': 'DOH', 'tel aviv': 'TLV',
  // Asia
  'tokyo': 'NRT', 'tokio': 'NRT', 'beijing': 'PEK', 'pekin': 'PEK',
  'hong kong': 'HKG', 'bangkok': 'BKK', 'singapore': 'SIN',
  'singapur': 'SIN', 'seoul': 'ICN', 'seul': 'ICN',
  'mumbai': 'BOM', 'delhi': 'DEL', 'bali': 'DPS',
  // Oceanía
  'sydney': 'SYD', 'melbourne': 'MEL', 'auckland': 'AKL',
}

function resolveAirportCode(input: string): string {
  const trimmed = input.trim()
  if (/^[A-Z]{2,3}$/.test(trimmed)) return trimmed
  return CITY_TO_IATA[trimmed.toLowerCase()] ?? trimmed
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

  const arrivalId = resolveAirportCode(destination)
  const departureId = resolveAirportCode(origin)
  const pax = PASSENGER_MAP[passengers] ?? PASSENGER_MAP['1_adult']!
  const departureDates = getDatesInRange(departureFrom, departureTo)
  const isRoundTrip = tripType === 'roundtrip' && !!returnFrom

  // Trip duration in days: distance between the start of each range keeps the stay length fixed
  const tripDurationDays = isRoundTrip
    ? Math.round((new Date(returnFrom).getTime() - new Date(departureFrom).getTime()) / 86400000)
    : 0

  try {
    const allOffers: ReturnType<typeof transformFlight>[] = []
    const searchedDates: string[] = []

    for (const depDate of departureDates) {
      let returnDate: string | undefined
      if (isRoundTrip) {
        const depMs = new Date(depDate).getTime()
        const calculated = new Date(depMs + tripDurationDays * 86400000).toISOString().split('T')[0]
        // Clamp calculated return within [returnFrom, returnTo]
        const clamped =
          calculated < returnFrom ? returnFrom :
          returnTo && calculated > returnTo ? returnTo :
          calculated
        // Skip if return would be on or before departure (impossible combination)
        if (clamped <= depDate) continue
        returnDate = clamped
      }

      const raw = await searchFlights({
        departure_id: departureId,
        arrival_id: arrivalId,
        outbound_date: depDate,
        return_date: returnDate,
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
