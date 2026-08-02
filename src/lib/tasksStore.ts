import type { ScheduledTask, WsSettings } from '../types/tasks'

const TASKS_KEY = 'agencia_tasks_v1'
const WS_KEY = 'agencia_ws_v1'

export function getTasks(): ScheduledTask[] {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) ?? '[]') as ScheduledTask[]
  } catch {
    return []
  }
}

export function saveTasks(tasks: ScheduledTask[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

export function getWsSettings(): WsSettings | null {
  try {
    const s = localStorage.getItem(WS_KEY)
    return s ? (JSON.parse(s) as WsSettings) : null
  } catch {
    return null
  }
}

export function saveWsSettings(settings: WsSettings): void {
  localStorage.setItem(WS_KEY, JSON.stringify(settings))
}
