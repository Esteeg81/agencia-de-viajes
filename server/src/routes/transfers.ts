import { Router } from 'express'

const router = Router()

// SerpAPI no provee búsqueda de traslados aeropuerto-hotel.
// Esta ruta queda reservada para integración futura con GetTransfer, Kiwitaxi u otro proveedor.
router.post('/search', (_req, res) => {
  res.status(503).json({
    message: 'Búsqueda de traslados próximamente disponible. Estamos integrando un proveedor de transfers.',
    comingSoon: true,
  })
})

export default router
