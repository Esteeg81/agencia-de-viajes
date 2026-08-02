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

// Aeropuertos argentinos para búsqueda con fallback
const ARGENTINA_AIRPORTS = ['EZE', 'AEP', 'ROS', 'SFN']

// Mapa de nombres de ciudad/país → código IATA de aeropuerto principal
// Para destinos turísticos sin aeropuerto propio se usa el más cercano
const CITY_TO_IATA: Record<string, string> = {
  // Argentina – ciudades principales
  'buenos aires': 'BUE', 'cordoba': 'COR', 'córdoba': 'COR',
  'rosario': 'ROS', 'mendoza': 'MDZ', 'bariloche': 'BRC',
  'salta': 'SLA', 'tucuman': 'TUC', 'tucumán': 'TUC',
  'mar del plata': 'MDQ', 'iguazu': 'IGR', 'iguazú': 'IGR',
  'neuquen': 'NQN', 'neuquén': 'NQN', 'santa fe': 'SFN',
  'jujuy': 'JUJ', 'posadas': 'PSS', 'ushuaia': 'USH',
  'resistencia': 'RES', 'comodoro rivadavia': 'CRD', 'puerto madryn': 'PMY',
  'san luis': 'LUQ', 'villa mercedes': 'VME', 'la rioja': 'IRJ',
  'catamarca': 'CTC', 'san juan': 'UAQ', 'viedma': 'VDM',
  // Argentina – destinos turísticos sin aeropuerto propio
  'el calafate': 'FTE',
  'villa carlos paz': 'COR',      // Aeropuerto Córdoba (~1h)
  'san martin de los andes': 'CPC',
  'san martín de los andes': 'CPC',
  'puerto iguazu': 'IGR', 'puerto iguazú': 'IGR',
  // Brasil – ciudades principales
  'sao paulo': 'GRU', 'são paulo': 'GRU', 'rio de janeiro': 'GIG',
  'rio': 'GIG', 'recife': 'REC', 'salvador': 'SSA',
  'florianopolis': 'FLN', 'florianópolis': 'FLN', 'fortaleza': 'FOR',
  'curitiba': 'CWB', 'brasilia': 'BSB', 'brasília': 'BSB',
  'belo horizonte': 'CNF', 'manaus': 'MAO', 'natal': 'NAT',
  'porto alegre': 'POA', 'foz do iguacu': 'IGU', 'foz do iguaçu': 'IGU',
  'maceio': 'MCZ', 'maceió': 'MCZ', 'belem': 'BEL', 'belém': 'BEL',
  'campo grande': 'CGR', 'cuiaba': 'CGB', 'cuiabá': 'CGB',
  'boa vista': 'BVB', 'teresina': 'THE',
  'sao luis': 'SLZ', 'são luís': 'SLZ', 'sao luís': 'SLZ',
  'aracaju': 'AJU', 'joao pessoa': 'JPA', 'joão pessoa': 'JPA',
  // Brasil – destinos turísticos sin aeropuerto propio
  'porto de galinhas': 'REC',     // Aeropuerto Recife (~1h)
  'porto seguro': 'BPS',
  'arraial d\'ajuda': 'BPS',      // Aeropuerto Porto Seguro (~30min)
  'arraial d ajuda': 'BPS',
  'trancoso': 'BPS',              // Aeropuerto Porto Seguro (~1h)
  'ilheus': 'IOS', 'ilhéus': 'IOS',
  'itacare': 'IOS', 'itacaré': 'IOS',  // Aeropuerto Ilhéus (~1h)
  'jericoacoara': 'JJD',          // Aeropuerto Jericoacoara (pequeño, con conexiones)
  'fernando de noronha': 'FEN',
  'lencois maranhenses': 'SLZ',   // Aeropuerto São Luís (~4h)
  'lençóis maranhenses': 'SLZ',
  'bonito': 'BYO',                // Aeropuerto Bonito
  'alter do chao': 'STM', 'alter do chão': 'STM',  // Aeropuerto Santarém
  'paraty': 'GIG',                // Aeropuerto Galeão Rio (~4h)
  'buzios': 'GIG', 'búzios': 'GIG',     // Aeropuerto Galeão Rio
  'gramado': 'CXJ',               // Aeropuerto Caxias do Sul (~2h)
  'serra gaucha': 'CXJ', 'serra gaúcha': 'CXJ',
  // Chile – ciudades principales
  'santiago': 'SCL', 'antofagasta': 'ANF', 'valparaíso': 'VAP',
  // Chile – destinos turísticos
  'vina del mar': 'SCL', 'viña del mar': 'SCL',
  'pucon': 'ZCO', 'pucón': 'ZCO',         // Aeropuerto Temuco (~2h)
  'torres del paine': 'PUQ',              // Aeropuerto Punta Arenas (~5h)
  'puerto natales': 'PUQ',
  // Peru
  'lima': 'LIM', 'cusco': 'CUZ', 'cuzco': 'CUZ', 'arequipa': 'AQP',
  'machu picchu': 'CUZ',                  // Aeropuerto Cusco (~3h)
  // Colombia
  'bogota': 'BOG', 'bogotá': 'BOG', 'cartagena': 'CTG',
  'medellin': 'MDE', 'medellín': 'MDE', 'cali': 'CLO',
  'santa marta': 'SMR',
  // Ecuador
  'quito': 'UIO', 'guayaquil': 'GYE',
  'galapagos': 'GPS', 'galápagos': 'GPS',
  // Bolivia
  'la paz': 'LPB', 'santa cruz': 'VVI', 'cochabamba': 'CBB',
  // Paraguay
  'asuncion': 'ASU', 'asunción': 'ASU',
  // Uruguay
  'montevideo': 'MVD', 'punta del este': 'PDP',
  // Venezuela
  'caracas': 'CCS', 'isla margarita': 'PMV',
  // México
  'cancun': 'CUN', 'cancún': 'CUN', 'mexico city': 'MEX',
  'ciudad de mexico': 'MEX', 'ciudad de méxico': 'MEX',
  'guadalajara': 'GDL', 'monterrey': 'MTY', 'los cabos': 'SJD',
  'puerto vallarta': 'PVR', 'mazatlan': 'MZT',
  'tulum': 'CUN', 'playa del carmen': 'CUN',   // Aeropuerto Cancún
  'oaxaca': 'OAX',
  // Caribe
  'punta cana': 'PUJ', 'santo domingo': 'SDQ',
  'la habana': 'HAV', 'habana': 'HAV', 'havana': 'HAV', 'cuba': 'HAV',
  'aruba': 'AUA', 'curacao': 'CUR', 'curazao': 'CUR',
  // Centroamérica
  'panama': 'PTY', 'panamá': 'PTY', 'san jose': 'SJO', 'san josé': 'SJO',
  // USA
  'miami': 'MIA', 'new york': 'JFK', 'nueva york': 'JFK',
  'los angeles': 'LAX', 'orlando': 'MCO', 'chicago': 'ORD',
  'houston': 'IAH', 'dallas': 'DFW', 'atlanta': 'ATL',
  'washington': 'IAD', 'san francisco': 'SFO', 'boston': 'BOS',
  'las vegas': 'LAS', 'seattle': 'SEA', 'denver': 'DEN',
  'nueva orleans': 'MSY', 'washington dc': 'IAD',
  'los ángeles': 'LAX',
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
  'estocolmo': 'ARN', 'edimburgo': 'EDI',
  'atenas': 'ATH', 'athens': 'ATH', 'dubrovnik': 'DBV',
  'santorini': 'JTR', 'ibiza': 'IBZ', 'mallorca': 'PMI',
  'sevilla': 'SVQ', 'valencia': 'VLC',
  // Medio Oriente y África
  'dubai': 'DXB', 'abu dhabi': 'AUH', 'abu dabi': 'AUH',
  'istanbul': 'IST', 'estambul': 'IST', 'doha': 'DOH', 'tel aviv': 'TLV',
  'cairo': 'CAI', 'marrakech': 'RAK',
  // Asia y Oceanía
  'tokyo': 'NRT', 'tokio': 'NRT', 'beijing': 'PEK', 'pekin': 'PEK',
  'hong kong': 'HKG', 'bangkok': 'BKK', 'singapore': 'SIN',
  'singapur': 'SIN', 'seoul': 'ICN', 'seul': 'ICN', 'seúl': 'ICN',
  'mumbai': 'BOM', 'delhi': 'DEL', 'bali': 'DPS',
  'osaka': 'KIX', 'kuala lumpur': 'KUL', 'shanghai': 'PVG',
  // Oceanía
  'sydney': 'SYD', 'melbourne': 'MEL', 'auckland': 'AKL',
}

