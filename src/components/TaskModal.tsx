import { useState } from 'react'
import { X, Plane, Hotel } from 'lucide-react'
import { ORIGINS, PASSENGER_OPTIONS } from '../types/travel'
import type { PassengerOption } from '../types/travel'
import type { ScheduledTask, HotelTask, FlightTask } from '../types/tasks'
import { filterCities } from '../data/cities'

type Props = {
  onSave: (task: ScheduledTask) => void
  onClose: () => void
  editing?: ScheduledTask
}

function genId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = new Date().toISOString().split('T')[0]
const NIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21]

export function TaskModal({ onSave, onClose, editing }: Props) {
  const [taskType, setTaskType] = useState<'hotel' | 'flight'>(editing?.type ?? 'hotel')

  // Hotel state
  const [hotelName, setHotelName] = useState(editing?.type === 'hotel' ? editing.name : '')
  const [hotelDest, setHotelDest] = useState(editing?.type === 'hotel' ? editing.destination : '')
  const [hotelSugg, setHotelSugg] = useState<{ name: string; country: string }[]>([])
  const [showHotelSugg, setShowHotelSugg] = useState(false)
  const [checkIn, setCheckIn] = useState(editing?.type === 'hotel' ? editing.checkInDate : addDays(today, 1))
  const [nights, setNights] = useState(editing?.type === 'hotel' ? editing.nights : 7)
  const [adults, setAdults] = useState(editing?.type === 'hotel' ? editing.adults : 2)
  const [allInclusive, setAllInclusive] = useState(editing?.type === 'hotel' ? editing.allInclusive : false)

  // Flight state
  const [flightName, setFlightName] = useState(editing?.type === 'flight' ? editing.name : '')
  const [flightOrigin, setFlightOrigin] = useState(editing?.type === 'flight' ? editing.origin : 'EZE')
  const [flightDest, setFlightDest] = useState(editing?.type === 'flight' ? editing.destination : '')
  const [flightSugg, setFlightSugg] = useState<{ name: string; country: string }[]>([])
  const [showFlightSugg, setShowFlightSugg] = useState(false)
  const [depFrom, setDepFrom] = useState(editing?.type === 'flight' ? editing.departureFrom : today)
  const [depTo, setDepTo] = useState(editing?.type === 'flight' ? editing.departureTo : addDays(today, 7))
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>(
    editing?.type === 'flight' ? editing.tripType : 'roundtrip'
  )
  const [retFrom, setRetFrom] = useState(editing?.type === 'flight' ? (editing.returnFrom ?? '') : addDays(today, 10))
  const [retTo, setRetTo] = useState(editing?.type === 'flight' ? (editing.returnTo ?? '') : addDays(today, 17))
  const [passengers, setPassengers] = useState<PassengerOption>(
    editing?.type === 'flight' ? editing.passengers : '2_adults'
  )

  const [error, setError] = useState('')

  const checkOut = addDays(checkIn, nights)

  function handleSave() {
    setError('')
    if (taskType === 'hotel') {
      if (!hotelName.trim() || !hotelDest.trim()) {
        setError('Nombre y destino son obligatorios')
        return
      }
      const task: HotelTask = {
        id: editing?.id ?? genId(),
        type: 'hotel',
        name: hotelName.trim(),
        destination: hotelDest.trim(),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights,
        adults,
        allInclusive,
        lastRun: editing?.lastRun,
        lastResult: editing?.type === 'hotel' ? editing.lastResult : undefined,
      }
      onSave(task)
    } else {
      if (!flightName.trim() || !flightDest.trim()) {
        setError('Nombre y destino son obligatorios')
        return
      }
      const task: FlightTask = {
        id: editing?.id ?? genId(),
        type: 'flight',
        name: flightName.trim(),
        origin: flightOrigin,
        destination: flightDest.trim(),
        departureFrom: depFrom,
        departureTo: depTo,
        returnFrom: tripType === 'roundtrip' ? retFrom : undefined,
        returnTo: tripType === 'roundtrip' ? retTo : undefined,
        passengers,
        tripType,
        lastRun: editing?.lastRun,
        lastResult: editing?.type === 'flight' ? editing.lastResult : undefined,
      }
      onSave(task)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-800">{editing ? 'Editar tarea' : 'Nueva tarea programada'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tipo (solo en creación) */}
          {!editing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTaskType('hotel')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  taskType === 'hotel' ? 'bg-amber-500 text-white border-transparent' : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                <Hotel className="w-4 h-4" /> Hotel
              </button>
              <button
                type="button"
                onClick={() => setTaskType('flight')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  taskType === 'flight' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                <Plane className="w-4 h-4" /> Vuelo
              </button>
            </div>
          )}

          {/* ── HOTEL FORM ── */}
          {taskType === 'hotel' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tarea</label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={e => setHotelName(e.target.value)}
                  placeholder="Ej: Vacaciones Brasil verano"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                <input
                  type="text"
                  value={hotelDest}
                  onChange={e => {
                    setHotelDest(e.target.value)
                    setHotelSugg(filterCities(e.target.value))
                    setShowHotelSugg(e.target.value.length >= 2)
                  }}
                  onFocus={() => hotelDest.length >= 2 && setShowHotelSugg(true)}
                  autoComplete="off"
                  placeholder="Ej: Río de Janeiro, Cancún..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {showHotelSugg && hotelSugg.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {hotelSugg.map(c => (
                      <button
                        key={`${c.name}-${c.country}`}
                        type="button"
                        onMouseDown={() => { setHotelDest(c.name); setShowHotelSugg(false) }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-amber-50"
                      >
                        <span className="font-medium text-gray-800">{c.name}</span>
                        <span className="text-xs text-gray-400">{c.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={e => setCheckIn(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Noches</label>
                  <select
                    value={nights}
                    onChange={e => setNights(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {NIGHT_OPTIONS.map(n => <option key={n} value={n}>{n} noche{n > 1 ? 's' : ''}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Check-out: {checkOut}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adultos</label>
                  <select
                    value={adults}
                    onChange={e => setAdults(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} adulto{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allInclusive}
                      onChange={e => setAllInclusive(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span className="text-sm text-gray-700">All Inclusive</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ── FLIGHT FORM ── */}
          {taskType === 'flight' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tarea</label>
                <input
                  type="text"
                  value={flightName}
                  onChange={e => setFlightName(e.target.value)}
                  placeholder="Ej: Vuelo a Cancún octubre"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex gap-2">
                {(['roundtrip', 'oneway'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      tripType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'roundtrip' ? 'Ida y vuelta' : 'Solo ida'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                  <select
                    value={flightOrigin}
                    onChange={e => setFlightOrigin(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {ORIGINS.map(o => <option key={o.iata} value={o.iata}>{o.label}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                  <input
                    type="text"
                    value={flightDest}
                    onChange={e => {
                      setFlightDest(e.target.value)
                      setFlightSugg(filterCities(e.target.value))
                      setShowFlightSugg(e.target.value.length >= 2)
                    }}
                    onFocus={() => flightDest.length >= 2 && setShowFlightSugg(true)}
                    autoComplete="off"
                    placeholder="Ciudad o IATA"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {showFlightSugg && flightSugg.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {flightSugg.map(c => (
                        <button
                          key={`${c.name}-${c.country}`}
                          type="button"
                          onMouseDown={() => { setFlightDest(c.name); setShowFlightSugg(false) }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50"
                        >
                          <span className="font-medium text-gray-800">{c.name}</span>
                          <span className="text-xs text-gray-400">{c.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rango fechas de ida</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date" value={depFrom} min={today}
                    onChange={e => setDepFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="date" value={depTo} min={depFrom}
                    onChange={e => setDepTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {tripType === 'roundtrip' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rango fechas de vuelta</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date" value={retFrom} min={depTo}
                      onChange={e => setRetFrom(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      type="date" value={retTo} min={retFrom}
                      onChange={e => setRetTo(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pasajeros</label>
                <select
                  value={passengers}
                  onChange={e => setPassengers(e.target.value as PassengerOption)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {PASSENGER_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleSave}
            className={`w-full text-white font-semibold py-3 rounded-xl transition-colors ${
              taskType === 'hotel' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editing ? 'Guardar cambios' : 'Agregar tarea'}
          </button>
        </div>
      </div>
    </div>
  )
}
