import type { PassengerOption } from './travel'

export type HotelTaskResult = {
  hotelCount: number
  cheapestPrice?: string
  currency?: string
  cheapestName?: string
}

export type FlightTaskResult = {
  flightCount: number
  cheapestPrice?: string
  currency?: string
  cheapestDate?: string
}

export type HotelTask = {
  id: string
  type: 'hotel'
  name: string
  destination: string
  checkInDate: string
  checkOutDate: string
  nights: number
  adults: number
  children: number[]
  allInclusive: boolean
  lastRun?: string
  lastResult?: HotelTaskResult
}

export type FlightTask = {
  id: string
  type: 'flight'
  name: string
  origin: string
  destination: string
  departureFrom: string
  departureTo: string
  returnFrom?: string
  returnTo?: string
  passengers: PassengerOption
  tripType: 'roundtrip' | 'oneway'
  lastRun?: string
  lastResult?: FlightTaskResult
}

export type ScheduledTask = HotelTask | FlightTask

export type WsSettings = {
  phone: string
}
