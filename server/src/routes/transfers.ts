import { Router } from 'express'
import { searchTransferOffers } from '../lib/amadeus.js'

const router = Router()

router.post('/search', async (req, res) => {
  const {
    startLocationCode,
    endName,
    endCityName,
    endCountryCode,
    startDateTime,
    passengers,
    transferType = 'PRIVATE',
  } = req.body as Record<string, string>

  if (!startLocationCode || !endName || !endCityName || !endCountryCode || !startDateTime || !passengers) {
    res.status(400).json({ message: 'Faltan parámetros requeridos' })
    return
  }

  try {
    const rawOffers = await searchTransferOffers({
      startLocationCode: startLocationCode.toUpperCase(),
      endAddressLine: endName,
      endCityName,
      endCountryCode: endCountryCode.toUpperCase(),
      endName,
      startDateTime,
      passengers: Number(passengers),
      transferType,
    })

    const offers = rawOffers.map((raw) => ({
      id: raw.id,
      transferType: raw.transferType,
      vehicle: {
        code: raw.vehicle.code,
        description: raw.vehicle.description,
        seats: raw.vehicle.seats?.[0]?.count,
      },
      serviceProvider: { name: raw.serviceProvider.name },
      departure: {
        locationCode: raw.start.locationCode,
        dateTime: raw.start.dateTime,
      },
      arrival: {
        name: raw.end.name ?? endName,
        cityName: raw.end.address?.cityName ?? endCityName,
      },
      price: {
        total: raw.quotation.monetaryAmount,
        currency: raw.quotation.currencyCode,
      },
      duration: raw.duration,
      distance: raw.distance,
    }))

    offers.sort((a, b) => Number(a.price.total) - Number(b.price.total))

    const currency = offers[0]?.price.currency ?? 'USD'
    res.json({ offers, cheapest: offers[0] ?? null, currency })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    res.status(500).json({ message })
  }
})

export default router
