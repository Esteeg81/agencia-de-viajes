import { Car, Users, Clock, MapPin, CheckCircle } from 'lucide-react'
import type { TransferOffer } from '../types/travel'

type Props = {
  offer: TransferOffer
  isCheapest?: boolean
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PRIVATE: { label: 'Privado', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SHARED: { label: 'Compartido', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  TAXI: { label: 'Taxi', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
}

function formatDuration(iso?: string) {
  if (!iso) return null
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso
  const h = match[1] ? `${match[1]}h` : ''
  const m = match[2] ? `${match[2]}m` : ''
  return [h, m].filter(Boolean).join(' ')
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function TransferCard({ offer, isCheapest }: Props) {
  const typeInfo = TYPE_LABELS[offer.transferType] ?? { label: offer.transferType, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  const duration = formatDuration(offer.duration)

  return (
    <div
      className={`bg-white rounded-xl border-2 p-5 transition-shadow hover:shadow-md ${
        isCheapest ? 'border-purple-400 shadow-purple-100 shadow-md' : 'border-gray-100'
      }`}
    >
      {isCheapest && (
        <div className="flex items-center gap-1 text-purple-600 text-xs font-semibold mb-3">
          <CheckCircle className="w-4 h-4" />
          Mejor precio encontrado
        </div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full font-medium">
              {offer.vehicle.description}
            </span>
            {offer.vehicle.seats && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                hasta {offer.vehicle.seats} pasajeros
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <Car className="w-4 h-4 text-purple-400 shrink-0" />
            {offer.serviceProvider.name}
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                <span className="font-medium">Desde:</span> Aeropuerto {offer.departure.locationCode}
                {' · '}
                <span className="text-gray-400">{formatDateTime(offer.departure.dateTime)}</span>
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>
                <span className="font-medium">Hasta:</span> {offer.arrival.name}, {offer.arrival.cityName}
              </span>
            </div>
          </div>

          {(duration || offer.distance) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {duration}
                </span>
              )}
              {offer.distance && (
                <span>{offer.distance.value} {offer.distance.unit.toLowerCase()}</span>
              )}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-gray-900">
            {offer.price.currency} {Number(offer.price.total).toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-gray-400">precio total</div>
        </div>
      </div>
    </div>
  )
}
