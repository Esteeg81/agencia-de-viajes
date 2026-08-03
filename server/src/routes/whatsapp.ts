import { Router } from 'express'
import { sendWhatsAppMessage } from '../lib/whatsappSender.js'

const router = Router()

router.post('/send', async (req, res) => {
  const { message } = req.body as { message?: string }
  if (!message) {
    res.status(400).json({ message: 'Falta el mensaje' })
    return
  }
  try {
    await sendWhatsAppMessage(message)
    res.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar'
    const status = msg.startsWith('CALLMEBOT') || msg.startsWith('CallMeBot') ? 502 : 500
    res.status(status).json({ message: msg })
  }
})

export default router
