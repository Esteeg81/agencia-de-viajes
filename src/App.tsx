import { useState } from 'react'
import { Plane, Hotel, Car } from 'lucide-react'
import { SearchForm } from './components/SearchForm'
import { ResultsList } from './components/ResultsList'
import { HotelSearchForm } from './components/HotelSearchForm'
import { HotelResultsList } from './components/HotelResultsList'
import { TransferSearchForm } from './components/TransferSearchForm'
import { TransferResultsList } from './components/TransferResultsList'
import { searchFlights } from './lib/api'
import { searchHotels } from './lib/hotelsApi'
import { searchTransfers } from './lib/transfersApi'
import type {
  SearchParams, SearchResult,
  HotelSearchParams, HotelSearchResult,
  TransferSearchParams, TransferSearchResult,
  SearchMode,
} from './types/travel'

type TabConfig = { id: SearchMode; label: string; icon: React.ReactNode; color: string; activeColor: string }

const TABS: TabConfig[] = [
  { id: 'flights', label: 'Vuelos', icon: <Plane className="w-4 h-4" />, color: 'text-blue-600', activeColor: 'bg-blue-600 text-white' },
  { id: 'hotels', label: 'Hoteles', icon: <Hotel className="w-4 h-4" />, color: 'text-amber-600', activeColor: 'bg-amber-500 text-white' },
  { id: 'transfers', label: 'Traslados', icon: <Car className="w-4 h-4" />, color: 'text-purple-600', activeColor: 'bg-purple-600 text-white' },
]

export default function App() {
  const [mode, setMode] = useState<SearchMode>('flights')

  const [flightLoading, setFlightLoading] = useState(false)
  const [flightResult, setFlightResult] = useState<SearchResult | null>(null)
  const [flightError, setFlightError] = useState<string | null>(null)
  const [lastFlightSearch, setLastFlightSearch] = useState<SearchParams | null>(null)

  const [hotelLoading, setHotelLoading] = useState(false)
  const [hotelResult, setHotelResult] = useState<HotelSearchResult | null>(null)
  const [hotelError, setHotelError] = useState<string | null>(null)
  const [lastHotelSearch, setLastHotelSearch] = useState<HotelSearchParams | null>(null)

  const [transferLoading, setTransferLoading] = useState(false)
  const [transferResult, setTransferResult] = useState<TransferSearchResult | null>(null)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [lastTransferSearch, setLastTransferSearch] = useState<TransferSearchParams | null>(null)

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

  async function handleTransferSearch(params: TransferSearchParams) {
    setTransferLoading(true)
    setTransferError(null)
    setTransferResult(null)
    setLastTransferSearch(params)
    try {
      setTransferResult(await searchTransfers(params))
    } catch (e) {
      setTransferError(e instanceof Error ? e.message : 'Error al buscar traslados')
    } finally {
      setTransferLoading(false)
    }
  }

  const activeTab = TABS.find((t) => t.id === mode)!

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
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
                mode === tab.id ? tab.activeColor : `text-gray-500 hover:${tab.color} hover:bg-gray-50`
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hero — solo cuando no hay resultados */}
        {!flightResult && !hotelResult && !transferResult &&
         !flightLoading && !hotelLoading && !transferLoading && (
          <div className="text-center py-2">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {mode === 'flights' && '¿A dónde querés volar?'}
              {mode === 'hotels' && '¿Dónde vas a alojarte?'}
              {mode === 'transfers' && '¿Necesitás un traslado?'}
            </h2>
            <p className="text-gray-500">
              {mode === 'flights' && 'Buscá vuelos con fechas flexibles y comparamos los mejores precios'}
              {mode === 'hotels' && 'Encontrá hoteles disponibles ordenados por precio'}
              {mode === 'transfers' && 'Traslados desde el aeropuerto a tu hotel o destino'}
            </p>
          </div>
        )}

        {/* Formulario activo */}
        {mode === 'flights' && <SearchForm onSearch={handleFlightSearch} loading={flightLoading} />}
        {mode === 'hotels' && <HotelSearchForm onSearch={handleHotelSearch} loading={hotelLoading} />}
        {mode === 'transfers' && <TransferSearchForm onSearch={handleTransferSearch} loading={transferLoading} />}

        {/* Estados de carga */}
        {(flightLoading || hotelLoading || transferLoading) && (
          <div className="text-center py-12">
            <div className={`inline-block w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4 ${
              mode === 'flights' ? 'border-blue-600' : mode === 'hotels' ? 'border-amber-500' : 'border-purple-600'
            }`} />
            <p className="text-gray-600 font-medium">
              {mode === 'flights' && 'Buscando vuelos en el rango de fechas...'}
              {mode === 'hotels' && 'Buscando hoteles disponibles...'}
              {mode === 'transfers' && 'Buscando traslados disponibles...'}
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
        {mode === 'transfers' && transferError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600">
            <strong>Error:</strong> {transferError}
          </div>
        )}

        {/* Resultados vuelos */}
        {mode === 'flights' && flightResult && lastFlightSearch && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Vuelos: <span className="text-blue-600">{lastFlightSearch.origin} → {lastFlightSearch.destination}</span>
              </h3>
              <button onClick={() => setFlightResult(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">
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
                Hoteles en: <span className="text-amber-600">{lastHotelSearch.cityCode}</span>
              </h3>
              <button onClick={() => setHotelResult(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">
                Nueva búsqueda
              </button>
            </div>
            <HotelResultsList result={hotelResult} />
          </div>
        )}

        {/* Resultados traslados */}
        {mode === 'transfers' && transferResult && lastTransferSearch && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Traslados: <span className="text-purple-600">{lastTransferSearch.startLocationCode} → {lastTransferSearch.endCityName}</span>
              </h3>
              <button onClick={() => setTransferResult(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">
                Nueva búsqueda
              </button>
            </div>
            <TransferResultsList result={transferResult} />
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 mt-8">
        Datos en tiempo real via Amadeus API · Verificá disponibilidad antes de reservar
      </footer>
    </div>
  )
}
