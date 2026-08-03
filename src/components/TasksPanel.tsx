import { useState } from 'react'
import {
  Plus, Play, MessageCircle, Trash2, Edit3, Hotel, Plane,
  Settings, CheckCircle, AlertCircle, Loader2, RefreshCw, X,
} from 'lucide-react'
import type { ScheduledTask, HotelTask, FlightTask, WsSettings } from '../types/tasks'
import { getTasks, saveTasks, getWsSettings, saveWsSettings } from '../lib/tasksStore'
import { searchHotels } from '../lib/hotelsApi'
import { searchFlights } from '../lib/api'
import { TaskModal } from './TaskModal'

type RunState = { status: 'idle' | 'running' | 'done' | 'error'; error?: string }

function money(amount: string, currency: string) {
  return `${currency} ${Number(amount).toLocaleString('es-AR')}`
}

function buildWsMessage(tasks: ScheduledTask[]): string {
  const date = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const lines: string[] = [`*Informe de viajes - ${date}*`, '']

  for (const task of tasks) {
    if (!task.lastResult) continue
    if (task.type === 'hotel') {
      lines.push(`*Hotel: ${task.name}* (${task.destination})`)
      if (task.lastResult.hotelCount > 0) {
        lines.push(`  Desde ${money(task.lastResult.cheapestPrice!, task.lastResult.currency!)} · ${task.lastResult.hotelCount} opciones`)
        if (task.lastResult.cheapestName) lines.push(`  Mejor: ${task.lastResult.cheapestName}`)
      } else {
        lines.push('  Sin resultados disponibles')
      }
    } else {
      lines.push(`*Vuelo: ${task.name}* (${task.origin} -> ${task.destination})`)
      if (task.lastResult.flightCount > 0) {
        lines.push(`  Desde ${money(task.lastResult.cheapestPrice!, task.lastResult.currency!)} · ${task.lastResult.flightCount} opciones`)
        if (task.lastResult.cheapestDate) lines.push(`  Salida mas barata: ${task.lastResult.cheapestDate}`)
      } else {
        lines.push('  Sin resultados disponibles')
      }
    }
    lines.push('')
  }

  lines.push('_Agencia de Viajes · Datos en tiempo real_')
  return lines.join('\n')
}

