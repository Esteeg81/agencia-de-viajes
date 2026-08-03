import { Router } from 'express'

const router = Router()

router.post('/send', async (req, res) => {
  const { phone, apikey, message } = req.body as { phone?: string; apikey?: string; message?: string }

  if (!phone || !apikey || !message) {
    res.status(400).json({ message: 'Faltan parámetros: phone, apikey, message' })
    return
  }

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`
    const r = await fetch(url)
    const body = await r.text()

    // CallMeBot returns HTTP 200 even on errors — must check body text too
    const isError = !r.ok || /error|invalid|unauthorized|not found/i.test(body)
    if (isError) {
      res.status(502).json({ message: `CallMeBot: ${body.slice(0, 200)}` })
      return
    }

    res.json({ ok: true, detail: body.slice(0, 200) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar'
    res.status(500).json({ message: msg })
  }
})

export default router
