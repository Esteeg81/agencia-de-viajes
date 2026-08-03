import cron from 'node-cron'
import { readTasks, writeTasks } from './taskStore.js'
import type { ServerTask, ServerHotelTask, ServerFlightTask } from './taskStore.js'
import { runHotelTask, runFlightTask } from './taskRunner.js'
import { sendWhatsAppMessage } from './whatsappSender.js'

// Default: 11:00 UTC = 08:00 ART. Override with CRON_SCHEDULE env var.
const SCHEDULE = process.env.CRON_SCHEDULE ?? '0 11 * * *'

function trend(history: { price: number }[] | undefined): string {
  if (!history || history.length < 2) return ''
  const prev = history[history.length - 2].price
  const curr = history[history.length - 1].price
  if (prev === 0) return ''
  const pct = Math.round(((curr - prev) / prev) * 100)
  if (pct === 0) return ' ='
  return pct < 0 ? ` ↓${Math.abs(pct)}%` : ` ↑${pct}%`
}

function money(price: string) {
  return `USD ${Number(price).toLocaleString('es-AR')}`
}

function buildCronMessage(tasks: ServerTask[], alerts: ServerTask[]): string {
  const date = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  const lines: string[] = [`*Informe diario ${date}*`, '']

  const hotels = tasks.filter(t => t.type === 'hotel' && t.lastResult) as ServerHotelTask[]
  const flights = tasks.filter(t => t.type === 'flight' && t.lastResult) as ServerFlightTask[]
  const alertIds = new Set(alerts.map(a => a.id))

  if (hotels.length) {
    lines.push('*Hoteles:*')
    for (const t of hotels) {
      const r = t.lastResult!
      const tr = trend(t.priceHistory)
      const flag = alertIds.has(t.id) ? '🎯 ' : ''
      if (r.hotelCount > 0) {
        const name = r.cheapestName ? ` · ${r.cheapestName.slice(0, 18)}` : ''
        lines.push(`${flag}${t.name}: ${money(r.cheapestPrice!)} (${r.hotelCount})${tr}${name}`)
      } else {
        lines.push(`${t.name}: sin resultados`)
      }
    }
    lines.push('')
  }

  if (flights.length) {
    lines.push('*Vuelos:*')
    for (const t of flights) {
      const r = t.lastResult!
      const tr = trend(t.priceHistory)
      const flag = alertIds.has(t.id) ? '🎯 ' : ''
      if (r.flightCount > 0) {
        const dateStr = r.cheapestDate ? ` · ${r.cheapestDate}` : ''
        lines.push(`${flag}${t.origin}>${t.destination} ${t.name}: ${money(r.cheapestPrice!)} (${r.flightCount})${tr}${dateStr}`)
      } else {
        lines.push(`${t.origin}>${t.destination} ${t.name}: sin resultados`)
      }
    }
    lines.push('')
  }

  if (alerts.length) {
    lines.push(`🎯 ${alerts.length} tarea${alerts.length > 1 ? 's' : ''} bajo precio objetivo!`)
    lines.push('')
  }

  lines.push('_Agencia de Viajes_')
  return lines.join('\n')
}

async function runAllTasks() {
  const tasks = readTasks()
  if (tasks.length === 0) {
    console.log('[cron] No tasks to run')
    return
  }

  console.log(`[cron] Running ${tasks.length} tasks...`)
  const updated: ServerTask[] = []
  const alerts: ServerTask[] = []

  for (const task of tasks) {
    try {
      const result = task.type === 'hotel'
        ? await runHotelTask(task as ServerHotelTask)
        : await runFlightTask(task as ServerFlightTask)

      updated.push(result)

      if (result.targetPrice && result.lastResult?.cheapestPrice) {
        const price = Number(result.lastResult.cheapestPrice)
        if (price > 0 && price <= result.targetPrice) alerts.push(result)
      }
    } catch (e) {
      console.error(`[cron] Task ${task.id} failed:`, e)
      updated.push(task)
    }
  }

  writeTasks(updated)

  const msg = buildCronMessage(updated, alerts)
  try {
    await sendWhatsAppMessage(msg)
    console.log('[cron] WS report sent')
  } catch (e) {
    console.error('[cron] WS send failed:', e)
  }
}

export function startCron() {
  if (!cron.validate(SCHEDULE)) {
    console.warn(`[cron] Invalid CRON_SCHEDULE "${SCHEDULE}", skipping`)
    return
  }
  cron.schedule(SCHEDULE, runAllTasks, { timezone: 'UTC' })
  console.log(`[cron] Daily report scheduled: ${SCHEDULE} UTC`)
}
