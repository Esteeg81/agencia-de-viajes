import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import flightsRouter from './routes/flights.js'
import hotelsRouter from './routes/hotels.js'
import transfersRouter from './routes/transfers.js'
import whatsappRouter from './routes/whatsapp.js'

const app = express()
const PORT = process.env.PORT ?? 3001
const isProd = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

app.use('/api/flights', flightsRouter)
app.use('/api/hotels', hotelsRouter)
app.use('/api/transfers', transfersRouter)
app.use('/api/whatsapp', whatsappRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// En producción servimos el frontend compilado
if (isProd) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const distPath = path.join(__dirname, '../../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
