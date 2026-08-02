import { Plane, Clock, ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import type { FlightOffer } from '../types/travel'

type Props = {
  offer: FlightOffer
  isCheapest?: boolean
  currency: string
}

function formatDuration(iso: string) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso
  const h = match[1] ? `${match[1]}h` : ''
  const m = match[2] ? `${match[2]}m` : ''
  return [h, m].filter(Boolean).join(' ')
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function FlightCard({ offer, isCheapest, currency }: Props) {
  const isLowCost = offer.airlineType === 'low-cost'

  return (
    <div
      className={`bg-white rounded-xl border-2 p-5 transition-shadow hover:shadow-md ${
        isCheapest ? 'border-green-400 shadow-green-100 shadow-md' : 'border-gray-100'
      }`}
    >
      {isCheapest && (
        <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mb-3">
          <CheckCircle className="w-4 h-4" />
          Mejor precio encontrado
        </div>
      )}

      {offer.itineraries.map((itin, idx) => (
        <div key={idx} className={idx > 0 ? 'mt-4 pt-4 border-t border-dashed border-gray-200' : ''}>
          {itin.segments.map((seg, sIdx) => (
            <div key={sIdx} className="flex items-center gap-3 mb-2">
              <div className="text-center min-w-[60px]">
                <div className="text-lg font-bold text-gray-800">{formatTime(seg.departure.at)}</div>
                <div className="text-xs text-gray-500 font-medium">{seg.departure.iataCode}</div>
                <div className="text-xs text-gray-400">{formatDate(seg.departure.at)}</div>
              </div>

              <div className="flex-1 flex flex-col items-center text-gray-400">
                <div className="text-xs mb-1">{formatDuration(seg.duration)}</div>
                <div className="flex items-center w-full gap-1">
                  <div className="flex-1 border-t border-dashed border-gray-300" />
                  <Plane className="w-4 h-4 text-blue-400 rotate-90" />
                  <div className="flex-1 border-t border-dashed border-gray-300" />
                </div>
                <div className="text-xs mt-1 text-blue-500 font-medium">
                  {seg.carrierCode} {seg.number}
                </div>
              </div>

              <div className="text-center min-w-[60px]">
                <div className="text-lg font-bold text-gray-800">{formatTime(seg.arrival.at)}</div>
                <div className="text-xs text-gray-500 font-medium">{seg.arrival.iataCode}</div>
                <div className="text-xs text-gray-400">{formatDate(seg.arrival.at)}</div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Duración total: {formatDuration(itin.duration)}</span>
            {offer.numberOfStops === 0 ? (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Directo</span>
            ) : (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                {offer.numberOfStops} escala{offer.numberOfStops > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      ))}

      {offer.returnDate && (
        <div className="mt-3 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vuelta:{' '}
          <strong>
            {new Date(offer.returnDate + 'T00:00:00Z').toLocaleDateString('es-AR', {
              weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
            })}
          </strong>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
        {/* Indicador aerolínea */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
            {offer.airlineName}
          </span>
          {isLowCost ? (
            <span
              title="Low cost: tarifas bajas pero cambios y cancelaciones pueden tener costo adicional"
              className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full font-medium cursor-help"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Low Cost
            </span>
          ) : (
            <span
              title="Aerolínea tradicional: mayor flexibilidad para cambios y cancelaciones"
              className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-medium cursor-help"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Tradicional
            </span>
          )}
        </div>

        {/* Precio */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {currency} {Number(offer.price.total).toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-gray-400">{offer.oneWay ? 'precio estimado' : 'total ida y vuelta'}</div>
          <div className="text-xs text-gray-500">
            {currency} {Number(offer.price.perAdult).toLocaleString('es-AR')} / adulto
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-2.5">
        <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        {isLowCost
          ? 'Aerolínea low cost: verificá política de cambios y equipaje antes de comprar.'
          : 'Aerolínea tradicional: generalmente más flexible para cambios de vuelo y cancelaciones.'}
      </div>
    </div>
  )
}
