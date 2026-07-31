import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import flightsRouter from './routes/flights.js'
import hotelsRouter from './routes/hotels.js'
import transfersRouter from './routes/transfers.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/api/flights', flightsRouter)
app.use('/api/hotels', hotelsRouter)
app.use('/api/transfers', transfersRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
