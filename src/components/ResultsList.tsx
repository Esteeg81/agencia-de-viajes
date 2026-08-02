import { useState } from 'react'
import { TrendingDown, BarChart2, Zap, Building2, LayoutList } from 'lucide-react'
import type { SearchResult, AirlineType, FlightOffer } from '../types/travel'
import { FlightCard } from './FlightCard'

type AirlineFilter = 'all' | AirlineType

type Props = {
  result: SearchResult
}

const FILTER_OPTIONS: { value: AirlineFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'all',          label: 'Todas',          icon: <LayoutList className="w-3.5 h-3.5" />, color: 'bg-blue-600 text-white' },
  { value: 'low-cost',    label: 'Low Cost',       icon: <Zap className="w-3.5 h-3.5" />,        color: 'bg-orange-500 text-white' },
  { value: 'tradicional', label: 'Tradicionales',  icon: <Building2 className="w-3.5 h-3.5" />, color: 'bg-indigo-600 text-white' },
]

export function ResultsList({ result }: Props) {
  const { offers, cheapest, currency } = result
  const [filter, setFilter] = useState<AirlineFilter>('all')

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No se encontraron vuelos</p>
        <p className="text-sm mt-1">Probá con otras fechas o destino</p>
      </div>
    )
  }

  const isRoundTrip = !offers[0]?.oneWay

  const filtered = filter === 'all' ? offers : offers.filter((o: FlightOffer) => o.airlineType === filter)
  const prices = filtered.map((o: FlightOffer) => Number(o.price.total))
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  const cheapestFiltered = filtered[0] ?? null

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 font-semibold text-gray-700">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          {isRoundTrip ? 'Vuelos ida y vuelta' : 'Vuelos de ida'}
          <span className="text-xs font-normal text-gray-400 ml-1">({offers.length} opciones)</span>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTER_OPTIONS.map((opt) => {
            const count = opt.value === 'all' ? offers.length : offers.filter((o: FlightOffer) => o.airlineType === opt.value).length
            const active = filter === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  active ? `${opt.color} border-transparent shadow-sm` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {opt.icon}
                {opt.label}
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No hay vuelos {filter === 'low-cost' ? 'low cost' : 'de aerolíneas tradicionales'} en los resultados
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-xl p-3">
                <div className="text-xs text-green-600 font-medium mb-1">Más barato</div>
                <div className="text-xl font-bold text-green-700">{currency} {minPrice.toLocaleString('es-AR')}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Promedio</div>
                <div className="text-xl font-bold text-blue-700">{currency} {Math.round(avgPrice).toLocaleString('es-AR')}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <div className="text-xs text-red-500 font-medium mb-1">Más caro</div>
                <div className="text-xl font-bold text-red-600">{currency} {maxPrice.toLocaleString('es-AR')}</div>
              </div>
            </div>

            {cheapestFiltered && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                <TrendingDown className="w-4 h-4" />
                <span>
                  El más económico sale el{' '}
                  <strong>
                    {new Date(cheapestFiltered.itineraries[0].segments[0].departure.at).toLocaleDateString('es-AR', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </strong>
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-4">
        {filtered.map((offer: FlightOffer) => (
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
