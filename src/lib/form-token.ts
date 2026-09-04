import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Token firmato e a scadenza per i moduli pubblici.
 *
 * Non tiene stato: la pagina ne emette uno al render, l'endpoint verifica firma
 * ed età. Non è un CAPTCHA — serve a rendere inutile il POST diretto e ripetuto
 * all'endpoint, che è il caso reale di abuso di un modulo di contatto.
 */
const MAX_AGE_MS = 30 * 60 * 1000

function secret(): string {
  // Chiave solo server. Se manca, il token diventa inefficace ma non blocca:
  // meglio un modulo che funziona senza questa difesa che un modulo rotto.
  return process.env.FORM_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function sign(ts: string): string {
  return createHmac('sha256', secret() || 'foevo').update(`form:${ts}`).digest('base64url')
}

export function issueFormToken(nowMs: number): string {
  const ts = String(nowMs)
  return `${ts}.${sign(ts)}`
}

export function verifyFormToken(token: unknown, nowMs: number): boolean {
  if (!secret()) return true // non configurato: non blocchiamo gli invii legittimi
  const raw = String(token || '')
  const dot = raw.indexOf('.')
  if (dot <= 0) return false
  const ts = raw.slice(0, dot)
  const mac = raw.slice(dot + 1)
  const expected = sign(ts)
  if (mac.length !== expected.length) return false
  try {
    if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false
  } catch {
    return false
  }
  const t = Number(ts)
  if (!Number.isFinite(t)) return false
  const age = nowMs - t
  return age >= 0 && age < MAX_AGE_MS
}
