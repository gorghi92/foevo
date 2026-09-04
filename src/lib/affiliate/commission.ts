import { getSettings, getSettingsFresh } from '@/lib/settings'

/**
 * Regole economiche dell'affiliazione, in un solo posto e senza dipendenze,
 * così sono testabili in isolamento.
 *
 * Le percentuali sono in "basis points" (1% = 100 bps) per evitare i decimali:
 * un 20% è 2000. La commissione matura su OGNI pagamento (primo e rinnovi) ma
 * solo per i primi N mesi (default 12) dalla conversione.
 */

export interface AffiliateRules {
  baseBps: number
  premiumBps: number
  minPayoutCents: number
  commissionMonths: number
}

const num = (v: unknown, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : d
}

/** Legge le regole dalle impostazioni (con default sensati). `fresh` bypassa la
 * cache di istanza: usalo nelle pagine di configurazione per riflettere subito i
 * salvataggi. */
export async function getAffiliateRules(fresh = false): Promise<AffiliateRules> {
  const s = fresh ? await getSettingsFresh() : await getSettings()
  return {
    baseBps: num(s.AFFILIATE_RATE_BASE_BPS, 2000), // 20%
    premiumBps: num(s.AFFILIATE_RATE_PREMIUM_BPS, 2000), // 20%
    minPayoutCents: num(s.AFFILIATE_MIN_PAYOUT_CENTS, 1000), // 10 €
    commissionMonths: num(s.AFFILIATE_COMMISSION_MONTHS, 12),
  }
}

/**
 * Percentuale (bps) applicabile a un pagamento: l'override per affiliato vince
 * sul default del piano.
 */
export function rateForPlan(
  tier: 'base' | 'premium' | string | null | undefined,
  rules: AffiliateRules,
  overrideBps?: number | null,
): number {
  if (overrideBps != null && Number.isFinite(overrideBps) && overrideBps > 0) return overrideBps
  return tier === 'premium' ? rules.premiumBps : rules.baseBps
}

/** Commissione in centesimi, arrotondata. */
export function commissionCents(baseCents: number, rateBps: number): number {
  return Math.round((baseCents * rateBps) / 10000)
}

/**
 * Indice del mese di commissione (1-based) dato l'istante della prima
 * conversione e quello del pagamento corrente. Ritorna null se fuori finestra.
 */
export function monthIndex(convertedAtMs: number, paymentAtMs: number, months: number): number | null {
  if (!Number.isFinite(convertedAtMs)) return 1 // primo pagamento: apre la finestra
  const elapsed = paymentAtMs - convertedAtMs
  if (elapsed < 0) return 1
  const idx = Math.floor(elapsed / (30 * 864e5)) + 1 // ~30 giorni per mese
  return idx <= months ? idx : null
}
