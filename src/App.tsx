import { useState } from 'react'
import { Plane, Hotel, Car, ClipboardList } from 'lucide-react'
import { SearchForm } from './components/SearchForm'
import { ResultsList } from './components/ResultsList'
import { HotelSearchForm } from './components/HotelSearchForm'
import { HotelResultsList } from './components/HotelResultsList'
import { TransferSearchForm } from './components/TransferSearchForm'
import { TasksPanel } from './components/TasksPanel'
import { searchFlights } from './lib/api'
import { searchHotels } from './lib/hotelsApi'
import type {
  SearchParams, SearchResult,
  HotelSearchParams, HotelSearchResult,
  SearchMode, FlightPreset, PassengerOption,
} from './types/travel'

type AppTab = SearchMode | 'tasks'
type TabConfig = { id: AppTab; label: string; icon: React.ReactNode; activeColor: string }

const TABS: TabConfig[] = [
  { id: 'flights',   label: 'Vuelos',    icon: <Plane className="w-4 h-4" />,         activeColor: 'bg-blue-600 text-white' },
  { id: 'hotels',    label: 'Hoteles',   icon: <Hotel className="w-4 h-4" />,         activeColor: 'bg-amber-500 text-white' },
  { id: 'transfers', label: 'Traslados', icon: <Car className="w-4 h-4" />,           activeColor: 'bg-purple-600 text-white' },
  { id: 'tasks',     label: 'Tareas',    icon: <ClipboardList className="w-4 h-4" />, activeColor: 'bg-indigo-600 text-white' },
]

export default function App() {
  const [mode, setMode] = useState<AppTab>('flights')

  const [flightLoading, setFlightLoading] = useState(false)
  const [flightResult, setFlightResult] = useState<SearchResult | null>(null)
  const [flightError, setFlightError] = useState<string | null>(null)
  const [lastFlightSearch, setLastFlightSearch] = useState<SearchParams | null>(null)
  const [flightPreset, setFlightPreset] = useState<FlightPreset | null>(null)

  const [hotelLoading, setHotelLoading] = useState(false)
  const [hotelResult, setHotelResult] = useState<HotelSearchResult | null>(null)
  const [hotelError, setHotelError] = useState<string | null>(null)
  const [lastHotelSearch, setLastHotelSearch] = useState<HotelSearchParams | null>(null)

  async function handleFlightSearch(params: SearchParams) {
    setFlightLoading(true)
    setFlightError(null)
    setFlightResult(null)
    setLastFlightSearch(params)
    try {
      setFlightResult(await searchFlights(params))
    } catch (e) {
      setFlightError(e instanceof Error ? e.message : 'Error al buscar vuelos')
    } finally {
      setFlightLoading(false)
    }
  }

  async function handleHotelSearch(params: HotelSearchParams) {
    setHotelLoading(true)
    setHotelError(null)
    setHotelResult(null)
    setLastHotelSearch(params)
    try {
      setHotelResult(await searchHotels(params))
    } catch (e) {
      setHotelError(e instanceof Error ? e.message : 'Error al buscar hoteles')
    } finally {
      setHotelLoading(false)
    }
  }

  function derivePassengers(adults: number, childrenCount: number): PassengerOption {
    if (childrenCount > 0) return '2_adults_2_children'
    if (adults <= 1) return '1_adult'
    return '2_adults'
  }

  function shiftDate(dateStr: string, days: number): string {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  function handleLinkToFlights(destination: string, checkIn: string, checkOut: string) {
    const origin = lastFlightSearch?.origin ?? 'EZE'
    const passengers: PassengerOption = lastHotelSearch
      ? derivePassengers(lastHotelSearch.adults, lastHotelSearch.children.length)
      : (lastFlightSearch?.passengers ?? '2_adults')

    const todayStr = new Date().toISOString().split('T')[0]
    const FLEX_DAYS = 5
    const depFrom = shiftDate(checkIn, -FLEX_DAYS) < todayStr ? todayStr : shiftDate(checkIn, -FLEX_DAYS)
    const depTo   = shiftDate(checkIn,  FLEX_DAYS)
    const retFrom = shiftDate(checkOut, -FLEX_DAYS)
    const retTo   = shiftDate(checkOut,  FLEX_DAYS)

    const preset: FlightPreset = {
      destination,
      origin,
      departureFrom: depFrom,
      departureTo:   depTo,
      returnFrom:    retFrom,
      returnTo:      retTo,
      passengers,
    }
    setFlightPreset(preset)
    setFlightResult(null)
    setFlightError(null)
    setMode('flights')
  }

  const showHero = !flightResult && !hotelResult && !flightLoading && !hotelLoading && mode !== 'tasks'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Agencia de Viajes</h1>
            <p className="text-xs text-gray-500">Vuelos · Hoteles · Traslados</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl shadow-sm p-2 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === tab.id ? tab.activeColor : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hero */}
        {showHero && mode !== 'transfers' && (
          <div className="text-center py-2">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {mode === 'flights' ? '¿A dónde querés volar?' : '¿Dónde vas a alojarte?'}
            </h2>
            <p className="text-gray-500">
              {mode === 'flights'
                ? 'Buscá vuelos con fechas flexibles y comparamos los mejores precios'
                : 'Encontrá hoteles disponibles en tu destino, ordenados por precio'}
            </p>
          </div>
        )}

        {/* Formularios */}
        {mode === 'flights' && (
          <SearchForm
            onSearch={handleFlightSearch}
            loading={flightLoading}
            preset={flightPreset}
          />
        )}
        {mode === 'hotels'    && <HotelSearchForm onSearch={handleHotelSearch} loading={hotelLoading} />}
        {mode === 'transfers' && <TransferSearchForm />}
        {mode === 'tasks'     && <TasksPanel />}

        {/* Carga */}
        {(flightLoading || hotelLoading) && (
          <div className="text-center py-12">
            <div className={`inline-block w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4 ${
              mode === 'flights' ? 'border-blue-600' : 'border-amber-500'
            }`} />
            <p className="text-gray-600 font-medium">
              {mode === 'flights' ? 'Buscando vuelos en el rango de fechas...' : 'Buscando hoteles disponibles...'}
            </p>
            <p className="text-gray-400 text-sm mt-1">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Errores */}
        {mode === 'flights' && flightError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600">
            <strong>Error:</strong> {flightError}
          </div>
        )}
        {mode === 'hotels' && hotelError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600">
            <strong>Error:</strong> {hotelError}
          </div>
        )}

        {/* Resultados vuelos */}
        {mode === 'flights' && flightResult && lastFlightSearch && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Vuelos: <span className="text-blue-600">{lastFlightSearch.origin} → {lastFlightSearch.destination}</span>
              </h3>
              <button
                onClick={() => { setFlightResult(null); setFlightPreset(null) }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Nueva búsqueda
              </button>
            </div>
            <ResultsList result={flightResult} />
          </div>
        )}

        {/* Resultados hoteles */}
        {mode === 'hotels' && hotelResult && lastHotelSearch && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Hoteles en: <span className="text-amber-600">{lastHotelSearch.destination}</span>
              </h3>
              <button onClick={() => setHotelResult(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">
                Nueva búsqueda
              </button>
            </div>
            <HotelResultsList
              result={hotelResult}
              destination={lastHotelSearch.destination}
              onLinkToFlights={handleLinkToFlights}
            />
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 mt-8">
        Datos en tiempo real via SerpAPI (Google Flights &amp; Google Hotels) · Verificá disponibilidad antes de reservar
      </footer>
    </div>
  )
}
