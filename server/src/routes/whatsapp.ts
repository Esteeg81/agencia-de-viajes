import { Router } from 'express'

const router = Router()

router.post('/send', async (req, res) => {
  const { message } = req.body as { message?: string }
  const apikey = process.env.CALLMEBOT_API_KEY
  const phone  = process.env.WHATSAPP_ADMIN_PHONE

  if (!message) {
    res.status(400).json({ message: 'Falta el mensaje' })
    return
  }

  if (!apikey || !phone) {
    res.status(500).json({ message: 'CALLMEBOT_API_KEY o WHATSAPP_ADMIN_PHONE no configuradas en el servidor' })
    return
  }

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`
    const r = await fetch(url)
    const body = await r.text()

    // CallMeBot echoes "Message to: ..." on success (sometimes with non-200 status)
    const isSuccess = /message to:/i.test(body)
    const isError = !isSuccess && (!r.ok || /error|invalid|unauthorized|not found/i.test(body))
    if (isError) {
      res.status(502).json({ message: `CallMeBot: ${body.slice(0, 200)}` })
      return
    }

    res.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar'
    res.status(500).json({ message: msg })
  }
})

export default router
