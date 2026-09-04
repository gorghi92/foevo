import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { m } from '@/lib/i18n/api'

/**
 * Freno agli abusi sugli endpoint pubblici (brute force su password e codici,
 * spam di email, martellamento delle API).
 *
 * Il conteggio sta su Postgres perché su Vercel ogni richiesta può finire su
 * un'istanza diversa: un contatore in memoria non fermerebbe nessuno. La
 * funzione `rl_hit` incrementa e legge in un'unica istruzione, quindi neanche
 * un attacco parallelo riesce a leggere due volte lo stesso contatore.
 *
 * L'IP non viene mai salvato: la chiave è un hash con un segreto solo server,
 * così la tabella resta priva di dati personali (come il resto dell'analytics).
 */

export interface Rule {
  /** Famiglia di limite, es. 'aff-login-ip'. Distingue i contatori fra loro. */
  bucket: string
  /** Soggetto già anonimizzato: usa `ipKey()` o `subjectKey()`. */
  key: string
  windowSeconds: number
  max: number
}

function salt(): string {
  return process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'foevo'
}

/** IP del chiamante secondo gli header del proxy Vercel. */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || ''
  const first = xff.split(',')[0]?.trim()
  return first || req.headers.get('x-real-ip') || 'unknown'
}

/** Chiave anonima per IP. */
export function ipKey(req: Request): string {
  return subjectKey(`ip:${clientIp(req)}`)
}

/** Chiave anonima per un soggetto qualsiasi (email, username, id utente). */
export function subjectKey(value: string): string {
  return createHash('sha256').update(`${salt()}:${value.toLowerCase()}`).digest('hex').slice(0, 40)
}

export type Verdict = { ok: true } | { ok: false; retryAfter: number }

/**
 * Consuma un colpo su ogni regola. Basta una regola superata per bloccare.
 *
 * In caso di errore del database lascia passare: un guasto della tabella dei
 * limiti non deve rendere impossibile il login a chi ha diritto di entrare.
 * L'evento viene loggato, così resta visibile nei log della funzione.
 */
export async function consume(rules: Rule[]): Promise<Verdict> {
  const sc = createServiceClient()
  let worst = 0
  for (const r of rules) {
    try {
      const { data, error } = await sc.rpc('rl_hit', {
        p_bucket: r.bucket, p_key: r.key, p_window_seconds: r.windowSeconds, p_limit: r.max,
      })
      if (error) { console.error('[foevo] rate limit non disponibile', error.message); continue }
      const row = Array.isArray(data) ? data[0] : data
      if (row && row.allowed === false) {
        const reset = new Date(row.reset_at as string).getTime()
        const secs = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
        worst = Math.max(worst, Number.isFinite(secs) ? secs : r.windowSeconds)
      }
    } catch (e) {
      console.error('[foevo] rate limit non disponibile', e)
    }
  }
  return worst > 0 ? { ok: false, retryAfter: worst } : { ok: true }
}

/**
 * Scorciatoia per le route: ritorna la risposta 429 già pronta, oppure null se
 * la richiesta può proseguire.
 *
 *   const blocked = await guard(req, [{ bucket: 'x', key: ipKey(req), windowSeconds: 600, max: 10 }])
 *   if (blocked) return blocked
 */
export async function guard(req: Request, rules: Rule[]): Promise<NextResponse | null> {
  const verdict = await consume(rules)
  if (verdict.ok) return null
  return NextResponse.json(
    { error: m('tooManyRequests', undefined, req), code: 'rate_limited' },
    { status: 429, headers: { 'Retry-After': String(verdict.retryAfter) } },
  )
}
