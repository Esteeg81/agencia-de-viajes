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
}
