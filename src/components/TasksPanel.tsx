import { useState } from 'react'
import {
  Plus, Play, MessageCircle, Trash2, Edit3, Hotel, Plane,
  CheckCircle, AlertCircle, Loader2, RefreshCw, TrendingDown, TrendingUp,
} from 'lucide-react'
import type { ScheduledTask, HotelTask, FlightTask, PriceEntry } from '../types/tasks'
import { getTasks, saveTasks } from '../lib/tasksStore'
import { searchHotels } from '../lib/hotelsApi'
import { searchFlights } from '../lib/api'
import { TaskModal } from './TaskModal'

type RunState = { status: 'idle' | 'running' | 'done' | 'error'; error?: string }

function money(amount: string, currency: string) {
  return `${currency} ${Number(amount).toLocaleString('es-AR')}`
}

function getTrend(history: PriceEntry[] | undefined): { pct: number; diff: number } | null {
  if (!history || history.length < 2) return null
  const prev = history[history.length - 2].price
  const curr = history[history.length - 1].price
  if (prev === 0) return null
  const pct = Math.round(((curr - prev) / prev) * 100)
  return { pct, diff: curr - prev }
}

function appendHistory(existing: PriceEntry[] | undefined, price: number, count: number): PriceEntry[] {
  const entry: PriceEntry = { date: new Date().toISOString(), price, count }
  return [...(existing ?? []), entry].slice(-10)
}

