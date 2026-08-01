import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Users, ArrowLeftRight } from 'lucide-react'
import { ORIGINS, PASSENGER_OPTIONS } from '../types/travel'
import type { SearchParams, PassengerOption, FlightPreset } from '../types/travel'

type Props = {
  onSearch: (params: SearchParams) => void
  loading: boolean
  preset?: FlightPreset | null
}

const today = new Date().toISOString().split('T')[0]

export function SearchForm({ onSearch, loading, preset }: Props) {
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip')
  const [origin, setOrigin] = useState(ORIGINS[2].iata)
  const [destination, setDestination] = useState('')
  const [departureFrom, setDepartureFrom] = useState(today)
  const [departureTo, setDepartureTo] = useState(today)
  const [returnFrom, setReturnFrom] = useState('')
  const [returnTo, setReturnTo] = useState('')
  const [passengers, setPassengers] = useState<PassengerOption>('1_adult')
  const [error, setError] = useState('')

  // When a preset arrives from the hotel tab, populate the form and auto-search
  useEffect(() => {
    if (!preset) return
    setTripType('roundtrip')
    setOrigin(preset.origin)
    setDestination(preset.destination)
    setDepartureFrom(preset.departureFrom)
    setDepartureTo(preset.departureTo)
    setReturnFrom(preset.returnFrom)
    setReturnTo(preset.returnTo)
    setPassengers(preset.passengers)
    setError('')
    onSearch({
      origin: preset.origin,
      destination: preset.destination,
      departureFrom: preset.departureFrom,
      departureTo: preset.departureTo,
      returnFrom: preset.returnFrom,
      returnTo: preset.returnTo,
      passengers: preset.passengers,
      tripType: 'roundtrip',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!destination.trim()) {
      setError('Ingresá un destino')
      return
    }
    if (destination.trim().length < 3) {
      setError('Ingresá al menos 3 letras del destino o código IATA (ej: BRC, MDZ)')
      return
    }
    if (departureFrom > departureTo) {
      setError('La fecha "desde" no puede ser posterior a "hasta"')
      return
    }
    if (tripType === 'roundtrip' && returnFrom && returnTo && returnFrom > returnTo) {
      setError('El rango de vuelta es inválido')
      return
    }

    onSearch({
      origin,
      destination: destination.trim(),
      departureFrom,
      departureTo,
      returnFrom: tripType === 'roundtrip' ? returnFrom : undefined,
      returnTo: tripType === 'roundtrip' ? returnTo : undefined,
      passengers,
      tripType,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
      {/* Tipo de viaje */}
      <div className="flex gap-3">
        {(['roundtrip', 'oneway'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTripType(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tripType === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'roundtrip' ? 'Ida y vuelta' : 'Solo ida'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="inline w-4 h-4 mr-1 text-blue-500" />
            Salida desde
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {ORIGINS.map((o) => (
              <option key={o.iata} value={o.iata}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <ArrowLeftRight className="inline w-4 h-4 mr-1 text-blue-500" />
            Destino (código IATA o ciudad)
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Ej: Recife, Miami, BRC, MAD"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Fechas de ida */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline w-4 h-4 mr-1 text-blue-500" />
          Rango de fechas de salida
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-gray-500 mb-1 block">Desde</span>
            <input
              type="date"
              value={departureFrom}
              min={today}
              onChange={(e) => setDepartureFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <span className="text-xs text-gray-500 mb-1 block">Hasta</span>
            <input
              type="date"
              value={departureTo}
              min={departureFrom}
              onChange={(e) => setDepartureTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Fechas de vuelta */}
      {tripType === 'roundtrip' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1 text-green-500" />
            Rango de fechas de regreso
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500 mb-1 block">Desde</span>
              <input
                type="date"
                value={returnFrom}
                min={departureTo}
                onChange={(e) => setReturnFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 mb-1 block">Hasta</span>
              <input
                type="date"
                value={returnTo}
                min={returnFrom || departureTo}
                onChange={(e) => setReturnTo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pasajeros */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Users className="inline w-4 h-4 mr-1 text-blue-500" />
          Pasajeros
        </label>
        <select
          value={passengers}
          onChange={(e) => setPassengers(e.target.value as PassengerOption)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {PASSENGER_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Search className="w-5 h-5" />
        {loading ? 'Buscando...' : 'Buscar vuelos'}
      </button>
    </form>
  )
}
