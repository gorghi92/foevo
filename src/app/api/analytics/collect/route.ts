import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { consume, ipKey } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Ingestione eventi analytics. Endpoint pubblico (il tracker gira su tutte le
 * pagine), quindi: nessun dato personale, campi validati e troncati, tetto di
 * eventi per richiesta, inserimento con service key. Risponde 204 sempre —
 * l'analytics non deve mai rompere l'esperienza del visitatore.
 */

const MAX_EVENTS = 60
const KINDS = new Set(['pageview', 'click', 'scroll', 'ping'])

const s = (v: unknown, max: number): string | null => {
  if (v == null) return null
  const t = String(v).trim()
  return t ? t.slice(0, max) : null
}
const i = (v: unknown, min: number, max: number): number | null => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.round(n)))
}
const f = (v: unknown): number | null => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.min(1, Math.max(0, n))
}

/** Tetto al corpo della richiesta: 60 eventi troncati non arrivano a tanto. */
const MAX_BODY_BYTES = 64 * 1024

export async function POST(req: Request) {
  const declared = Number(req.headers.get('content-length') || 0)
  if (declared > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 })

  // Endpoint pubblico e scrivente: il tetto è largo (il tracker manda batch, non
  // una richiesta per evento) e serve solo a fermare chi prova a gonfiare la
  // tabella. Come tutto il resto qui, risponde 204 anche quando rifiuta: il
  // visitatore non deve accorgersi di nulla.
  const verdict = await consume([
    { bucket: 'analytics-ip', key: ipKey(req), windowSeconds: 600, max: 300 },
  ])
  if (!verdict.ok) return new NextResponse(null, { status: 204 })

  let payload: any
  try {
    // sendBeacon manda text/plain: leggiamo il testo e proviamo il parse.
    const txt = await req.text()
    if (txt.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 })
    payload = JSON.parse(txt)
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const events: any[] = Array.isArray(payload?.events) ? payload.events : []
  if (!events.length) return new NextResponse(null, { status: 204 })

  const country = req.headers.get('x-vercel-ip-country') || null

  const rows = events.slice(0, MAX_EVENTS).map((e) => {
    const kind = s(e?.k, 16)
    if (!kind || !KINDS.has(kind)) return null
    const vid = s(e?.v, 64)
    const sid = s(e?.s, 64)
    if (!vid || !sid) return null
    return {
      visitor_id: vid,
      session_id: sid,
      kind,
      path: (s(e?.p, 300) || '/').split('#')[0],
      referrer: s(e?.r, 500),
      referrer_host: s(e?.rh, 200),
      utm_source: s(e?.us, 120),
      utm_medium: s(e?.um, 120),
      utm_campaign: s(e?.uc, 120),
      device: s(e?.d, 16),
      browser: s(e?.b, 40),
      os: s(e?.o, 40),
      country: country ? country.slice(0, 4) : null,
      screen_w: i(e?.sw, 0, 20000),
      viewport_w: i(e?.vw, 0, 20000),
      viewport_h: i(e?.vh, 0, 40000),
      x_pct: f(e?.x),
      y_px: i(e?.y, 0, 500000),
      doc_h: i(e?.dh, 0, 500000),
      scroll_pct: i(e?.sc, 0, 100),
      dur_ms: i(e?.dm, 0, 1000 * 60 * 30),
    }
  }).filter(Boolean)

  if (rows.length) {
    try {
      await createServiceClient().from('analytics_events').insert(rows as any[])
    } catch { /* tabella assente o errore: non blocchiamo mai il client */ }
  }
  return new NextResponse(null, { status: 204 })
}
