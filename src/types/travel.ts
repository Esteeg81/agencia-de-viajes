export type PassengerOption = '1_adult' | '2_adults' | '2_adults_2_children'

export type Origin = {
  label: string
  iata: string
  city: string
}

export const ORIGINS: Origin[] = [
  { label: 'Santa Fe (SFN)', iata: 'SFN', city: 'Santa Fe' },
  { label: 'Rosario (ROS)', iata: 'ROS', city: 'Rosario' },
  { label: 'Buenos Aires – Aeroparque (AEP)', iata: 'AEP', city: 'Buenos Aires' },
  { label: 'Buenos Aires – Ezeiza (EZE)', iata: 'EZE', city: 'Buenos Aires' },
]

export const PASSENGER_OPTIONS: { value: PassengerOption; label: string; adults: number; children: number }[] = [
  { value: '1_adult', label: '1 Adulto', adults: 1, children: 0 },
  { value: '2_adults', label: '2 Adultos', adults: 2, children: 0 },
  { value: '2_adults_2_children', label: '2 Adultos + 2 Menores', adults: 2, children: 2 },
]

export const LOW_COST_AIRLINES = new Set(['FO', 'JA', 'W4', 'VJ', 'XL'])

export type AirlineType = 'low-cost' | 'tradicional'

export type FlightSegment = {
  departure: { iataCode: string; at: string }
  arrival: { iataCode: string; at: string }
  carrierCode: string
  airlineName: string
  number: string
  duration: string
}

export type Itinerary = {
  duration: string
  segments: FlightSegment[]
}

export type FlightOffer = {
  id: string
  price: {
    total: string
    currency: string
    perAdult: string
  }
  itineraries: Itinerary[]
  validatingAirlineCodes: string[]
  airlineType: AirlineType
  numberOfStops: number
  oneWay: boolean
}

export type SearchParams = {
  origin: string
  destination: string
  departureFrom: string
  departureTo: string
  returnFrom?: string
  returnTo?: string
  passengers: PassengerOption
  tripType: 'roundtrip' | 'oneway'
}

export type SearchResult = {
  offers: FlightOffer[]
  cheapest: FlightOffer | null
  searchedDates: string[]
  currency: string
}
