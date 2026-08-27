import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Piccolo limite in memoria: frena gli invii ripetuti dalla stessa origine. */
const hits = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  list.push(now)
  hits.set(ip, list)
  if (hits.size > 5000) hits.clear() // il processo è effimero: evita crescita illimitata
  return list.length > MAX_PER_WINDOW
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string; email?: string; topic?: string; message?: string; website?: string
  }

  // Campo esca: i bot lo compilano, le persone no.
  if (String(body.website || '').trim()) return NextResponse.json({ ok: true })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sconosciuto'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Troppi invii ravvicinati. Riprova tra qualche minuto.' }, { status: 429 })
  }

  const name = String(body.name || '').trim().slice(0, 120)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const topic = String(body.topic || 'Generale').trim().slice(0, 60)
  const message = String(body.message || '').trim().slice(0, 5000)

  if (!email.includes('@') || email.length < 5) {
    return NextResponse.json({ error: 'Inserisci un indirizzo email valido: ci serve per risponderti.' }, { status: 400 })
  }
  if (message.length < 10) {
    return NextResponse.json({ error: 'Scrivi qualche riga in più su cosa succede.' }, { status: 400 })
  }

  const s = await getSettings()
  // Destinazione già dichiarata nella scheda dello store; sovrascrivibile da
  // Superadmin → Impostazioni senza toccare il codice.
  const to = s.SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || 'info@akmehub.com'
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1c1917">
      <p style="margin:0 0 14px"><b>Nuovo messaggio dalla pagina assistenza</b></p>
      <table cellpadding="0" cellspacing="0" style="font-size:14px">
        <tr><td style="padding:3px 14px 3px 0;color:#78716c">Da</td><td><b>${esc(name) || '(senza nome)'}</b></td></tr>
        <tr><td style="padding:3px 14px 3px 0;color:#78716c">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        <tr><td style="padding:3px 14px 3px 0;color:#78716c">Argomento</td><td>${esc(topic)}</td></tr>
      </table>
      <hr style="border:0;border-top:1px solid #e9e5e1;margin:16px 0">
      <div style="white-space:pre-wrap">${esc(message)}</div>
    </div>`

  const sent = await sendEmail({ to, subject: `[Assistenza Foevo] ${topic} — ${name || email}`, html })
  if (!sent) {
    return NextResponse.json({ error: 'Invio non riuscito. Riprova tra poco.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
