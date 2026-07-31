import { BarChart2, TrendingDown } from 'lucide-react'
import type { TransferSearchResult } from '../types/travel'
import { TransferCard } from './TransferCard'

type Props = {
  result: TransferSearchResult
}

export function TransferResultsList({ result }: Props) {
  const { offers, cheapest, currency } = result

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No se encontraron traslados disponibles</p>
        <p className="text-sm mt-1">Probá con otro destino o tipo de traslado</p>
      </div>
    )
  }

  const prices = offers.map((o) => Number(o.price.total))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
          <BarChart2 className="w-5 h-5 text-purple-500" />
          Comparativa de precios ({offers.length} traslados encontrados)
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-xs text-green-600 font-medium mb-1">Más económico</div>
            <div className="text-xl font-bold text-green-700">
              {currency} {minPrice.toLocaleString('es-AR')}
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <div className="text-xs text-purple-600 font-medium mb-1">Precio promedio</div>
            <div className="text-xl font-bold text-purple-700">
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
          <div className="mt-3 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
            <TrendingDown className="w-4 h-4" />
            <span>
              Mejor opción: <strong>{cheapest.serviceProvider.name}</strong> — {cheapest.vehicle.description}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {offers.map((offer) => (
          <TransferCard
            key={offer.id}
            offer={offer}
            isCheapest={cheapest?.id === offer.id}
          />
        ))}
      </div>
    </div>
  )
}