export function TasksPanel() {
  const [tasks, setTasks] = useState<ScheduledTask[]>(() => getTasks())
  const [runState, setRunState] = useState<Record<string, RunState>>({})
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<ScheduledTask | undefined>()
  const [runningAll, setRunningAll] = useState(false)

  const [wsSettings, setWsSettings] = useState<WsSettings>(() => getWsSettings() ?? { phone: '', apikey: '' })
  const [showWsPanel, setShowWsPanel] = useState(false)
  const [wsSending, setWsSending] = useState(false)
  const [wsFeedback, setWsFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  function sync(updated: ScheduledTask[]) {
    setTasks(updated)
    saveTasks(updated)
  }

  function setRun(id: string, state: RunState) {
    setRunState(prev => ({ ...prev, [id]: state }))
  }

  async function runOne(task: ScheduledTask): Promise<ScheduledTask> {
    setRun(task.id, { status: 'running' })
    try {
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
        const updated: HotelTask = {
          ...task,
          lastRun: new Date().toISOString(),
          lastResult: {
            hotelCount: result.offers.length,
            cheapestPrice: result.cheapest?.price.total,
            currency: result.currency,
            cheapestName: result.cheapest?.hotelName,
          },
        }
        setRun(task.id, { status: 'done' })
        return updated
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
        const updated: FlightTask = {
          ...task,
          lastRun: new Date().toISOString(),
          lastResult: {
            flightCount: result.offers.length,
            cheapestPrice: result.cheapest?.price.total,
            currency: result.currency,
            cheapestDate,
          },
        }
        setRun(task.id, { status: 'done' })
        return updated
      }
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

  async function sendWhatsApp() {
    if (!wsSettings.phone || !wsSettings.apikey) {
      setShowWsPanel(true)
      return
    }
    setWsSending(true)
    setWsFeedback(null)
    try {
      const message = buildWsMessage(tasks)
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: wsSettings.phone, apikey: wsSettings.apikey, message }),
      })
      const data = await res.json().catch(() => ({ message: 'Error al enviar' })) as { message?: string; ok?: boolean; detail?: string }
      if (!res.ok) {
        throw new Error(data.message ?? 'Error al enviar')
      }
      const detail = data.detail ? ` · ${data.detail}` : ''
      setWsFeedback({ ok: true, msg: `Informe enviado a tu WhatsApp${detail}` })
      setTimeout(() => setWsFeedback(null), 8000)
    } catch (e) {
      setWsFeedback({ ok: false, msg: e instanceof Error ? e.message : 'Error al enviar' })
    } finally {
      setWsSending(false)
    }
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
              {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} · al ejecutar se actualiza el informe
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
                onClick={sendWhatsApp}
                disabled={wsSending}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {wsSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Enviar informe WS
              </button>
            )}
            <button
              onClick={() => setShowWsPanel(!showWsPanel)}
              title="Configurar WhatsApp"
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-semibold transition-colors ${
                showWsPanel ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback WS */}
        {wsFeedback && (
          <div className={`mt-3 flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
            wsFeedback.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {wsFeedback.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {wsFeedback.msg}
          </div>
        )}

        {/* Panel WhatsApp */}
        {showWsPanel && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-green-800 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> Configuración WhatsApp (CallMeBot — gratis)
              </p>
              <button onClick={() => setShowWsPanel(false)} className="text-green-600 hover:text-green-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-green-700 leading-relaxed">
              Mandá el mensaje <strong>"I allow callmebot to send me messages"</strong> por WhatsApp al número{' '}
              <strong>+34 644 55 60 77</strong>. Te van a responder con tu API key.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Tu número (con código país)</label>
                <input
                  type="tel"
                  value={wsSettings.phone}
                  onChange={e => setWsSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+5491112345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">API Key</label>
                <input
                  type="text"
                  value={wsSettings.apikey}
                  onChange={e => setWsSettings(prev => ({ ...prev, apikey: e.target.value }))}
                  placeholder="123456"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
            <button
              onClick={() => { saveWsSettings(wsSettings); setShowWsPanel(false) }}
              className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Guardar configuración
            </button>
          </div>
        )}
      </div>

      {/* Estado vacío */}
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

      {/* Lista de tareas */}
      <div className="space-y-3">
        {tasks.map(task => {
          const st = runState[task.id]
          const isRunning = st?.status === 'running'
          const isError = st?.status === 'error'
          const isHotel = task.type === 'hotel'
          const borderColor = task.lastResult ? (isHotel ? 'border-amber-300' : 'border-blue-300') : 'border-gray-100'
          const accentBg = isHotel ? 'bg-amber-50' : 'bg-blue-50'
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
                    <p className="font-semibold text-gray-800 text-sm truncate">{task.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {task.type === 'hotel'
                        ? `${task.destination} · ${task.checkInDate} · ${task.nights}n · ${task.adults} adulto${task.adults > 1 ? 's' : ''}${task.allInclusive ? ' · AI' : ''}`
                        : `${task.origin} → ${task.destination} · ${task.departureFrom}${task.tripType === 'roundtrip' && task.returnFrom ? ` · vuelta ${task.returnFrom}` : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => runTaskAndSync(task)}
                    disabled={isRunning}
                    title="Ejecutar ahora"
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingTask(task); setShowModal(true) }}
                    title="Editar"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => sync(tasks.filter(t => t.id !== task.id))}
                    title="Eliminar"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Error */}
              {isError && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {st.error}
                </div>
              )}

              {/* Último resultado */}
              {task.lastResult && (
                <div className={`mt-3 rounded-lg px-3 py-2.5 ${accentBg}`}>
                  {task.type === 'hotel' && (
                    <div className={`text-xs ${accentText} flex items-start gap-1.5`}>
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        {task.lastResult.hotelCount > 0
                          ? <>
                              <strong>{task.lastResult.hotelCount}</strong> hoteles · Desde{' '}
                              <strong>{money(task.lastResult.cheapestPrice!, task.lastResult.currency!)}</strong>
                              {task.lastResult.cheapestName && <> · {task.lastResult.cheapestName}</>}
                            </>
                          : 'Sin resultados para esas fechas'}
                      </span>
                    </div>
                  )}
                  {task.type === 'flight' && (
                    <div className={`text-xs ${accentText} flex items-start gap-1.5`}>
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        {task.lastResult.flightCount > 0
                          ? <>
                              <strong>{task.lastResult.flightCount}</strong> vuelos · Desde{' '}
                              <strong>{money(task.lastResult.cheapestPrice!, task.lastResult.currency!)}</strong>
                              {task.lastResult.cheapestDate && <> · Salida más barata: {task.lastResult.cheapestDate}</>}
                            </>
                          : 'Sin resultados para esas fechas'}
                      </span>
                    </div>
                  )}
                  {task.lastRun && (
                    <p className="text-xs text-gray-400 mt-1">
                      Actualizado:{' '}
                      {new Date(task.lastRun).toLocaleString('es-AR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
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
