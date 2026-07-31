import { TrendingDown, BarChart2 } from 'lucide-react'
import type { SearchResult } from '../types/travel'
import { FlightCard } from './FlightCard'

type Props = {
  result: SearchResult
}

export function ResultsList({ result }: Props) {
  const { offers, cheapest, currency } = result

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No se encontraron vuelos</p>
        <p className="text-sm mt-1">Probá con otras fechas o destino</p>
      </div>
    )
  }

  const prices = offers.map((o) => Number(o.price.total))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

  return (
    <div className="space-y-6">
      {/* Comparativa de precios */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          Comparativa de precios ({offers.length} opciones encontradas)
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-xs text-green-600 font-medium mb-1">Más barato</div>
            <div className="text-xl font-bold text-green-700">
              {currency} {minPrice.toLocaleString('es-AR')}
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-xs text-blue-600 font-medium mb-1">Precio promedio</div>
            <div className="text-xl font-bold text-blue-700">
              {currency} {Math.round(avgPrice).toLocaleString('es-AR')}
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <div className="text-xs text-red-500 font-medium mb-1">Más caro</div>
            <div className="text-xl font-bold text-red-600">
              {currency} {maxPrice.toLocaleString('es-AR')}
            </div>
          </div>
        </div>

        {cheapest && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <TrendingDown className="w-4 h-4" />
            <span>
              El vuelo más económico es en{' '}
              <strong>{new Date(cheapest.itineraries[0].segments[0].departure.at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Lista de vuelos ordenados por precio */}
      <div className="space-y-4">
        {offers.map((offer) => (
          <FlightCard
            key={offer.id}
            offer={offer}
            isCheapest={cheapest?.id === offer.id}
            currency={currency}
          />
        ))}
      </div>
    </div>
  )
}
