export async function sendWhatsAppMessage(message: string): Promise<void> {
  const apikey = process.env.CALLMEBOT_API_KEY
  const phone  = process.env.WHATSAPP_ADMIN_PHONE
  if (!apikey || !phone) throw new Error('CALLMEBOT_API_KEY o WHATSAPP_ADMIN_PHONE no configuradas')

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`
  const r = await fetch(url)
  const body = await r.text()
  const isSuccess = /message to:/i.test(body)
  if (!isSuccess && (!r.ok || /error|invalid|unauthorized|not found/i.test(body))) {
    throw new Error(`CallMeBot: ${body.slice(0, 200)}`)
  }
}
