import { useState } from 'react'
import { Search, MapPin, Calendar, Users, BedDouble } from 'lucide-react'
import type { HotelSearchParams } from '../types/travel'

type Props = {
  onSearch: (params: HotelSearchParams) => void
  loading: boolean
}

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

export function HotelSearchForm({ onSearch, loading }: Props) {
  const [destination, setDestination] = useState('')
  const [checkInDate, setCheckInDate] = useState(tomorrow)
  const [checkOutDate, setCheckOutDate] = useState('')
  const [adults, setAdults] = useState(2)
  const [rooms, setRooms] = useState(1)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!destination.trim()) {
      setError('Ingresá el destino (ciudad o país)')
      return
    }
    if (!checkOutDate) {
      setError('Seleccioná la fecha de check-out')
      return
    }
    if (checkInDate >= checkOutDate) {
      setError('El check-out debe ser posterior al check-in')
      return
    }

    onSearch({ destination: destination.trim(), checkInDate, checkOutDate, adults, rooms })
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
            <Calendar className="inline w-4 h-4 mr-1 text-green-500" />
            Check-out
          </label>
          <input
            type="date"
            value={checkOutDate}
            min={checkInDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

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
