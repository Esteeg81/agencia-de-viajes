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
  airlineName: string
  airlineType: AirlineType
  numberOfStops: number
  oneWay: boolean
  returnDate?: string
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
  returnOffers?: FlightOffer[]
  cheapest: FlightOffer | null
  searchedDates: string[]
  currency: string
}

// ── Hoteles ──────────────────────────────────────────────────────────────────

export type HotelOffer = {
  id: string
  hotelId: string
  hotelName: string
  rating?: string
  cityCode: string
  price: {
    total: string
    currency: string
    perNight: string
  }
  checkInDate: string
  checkOutDate: string
  nights: number
  boardType?: string
  description?: string
  amenities?: string[]
  imageUrl?: string
  link?: string
  overallRating?: number
  reviewCount?: number
  allInclusive?: boolean
}

export type HotelSearchParams = {
  destination: string
  checkInDate: string
  checkOutDate: string
  nights: number
  adults: number
  children: number[]   // array of child ages, e.g. [5, 8]
  rooms: number
  allInclusive: boolean
}

export type HotelSearchResult = {
  offers: HotelOffer[]
  cheapest: HotelOffer | null
  currency: string
}

// ── Traslados ─────────────────────────────────────────────────────────────────

export type TransferType = 'PRIVATE' | 'SHARED' | 'TAXI'

export type TransferOffer = {
  id: string
  transferType: TransferType
  vehicle: {
    code: string
    description: string
    seats?: number
  }
  serviceProvider: {
    name: string
  }
  departure: {
    locationCode: string
    dateTime: string
  }
  arrival: {
    name: string
    cityName: string
  }
  price: {
    total: string
    currency: string
  }
  duration?: string
  distance?: { value: number; unit: string }
}

export type TransferSearchParams = {
  startLocationCode: string
  endName: string
  endCityName: string
  endCountryCode: string
  startDateTime: string
  passengers: number
  transferType: TransferType
}

export type TransferSearchResult = {
  offers: TransferOffer[]
  cheapest: TransferOffer | null
  currency: string
}

// ── Preset vuelo desde hotel ──────────────────────────────────────────────────

export type FlightPreset = {
  destination: string
  origin: string
  departureFrom: string
  departureTo: string
  returnFrom: string
  returnTo: string
  passengers: PassengerOption
}

// ── Modos de búsqueda ─────────────────────────────────────────────────────────

export type SearchMode = 'flights' | 'hotels' | 'transfers'

export const COUNTRY_CODES: { label: string; value: string }[] = [
  { label: 'Argentina', value: 'AR' },
  { label: 'Brasil', value: 'BR' },
  { label: 'Chile', value: 'CL' },
  { label: 'Uruguay', value: 'UY' },
  { label: 'Paraguay', value: 'PY' },
  { label: 'Bolivia', value: 'BO' },
  { label: 'Perú', value: 'PE' },
  { label: 'Colombia', value: 'CO' },
  { label: 'México', value: 'MX' },
  { label: 'Estados Unidos', value: 'US' },
  { label: 'España', value: 'ES' },
  { label: 'Francia', value: 'FR' },
  { label: 'Italia', value: 'IT' },
  { label: 'Alemania', value: 'DE' },
  { label: 'Otro', value: 'OT' },
]
