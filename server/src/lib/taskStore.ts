import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// /tmp persists across Render sleeps (but not deploys). Good enough for daily cron.
const DIR  = '/tmp/agencia'
const FILE = join(DIR, 'tasks.json')

export type PriceEntry = { date: string; price: number; count: number }

export type ServerHotelTask = {
  id: string; type: 'hotel'; name: string
  destination: string; checkInDate: string; checkOutDate: string
  nights: number; adults: number; children: number[]; allInclusive: boolean
  targetPrice?: number; priceHistory?: PriceEntry[]
  lastRun?: string
  lastResult?: { hotelCount: number; cheapestPrice?: string; currency?: string; cheapestName?: string }
}

export type ServerFlightTask = {
  id: string; type: 'flight'; name: string
  origin: string; destination: string
  departureFrom: string; departureTo: string
  returnFrom?: string; returnTo?: string
  passengers: string; tripType: string
  targetPrice?: number; priceHistory?: PriceEntry[]
  lastRun?: string
  lastResult?: { flightCount: number; cheapestPrice?: string; currency?: string; cheapestDate?: string }
}

export type ServerTask = ServerHotelTask | ServerFlightTask

export function readTasks(): ServerTask[] {
  try {
    if (!existsSync(FILE)) return []
    return JSON.parse(readFileSync(FILE, 'utf-8')) as ServerTask[]
  } catch {
    return []
  }
}

export function writeTasks(tasks: ServerTask[]): void {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(tasks), 'utf-8')
}
