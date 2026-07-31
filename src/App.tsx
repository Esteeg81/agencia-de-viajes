import { useState } from 'react'
import { Plane } from 'lucide-react'
import { SearchForm } from './components/SearchForm'
import { ResultsList } from './components/ResultsList'
import { searchFlights } from './lib/api'
import type { SearchParams, SearchResult } from './types/travel'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null)

  async function handleSearch(params: SearchParams) {
    setLoading(true)
    setError(null)
    setResult(null)
    setLastSearch(params)

    try {
      const data = await searchFlights(params)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar vuelos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Agencia de Viajes</h1>
            <p className="text-xs text-gray-500">Comparador de vuelos y ofertas</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        {!result && !loading && (
          <div className="text-center py-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              ¿A dónde querés viajar?
            </h2>
            <p className="text-gray-500">
              Buscá vuelos con fechas flexibles y comparamos los mejores precios
            </p>
          </div>
        )}

        {/* Formulario */}
        <SearchForm onSearch={handleSearch} loading={loading} />

        {/* Estado de carga */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Buscando vuelos en el rango de fechas...</p>
            <p className="text-gray-400 text-sm mt-1">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Resultados */}
        {result && lastSearch && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Resultados:{' '}
                <span className="text-blue-600">
                  {lastSearch.origin} → {lastSearch.destination}
                </span>
              </h3>
              <button
                onClick={() => setResult(null)}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Nueva búsqueda
              </button>
            </div>
            <ResultsList result={result} />
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 mt-8">
        Precios obtenidos via Amadeus API · Verificá disponibilidad antes de comprar
      </footer>
    </div>
  )
}