function resolveAirportCode(input: string): string {
  const trimmed = input.trim()
  if (/^[A-Z]{2,3}$/.test(trimmed)) return trimmed
  return CITY_TO_IATA[trimmed.toLowerCase()] ?? trimmed
}

let offerCounter = 0

function transformFlight(raw: SerpFlight, currency: string, adults: number, label?: string) {
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
    itineraries: [{
      duration: minutesToIsoDuration(raw.total_duration),
      durationMinutes: raw.total_duration,
      segments,
      numberOfStops: stops,
      directionLabel: label,
    }],
    validatingAirlineCodes: [airlineCode],
    airlineName: mainAirline,
    airlineType,
    numberOfStops: stops,
    oneWay: true,
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
  const isRoundTrip = tripType === 'roundtrip' && !!returnFrom

  const MAX_DATES = 7
  const departureDates = getDatesInRange(departureFrom, departureTo).slice(0, MAX_DATES)

  const tripDurationDays = isRoundTrip && returnFrom
    ? Math.round((new Date(returnFrom + 'T00:00:00Z').getTime() - new Date(departureFrom + 'T00:00:00Z').getTime()) / 86400000)
    : 0

  type Offer = ReturnType<typeof transformFlight>

  // One-way type=2 search over a list of dates
  async function searchOneWay(depId: string, arrId: string, dates: string[], label?: string): Promise<Offer[]> {
    const results: Offer[] = []
    for (const date of dates) {
      try {
        const raw = await searchFlights({
          departure_id: depId,
          arrival_id: arrId,
          outbound_date: date,
          adults: pax.adults,
          children: pax.children,
          type: 2,
        })
        for (const r of raw) results.push(transformFlight(r, 'USD', pax.adults, label))
      } catch {
        // skip failed dates
      }
    }
    return results
  }

  // Tries primaryDep → arr; falls back to other dep airports
  async function searchWithDepFallback(primaryDep: string, arr: string, dates: string[], label?: string): Promise<Offer[]> {
    const primary = await searchOneWay(primaryDep, arr, dates, label)
    if (primary.length > 0) return primary
    for (const fb of ARGENTINA_AIRPORTS) {
      if (fb === primaryDep) continue
      const r = await searchOneWay(fb, arr, dates, label)
      if (r.length > 0) return r
    }
    return []
  }

  // Tries dep → primaryArr; falls back to other arr airports
  async function searchWithArrFallback(dep: string, primaryArr: string, dates: string[], label?: string): Promise<Offer[]> {
    const primary = await searchOneWay(dep, primaryArr, dates, label)
    if (primary.length > 0) return primary
    for (const fb of ARGENTINA_AIRPORTS) {
      if (fb === primaryArr) continue
      const r = await searchOneWay(dep, fb, dates, label)
      if (r.length > 0) return r
    }
    return []
  }

  try {
    const outboundLabel = isRoundTrip ? 'IDA' : undefined
    const outboundOffers = await searchWithDepFallback(departureId, arrivalId, departureDates, outboundLabel)

    let finalOffers: (Offer & { oneWay: boolean })[] = outboundOffers

    if (isRoundTrip && tripDurationDays > 0 && outboundOffers.length > 0) {
      // Map each departure date to its clamped return date
      const depToRet = new Map<string, string>()
      for (const d of departureDates) {
        const rd = new Date(d + 'T00:00:00Z')
        rd.setUTCDate(rd.getUTCDate() + tripDurationDays)
        const rfMs = new Date(returnFrom! + 'T00:00:00Z').getTime()
        const rtMs = new Date((returnTo ?? returnFrom!) + 'T00:00:00Z').getTime()
        const retDate = new Date(Math.max(rfMs, Math.min(rtMs, rd.getTime()))).toISOString().slice(0, 10)
        if (retDate > d) depToRet.set(d, retDate)
      }

      const uniqueReturnDates = [...new Set(depToRet.values())]
      const returnOffers = await searchWithArrFallback(arrivalId, departureId, uniqueReturnDates, 'VUELTA')

      // Group return offers by their departure date
      const returnByDate = new Map<string, Offer[]>()
      for (const r of returnOffers) {
        const date = r.itineraries[0].segments[0].departure.at.slice(0, 10)
        if (!returnByDate.has(date)) returnByDate.set(date, [])
        returnByDate.get(date)!.push(r)
      }

      // Group outbound by date
      const outboundByDate = new Map<string, Offer[]>()
      for (const o of outboundOffers) {
        const date = o.itineraries[0].segments[0].departure.at.slice(0, 10)
        if (!outboundByDate.has(date)) outboundByDate.set(date, [])
        outboundByDate.get(date)!.push(o)
      }

      const paired: (Offer & { oneWay: boolean })[] = []
      let pairId = 0

      for (const [depDate, outbounds] of outboundByDate) {
        const retDate = depToRet.get(depDate)
        if (!retDate) continue
        const rets = (returnByDate.get(retDate) ?? []).sort((a, b) => Number(a.price.total) - Number(b.price.total))
        if (rets.length === 0) continue

        const bestReturn = rets[0]
        for (const outbound of outbounds.slice(0, 5)) {
          const totalPrice = (Number(outbound.price.total) + Number(bestReturn.price.total)).toFixed(2)
          const totalPerAdult = (Number(outbound.price.perAdult) + Number(bestReturn.price.perAdult)).toFixed(2)
          paired.push({
            id: `trip-${++pairId}`,
            price: { total: totalPrice, currency: 'USD', perAdult: totalPerAdult },
            itineraries: [outbound.itineraries[0], bestReturn.itineraries[0]],
            validatingAirlineCodes: outbound.validatingAirlineCodes,
            airlineName: outbound.airlineName,
            airlineType: outbound.airlineType,
            numberOfStops: outbound.numberOfStops,
            oneWay: false,
          })
        }
      }

      // Only use paired results if pairing succeeded; otherwise fall back to outbound-only
      if (paired.length > 0) finalOffers = paired
    }

    if (finalOffers.length === 0) {
      res.json({ offers: [], cheapest: null, searchedDates: departureDates, currency: 'USD' })
      return
    }

    finalOffers.sort((a, b) => Number(a.price.total) - Number(b.price.total))

    res.json({
      offers: finalOffers,
      cheapest: finalOffers[0] ?? null,
      searchedDates: departureDates,
      currency: 'USD',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    res.status(500).json({ message })
  }
})

export default router
