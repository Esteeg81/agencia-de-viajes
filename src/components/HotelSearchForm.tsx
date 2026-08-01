import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, Calendar, Users, BedDouble, Moon, Star, Plus, X } from 'lucide-react'
import type { HotelSearchParams } from '../types/travel'
import { filterCities } from '../data/cities'

type Props = {
  onSearch: (params: HotelSearchParams) => void
  loading: boolean
}

const NIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21]
const CHILD_AGES = Array.from({ length: 18 }, (_, i) => i)

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = new Date().toISOString().split('T')[0]
const tomorrow = addDays(today, 1)

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative shrink-0"
      aria-pressed={checked}
    >
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-gray-200'}`} />
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

export function HotelSearchForm({ onSearch, loading }: Props) {
  const [destination, setDestination] = useState('')
  const [suggestions, setSuggestions] = useState<{ name: string; country: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [checkInDate, setCheckInDate] = useState(tomorrow)
  const [nights, setNights] = useState(7)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState<number[]>([])
  const [rooms, setRooms] = useState(1)
  const [allInclusive, setAllInclusive] = useState(false)
  const [error, setError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const checkOutDate = addDays(checkInDate, nights)

  useEffect(() => {
    setSuggestions(filterCities(destination))
    setShowSuggestions(destination.length >= 2)
  }, [destination])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectCity(name: string) {
    setDestination(name)
    setShowSuggestions(false)
  }

  function addChild() {
    if (children.length < 4) setChildren([...children, 5])
  }

  function removeChild(idx: number) {
    setChildren(children.filter((_, i) => i !== idx))
  }

  function setChildAge(idx: number, age: number) {
    setChildren(children.map((a, i) => (i === idx ? age : a)))
  }

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
      children,
      rooms,
      allInclusive,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-5">

      {/* Destino con autocomplete */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <MapPin className="inline w-4 h-4 mr-1 text-amber-500" />
          Ciudad o destino
        </label>
        <input
          ref={inputRef}
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onFocus={() => destination.length >= 2 && setShowSuggestions(true)}
          placeholder="Ej: Bariloche, Cancún, Miami, París..."
          autoComplete="off"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            {suggestions.map((c) => (
              <button
                key={`${c.name}-${c.country}`}
                type="button"
                onMouseDown={() => selectCity(c.name)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-amber-50 transition-colors"
              >
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-400 ml-2 shrink-0">{c.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Adultos + Habitaciones */}
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

      {/* Niños */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Users className="w-4 h-4 text-amber-500" />
            Niños ({children.length})
          </label>
          {children.length < 4 && (
            <button
              type="button"
              onClick={addChild}
              className="flex items-center gap-1 text-xs font-semibold text-amber-600 border border-amber-300 hover:bg-amber-50 px-2.5 py-1 rounded-full transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar niño
            </button>
          )}
        </div>

        {children.length === 0 && (
          <p className="text-xs text-gray-400">Sin niños — tocá "Agregar niño" para incluirlos</p>
        )}

        {children.length > 0 && (
          <div className="space-y-2">
            {children.map((age, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <span className="text-xs text-amber-700 font-medium w-16 shrink-0">
                  Niño {idx + 1}
                </span>
                <select
                  value={age}
                  onChange={(e) => setChildAge(idx, Number(e.target.value))}
                  className="flex-1 border border-amber-200 bg-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {CHILD_AGES.map((a) => (
                    <option key={a} value={a}>
                      {a === 0 ? 'Menos de 1 año' : `${a} año${a !== 1 ? 's' : ''}`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeChild(idx)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Quitar niño"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-in + Noches */}
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
        <Toggle checked={allInclusive} onChange={setAllInclusive} />
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
