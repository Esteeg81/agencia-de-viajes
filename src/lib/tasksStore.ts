import type { ScheduledTask } from '../types/tasks'

const TASKS_KEY = 'agencia_tasks_v1'

export function getTasks(): ScheduledTask[] {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) ?? '[]') as ScheduledTask[]
  } catch {
    return []
  }
}

export function saveTasks(tasks: ScheduledTask[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  syncToServer(tasks)
}

function syncToServer(tasks: ScheduledTask[]) {
  fetch('/api/tasks/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  }).catch(() => { /* server may be sleeping, ignore */ })
}
