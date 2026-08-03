import { searchHotels } from './serpapi.js'
import { searchFlights, getDatesInRange } from './serpapi.js'
import type { ServerHotelTask, ServerFlightTask, PriceEntry } from './taskStore.js'

const PASSENGER_MAP: Record<string, { adults: number; children: number }> = {
  '1_adult': { adults: 1, children: 0 },
  '2_adults': { adults: 2, children: 0 },
  '2_adults_2_children': { adults: 2, children: 2 },
}

function nightsBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function appendHistory(existing: PriceEntry[] | undefined, price: number, count: number): PriceEntry[] {
  const entry: PriceEntry = { date: new Date().toISOString(), price, count }
  return [...(existing ?? []), entry].slice(-10)
}

export async function runHotelTask(task: ServerHotelTask): Promise<ServerHotelTask> {
  const raw = await searchHotels({
    destination: task.destination,
    check_in_date: task.checkInDate,
    check_out_date: task.checkOutDate,
    adults: task.adults,
    all_inclusive: task.allInclusive,
  })

  const nights = nightsBetween(task.checkInDate, task.checkOutDate)
  const offers = raw
    .filter(h => h.total_rate?.extracted_lowest || h.rate_per_night?.extracted_lowest)
    .map(h => {
      const total = h.total_rate?.extracted_lowest ?? (h.rate_per_night?.extracted_lowest ?? 0) * nights
      return { name: h.name, total }
    })
    .sort((a, b) => a.total - b.total)

  const cheapest = offers[0]
  const currentPrice = cheapest?.total ?? 0

  return {
    ...task,
    lastRun: new Date().toISOString(),
    lastResult: {
      hotelCount: offers.length,
      cheapestPrice: cheapest ? currentPrice.toFixed(2) : undefined,
      currency: 'USD',
      cheapestName: cheapest?.name,
    },
    priceHistory: appendHistory(task.priceHistory, currentPrice, offers.length),
  }
}

export async function runFlightTask(task: ServerFlightTask): Promise<ServerFlightTask> {
  const pax = PASSENGER_MAP[task.passengers] ?? PASSENGER_MAP['1_adult']!
  const dates = getDatesInRange(task.departureFrom, task.departureTo).slice(0, 7)

  let cheapestPrice = Infinity
  let cheapestDate: string | undefined

  for (const date of dates) {
    try {
      const { flights } = await searchFlights({
        departure_id: task.origin,
        arrival_id: task.destination,
        outbound_date: date,
        adults: pax.adults,
        children: pax.children,
        type: 2,
      })
      for (const f of flights) {
        if (f.price < cheapestPrice) {
          cheapestPrice = f.price
          cheapestDate = date
        }
      }
    } catch { /* skip date */ }
  }

  const found = cheapestPrice < Infinity
  const currentPrice = found ? cheapestPrice : 0

  return {
    ...task,
    lastRun: new Date().toISOString(),
    lastResult: {
      flightCount: found ? 1 : 0,
      cheapestPrice: found ? currentPrice.toFixed(2) : undefined,
      currency: 'USD',
      cheapestDate,
    },
    priceHistory: appendHistory(task.priceHistory, currentPrice, found ? 1 : 0),
  }
}
