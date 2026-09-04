import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getSettings } from '@/lib/settings'
import { sendEmail } from '@/lib/email'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyFormToken } from '@/lib/form-token'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

/**
 * Limite in memoria: su serverless vale solo finché la richiesta ricade sulla
 * stessa istanza calda, quindi è una prima barriera, non la difesa principale.
 */
const hits = new Map<string, number[]>()
function memoryLimited(key: string): boolean {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  list.push(now)
  hits.set(key, list)
  if (hits.size > 5000) hits.clear()
  return list.length > MAX_PER_WINDOW
}

/**
 * Limite affidabile, basato sul database: conta gli invii recenti dalla stessa
 * origine. Richiede la tabella support_requests; se non esiste, la funzione si
 * fa da parte invece di bloccare il modulo.
 */
async function dbLimited(ipHash: string): Promise<boolean> {
  try {
    const sc = createServiceClient()
    const since = new Date(Date.now() - WINDOW_MS).toISOString()
    const { count, error } = await sc
      .from('support_requests')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since)
    if (error) return false // tabella assente o non leggibile: non blocchiamo
    return (count ?? 0) >= MAX_PER_WINDOW
  } catch {
    return false
  }
}

/** Registra il messaggio; se la tabella non c'è, prosegue in silenzio. */
async function record(row: Record<string, unknown>): Promise<void> {
  try { await createServiceClient().from('support_requests').insert(row) } catch { /* opzionale */ }
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string; email?: string; topic?: string; message?: string; website?: string; token?: string
  }

  // Campo esca: i bot lo compilano, le persone no.
  if (String(body.website || '').trim()) return NextResponse.json({ ok: true })

  // Il token è emesso dalla pagina: senza, resta il POST diretto all'endpoint.
  if (!verifyFormToken((body as any).token, Date.now())) {
    return NextResponse.json(
      { error: m('formExpired') },
      { status: 400 },
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sconosciuto'
  const ipHash = createHash('sha256').update(`foevo:${ip}`).digest('hex')
  if (memoryLimited(ipHash) || (await dbLimited(ipHash))) {
    return NextResponse.json({ error: m('tooManySubmissions') }, { status: 429 })
  }

  const name = String(body.name || '').trim().slice(0, 120)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const topic = String(body.topic || 'Generale').trim().slice(0, 60)
  const message = String(body.message || '').trim().slice(0, 5000)

  if (!email.includes('@') || email.length < 5) {
    return NextResponse.json({ error: m('enterValidEmailForReply') }, { status: 400 })
  }
  if (message.length < 10) {
    return NextResponse.json({ error: m('writeMoreDetail') }, { status: 400 })
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
  // Registrato comunque: se l'email non parte, il messaggio non va perso.
  await record({ ip_hash: ipHash, email, name: name || null, topic, message, delivered: sent })
  if (!sent) {
    return NextResponse.json({ error: m('sendFailed') }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
