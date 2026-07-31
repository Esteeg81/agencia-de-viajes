import { useState } from 'react'
import { Search, MapPin, Calendar, Users, Car } from 'lucide-react'
import { ORIGINS, COUNTRY_CODES } from '../types/travel'
import type { TransferSearchParams, TransferType } from '../types/travel'

type Props = {
  onSearch: (params: TransferSearchParams) => void
  loading: boolean
}

const now = new Date()
now.setHours(now.getHours() + 2, 0, 0, 0)
const defaultDateTime = now.toISOString().slice(0, 16)

const TRANSFER_TYPES: { value: TransferType; label: string; desc: string }[] = [
  { value: 'PRIVATE', label: 'Privado', desc: 'Vehículo exclusivo para tu grupo' },
  { value: 'SHARED', label: 'Compartido', desc: 'Compartís el traslado y el costo' },
  { value: 'TAXI', label: 'Taxi', desc: 'Taxi disponible en el aeropuerto' },
]

export function TransferSearchForm({ onSearch, loading }: Props) {
  const [startLocationCode, setStartLocationCode] = useState(ORIGINS[2].iata)
  const [endName, setEndName] = useState('')
  const [endCityName, setEndCityName] = useState('')
  const [endCountryCode, setEndCountryCode] = useState('AR')
  const [startDateTime, setStartDateTime] = useState(defaultDateTime)
  const [passengers, setPassengers] = useState(1)
  const [transferType, setTransferType] = useState<TransferType>('PRIVATE')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!endName.trim()) {
      setError('Ingresá el nombre del hotel o destino')
      return
    }
    if (!endCityName.trim()) {
      setError('Ingresá la ciudad de destino')
      return
    }
    if (!startDateTime) {
      setError('Seleccioná fecha y hora de partida')
      return
    }

    onSearch({
      startLocationCode,
      endName: endName.trim(),
      endCityName: endCityName.trim(),
      endCountryCode,
      startDateTime: new Date(startDateTime).toISOString().replace('.000Z', ''),
      passengers,
      transferType,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aeropuerto de salida */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="inline w-4 h-4 mr-1 text-purple-500" />
            Aeropuerto de partida
          </label>
          <select
            value={startLocationCode}
            onChange={(e) => setStartLocationCode(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {ORIGINS.map((o) => (
              <option key={o.iata} value={o.iata}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Fecha y hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline w-4 h-4 mr-1 text-purple-500" />
            Fecha y hora de llegada al aeropuerto
          </label>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Destino */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="inline w-4 h-4 mr-1 text-green-500" />
            Hotel / Nombre del destino
          </label>
          <input
            type="text"
            value={endName}
            onChange={(e) => setEndName(e.target.value)}
            placeholder="Ej: Hotel Sheraton, Eiffel Tower, Casa particular"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
          <input
            type="text"
            value={endCityName}
            onChange={(e) => setEndCityName(e.target.value)}
            placeholder="Ej: Buenos Aires"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* País */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">País de destino</label>
          <select
            value={endCountryCode}
            onChange={(e) => setEndCountryCode(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Pasajeros */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Users className="inline w-4 h-4 mr-1 text-purple-500" />
            Pasajeros
          </label>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} pasajero{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tipo de traslado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Car className="inline w-4 h-4 mr-1 text-purple-500" />
          Tipo de traslado
        </label>
        <div className="grid grid-cols-3 gap-3">
          {TRANSFER_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTransferType(t.value)}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                transferType === t.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="text-sm font-semibold text-gray-800">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Search className="w-5 h-5" />
        {loading ? 'Buscando traslados...' : 'Buscar traslados'}
      </button>
    </form>
  )
}
