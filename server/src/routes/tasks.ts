import { Router } from 'express'
import { readTasks, writeTasks } from '../lib/taskStore.js'
import type { ServerTask } from '../lib/taskStore.js'

const router = Router()

// Client syncs full task list to server on save/load
router.post('/sync', (req, res) => {
  const { tasks } = req.body as { tasks?: ServerTask[] }
  if (!Array.isArray(tasks)) {
    res.status(400).json({ message: 'tasks debe ser un array' })
    return
  }
  writeTasks(tasks)
  res.json({ ok: true, count: tasks.length })
})

router.get('/', (_req, res) => {
  res.json({ tasks: readTasks() })
})

export default router
