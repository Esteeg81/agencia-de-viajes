import { Star, BedDouble, CheckCircle, ExternalLink, Plane } from 'lucide-react'
import type { HotelOffer } from '../types/travel'

type Props = {
  offer: HotelOffer & { imageUrl?: string; link?: string; overallRating?: number; reviewCount?: number }
  isCheapest?: boolean
  onLinkToFlights?: () => void
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function HotelCard({ offer, isCheapest, onLinkToFlights }: Props) {
  const stars = Number(offer.rating)

  return (
    <div
      className={`bg-white rounded-xl border-2 p-5 transition-shadow hover:shadow-md ${
        isCheapest ? 'border-amber-400 shadow-amber-100 shadow-md' : 'border-gray-100'
      }`}
    >
      {isCheapest && (
        <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold mb-3">
          <CheckCircle className="w-4 h-4" />
          Mejor precio encontrado
        </div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            {offer.imageUrl && (
              <img
                src={offer.imageUrl}
                alt={offer.hotelName}
                className="w-16 h-16 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-base leading-snug">{offer.hotelName}</h3>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {stars > 0 && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                      />
                    ))}
                  </div>
                )}
                {offer.overallRating && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    ★ {offer.overallRating.toFixed(1)}
                    {offer.reviewCount ? ` (${offer.reviewCount.toLocaleString('es-AR')} reseñas)` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              <BedDouble className="w-3 h-3" />
              {offer.nights} noche{offer.nights !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Check-in: <span className="font-medium">{formatDate(offer.checkInDate)}</span>
            {' · '}
            Check-out: <span className="font-medium">{formatDate(offer.checkOutDate)}</span>
          </div>

          {offer.description && (
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{offer.description}</p>
          )}

          {offer.amenities && offer.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {offer.amenities.map((a) => (
                <span key={a} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {a.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {offer.link && (
              <a
                href={offer.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
              >
                Ver en Google Hotels <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {onLinkToFlights && (
              <button
                onClick={onLinkToFlights}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition-colors"
              >
                <Plane className="w-3 h-3" />
                Buscar vuelos para estas fechas
              </button>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-gray-900">
            USD {Number(offer.price.total).toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-gray-400">precio total</div>
          <div className="text-sm text-amber-600 font-medium mt-1">
            USD {Number(offer.price.perNight).toLocaleString('es-AR')}
            <span className="text-xs text-gray-400 font-normal"> / noche</span>
          </div>
        </div>
      </div>
    </div>
  )
}