function buildWsMessage(tasks: ScheduledTask[]): string {
  const date = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  const lines: string[] = [`*Informe viajes ${date}*`, '']

  const withResults = tasks.filter(t => t.lastResult)
  const hotels = withResults.filter(t => t.type === 'hotel') as HotelTask[]
  const flights = withResults.filter(t => t.type === 'flight') as FlightTask[]

  if (hotels.length) {
    lines.push('*Hoteles:*')
    for (const t of hotels) {
      const r = t.lastResult!
      const tr = getTrend(t.priceHistory)
      const trStr = tr ? (tr.pct < 0 ? ` ↓${Math.abs(tr.pct)}%` : tr.pct > 0 ? ` ↑${tr.pct}%` : '') : ''
      const flag = t.targetPrice && r.cheapestPrice && Number(r.cheapestPrice) <= t.targetPrice ? '🎯 ' : ''
      if (r.hotelCount > 0) {
        const name = r.cheapestName ? ` · ${r.cheapestName.slice(0, 18)}` : ''
        lines.push(`${flag}${t.name}: ${money(r.cheapestPrice!, r.currency!)} (${r.hotelCount})${trStr}${name}`)
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
      const tr = getTrend(t.priceHistory)
      const trStr = tr ? (tr.pct < 0 ? ` ↓${Math.abs(tr.pct)}%` : tr.pct > 0 ? ` ↑${tr.pct}%` : '') : ''
      const flag = t.targetPrice && r.cheapestPrice && Number(r.cheapestPrice) <= t.targetPrice ? '🎯 ' : ''
      if (r.flightCount > 0) {
        const dateStr = r.cheapestDate ? ` · ${r.cheapestDate}` : ''
        lines.push(`${flag}${t.origin}>${t.destination} ${t.name}: ${money(r.cheapestPrice!, r.currency!)} (${r.flightCount})${trStr}${dateStr}`)
      } else {
        lines.push(`${t.origin}>${t.destination} ${t.name}: sin resultados`)
      }
    }
    lines.push('')
  }

  lines.push('_Agencia de Viajes_')
  return lines.join('\n')
}

function buildAlertMessage(task: ScheduledTask): string {
  const price = task.lastResult?.cheapestPrice
  const target = task.targetPrice
  if (task.type === 'hotel') {
    return `🎯 *Alerta de precio!*\n${task.name} (${task.destination})\nPrecio: USD ${price} — bajo tu objetivo de USD ${target}\n_Agencia de Viajes_`
  }
  return `🎯 *Alerta de precio!*\n${task.name} (${task.origin} → ${task.destination})\nPrecio: USD ${price} — bajo tu objetivo de USD ${target}\n_Agencia de Viajes_`
}

export function TasksPanel() {
  const [tasks, setTasks] = useState<ScheduledTask[]>(() => getTasks())
  const [runState, setRunState] = useState<Record<string, RunState>>({})
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<ScheduledTask | undefined>()
  const [runningAll, setRunningAll] = useState(false)
  const [wsSending, setWsSending] = useState(false)
  const [wsFeedback, setWsFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  function sync(updated: ScheduledTask[]) {
    setTasks(updated)
    saveTasks(updated)
  }

  function setRun(id: string, state: RunState) {
    setRunState(prev => ({ ...prev, [id]: state }))
  }

  async function sendWs(message: string) {
    setWsSending(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json().catch(() => ({})) as { message?: string }
      if (!res.ok) throw new Error(data.message ?? 'Error al enviar')
      setWsFeedback({ ok: true, msg: 'Enviado a WhatsApp.' })
      setTimeout(() => setWsFeedback(null), 6000)
    } catch (e) {
      setWsFeedback({ ok: false, msg: e instanceof Error ? e.message : 'Error al enviar' })
    } finally {
      setWsSending(false)
    }
  }

  async function runOne(task: ScheduledTask): Promise<ScheduledTask> {
    setRun(task.id, { status: 'running' })
    try {
      let updated: ScheduledTask

      if (task.type === 'hotel') {
        const result = await searchHotels({
          destination: task.destination,
          checkInDate: task.checkInDate,
          checkOutDate: task.checkOutDate,
          nights: task.nights,
          adults: task.adults,
          children: task.children ?? [],
          rooms: 1,
          allInclusive: task.allInclusive,
        })
        const currentPrice = result.cheapest ? Number(result.cheapest.price.total) : 0
        updated = {
          ...task,
          lastRun: new Date().toISOString(),
          lastResult: {
            hotelCount: result.offers.length,
            cheapestPrice: result.cheapest?.price.total,
            currency: result.currency,
            cheapestName: result.cheapest?.hotelName,
          },
          priceHistory: appendHistory(task.priceHistory, currentPrice, result.offers.length),
        } as HotelTask
      } else {
        const result = await searchFlights({
          origin: task.origin,
          destination: task.destination,
          departureFrom: task.departureFrom,
          departureTo: task.departureTo,
          returnFrom: task.returnFrom,
          returnTo: task.returnTo,
          passengers: task.passengers,
          tripType: task.tripType,
        })
        const seg = result.cheapest?.itineraries[0]?.segments[0]?.departure.at
        const cheapestDate = seg
          ? new Date(seg).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
          : undefined
        const currentPrice = result.cheapest ? Number(result.cheapest.price.total) : 0
        updated = {
          ...task,
          lastRun: new Date().toISOString(),
          lastResult: {
            flightCount: result.offers.length,
            cheapestPrice: result.cheapest?.price.total,
            currency: result.currency,
            cheapestDate,
          },
          priceHistory: appendHistory(task.priceHistory, currentPrice, result.offers.length),
        } as FlightTask
      }

      setRun(task.id, { status: 'done' })

      // Auto-alert if price crossed target
      if (
        updated.targetPrice &&
        updated.lastResult?.cheapestPrice &&
        Number(updated.lastResult.cheapestPrice) > 0 &&
        Number(updated.lastResult.cheapestPrice) <= updated.targetPrice
      ) {
        sendWs(buildAlertMessage(updated))
      }

      return updated
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Error desconocido'
      setRun(task.id, { status: 'error', error })
      return task
    }
  }

  async function runTaskAndSync(task: ScheduledTask) {
    const updated = await runOne(task)
    setTasks(prev => {
      const next = prev.map(t => t.id === updated.id ? updated : t)
      saveTasks(next)
      return next
    })
  }

  async function runAll() {
    setRunningAll(true)
    for (const task of tasks) {
      const updated = await runOne(task)
      setTasks(prev => {
        const next = prev.map(t => t.id === updated.id ? updated : t)
        saveTasks(next)
        return next
      })
    }
    setRunningAll(false)
  }

  function handleSave(task: ScheduledTask) {
    if (editingTask) {
      sync(tasks.map(t => t.id === task.id ? task : t))
    } else {
      sync([...tasks, task])
    }
    setShowModal(false)
    setEditingTask(undefined)
  }

  const tasksWithResults = tasks.filter(t => t.lastResult)

  return (
    <div className="space-y-5">
      {/* Barra de acciones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Tareas programadas</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} · informe diario automático a las 08:00 ART
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setEditingTask(undefined); setShowModal(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva tarea
            </button>
            {tasks.length > 0 && (
              <button
                onClick={runAll}
                disabled={runningAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {runningAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Ejecutar todas
              </button>
            )}
            {tasksWithResults.length > 0 && (
              <button
                onClick={() => sendWs(buildWsMessage(tasks))}
                disabled={wsSending}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {wsSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Enviar informe WS
              </button>
            )}
          </div>
        </div>

        {wsFeedback && (
          <div className={`mt-3 flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
            wsFeedback.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {wsFeedback.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {wsFeedback.msg}
          </div>
        )}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-medium text-gray-500">No hay tareas programadas</p>
          <p className="text-sm mt-1">Creá una para monitorear precios de hoteles o vuelos</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Crear primera tarea
          </button>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map(task => {
          const st = runState[task.id]
          const isRunning = st?.status === 'running'
          const isError = st?.status === 'error'
          const isHotel = task.type === 'hotel'
          const tr = getTrend(task.priceHistory)
          const currentPrice = task.lastResult?.cheapestPrice ? Number(task.lastResult.cheapestPrice) : null
          const hitTarget = !!(task.targetPrice && currentPrice && currentPrice <= task.targetPrice)
          const borderColor = hitTarget
            ? 'border-green-400'
            : task.lastResult
            ? (isHotel ? 'border-amber-300' : 'border-blue-300')
            : 'border-gray-100'
          const accentBg   = isHotel ? 'bg-amber-50' : 'bg-blue-50'
          const accentText = isHotel ? 'text-amber-700' : 'text-blue-700'
          const accentIcon = isHotel ? 'text-amber-600' : 'text-blue-600'

          return (
            <div key={task.id} className={`bg-white rounded-xl border-2 ${borderColor} p-4 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg ${accentBg} shrink-0`}>
                    {isHotel
                      ? <Hotel className={`w-4 h-4 ${accentIcon}`} />
                      : <Plane className={`w-4 h-4 ${accentIcon}`} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm truncate">{task.name}</p>
                      {hitTarget && (
                        <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-semibold shrink-0">
                          🎯 Bajo objetivo
                        </span>
                      )}
                      {task.targetPrice && !hitTarget && (
                        <span className="text-xs text-gray-400 shrink-0">objetivo: USD {task.targetPrice.toLocaleString('es-AR')}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {task.type === 'hotel'
                        ? `${task.destination} · ${task.checkInDate} · ${task.nights}n · ${task.adults} adulto${task.adults > 1 ? 's' : ''}${task.allInclusive ? ' · AI' : ''}`
                        : `${task.origin} → ${task.destination} · ${task.departureFrom}${task.tripType === 'roundtrip' && task.returnFrom ? ` · vuelta ${task.returnFrom}` : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => runTaskAndSync(task)} disabled={isRunning} title="Ejecutar ahora"
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40">
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setEditingTask(task); setShowModal(true) }} title="Editar"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => sync(tasks.filter(t => t.id !== task.id))} title="Eliminar"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isError && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {st.error}
                </div>
              )}

              {task.lastResult && (
                <div className={`mt-3 rounded-lg px-3 py-2.5 ${accentBg}`}>
                  <div className={`text-xs ${accentText} flex items-start justify-between gap-2`}>
                    <div className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        {task.type === 'hotel' && task.lastResult.hotelCount > 0 && (
                          <>
                            <strong>{task.lastResult.hotelCount}</strong> hoteles · Desde{' '}
                            <strong>{money(task.lastResult.cheapestPrice!, task.lastResult.currency!)}</strong>
                            {task.lastResult.cheapestName && <> · {task.lastResult.cheapestName}</>}
                          </>
                        )}
                        {task.type === 'hotel' && task.lastResult.hotelCount === 0 && 'Sin resultados para esas fechas'}
                        {task.type === 'flight' && task.lastResult.flightCount > 0 && (
                          <>
                            <strong>{task.lastResult.flightCount}</strong> vuelos · Desde{' '}
                            <strong>{money(task.lastResult.cheapestPrice!, task.lastResult.currency!)}</strong>
                            {task.lastResult.cheapestDate && <> · {task.lastResult.cheapestDate}</>}
                          </>
                        )}
                        {task.type === 'flight' && task.lastResult.flightCount === 0 && 'Sin resultados para esas fechas'}
                      </span>
                    </div>

                    {/* Trend badge */}
                    {tr && tr.pct !== 0 && (
                      <span className={`flex items-center gap-0.5 shrink-0 font-semibold text-xs px-1.5 py-0.5 rounded-full ${
                        tr.pct < 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {tr.pct < 0
                          ? <TrendingDown className="w-3 h-3" />
                          : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(tr.pct)}%
                      </span>
                    )}
                  </div>

                  {task.lastRun && (
                    <p className="text-xs text-gray-400 mt-1">
                      Actualizado: {new Date(task.lastRun).toLocaleString('es-AR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                      {task.priceHistory && task.priceHistory.length > 1 && (
                        <span className="ml-2 text-gray-300">· {task.priceHistory.length} mediciones</span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <TaskModal
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingTask(undefined) }}
          editing={editingTask}
        />
      )}
    </div>
  )
}
