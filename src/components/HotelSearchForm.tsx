import { useState } from 'react'
import { Search, MapPin, Calendar, Users, BedDouble, Moon, Star } from 'lucide-react'
import type { HotelSearchParams } from '../types/travel'

type Props = {
  onSearch: (params: HotelSearchParams) => void
  loading: boolean
}

const NIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21]

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = new Date().toISOString().split('T')[0]
const tomorrow = addDays(today, 1)

export function HotelSearchForm({ onSearch, loading }: Props) {
  const [destination, setDestination] = useState('')
  const [checkInDate, setCheckInDate] = useState(tomorrow)
  const [nights, setNights] = useState(7)
  const [adults, setAdults] = useState(2)
  const [rooms, setRooms] = useState(1)
  const [allInclusive, setAllInclusive] = useState(false)
  const [error, setError] = useState('')

  const checkOutDate = addDays(checkInDate, nights)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!destination.trim()) {
      setError('Ingresá el destino (ciudad o país)')
      return
    }

    onSearch({
      destination: destination.trim(),
      checkInDate,
      checkOutDate,
      nights,
      adults,
      rooms,
      allInclusive,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="inline w-4 h-4 mr-1 text-amber-500" />
            Ciudad o destino
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Ej: Bariloche, Buenos Aires, Miami, Madrid"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="inline w-4 h-4 mr-1 text-amber-500" />
              Adultos
            </label>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} adulto{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BedDouble className="inline w-4 h-4 mr-1 text-amber-500" />
              Habitaciones
            </label>
            <select
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>{n} hab{n > 1 ? 's' : ''}.</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline w-4 h-4 mr-1 text-amber-500" />
            Check-in
          </label>
          <input
            type="date"
            value={checkInDate}
            min={today}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Moon className="inline w-4 h-4 mr-1 text-indigo-500" />
            Noches
          </label>
          <select
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {NIGHT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} noche{n > 1 ? 's' : ''}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Check-out: {checkOutDate}</p>
        </div>
      </div>

      {/* All Inclusive */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            checked={allInclusive}
            onChange={(e) => setAllInclusive(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-11 h-6 rounded-full transition-colors ${allInclusive ? 'bg-amber-500' : 'bg-gray-200'}`}
          />
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${allInclusive ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </div>
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Star className="w-4 h-4 text-amber-500" />
          Solo All Inclusive / Todo Incluido
        </span>
      </label>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Search className="w-5 h-5" />
        {loading ? 'Buscando hoteles...' : 'Buscar hoteles'}
      </button>
    </form>
  )
}
