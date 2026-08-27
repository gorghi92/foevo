import { createServiceClient } from './supabase/server'
import { applyStorageSettings } from './r2'

/**
 * Configurazione runtime salvata in `app_settings` (Supabase). Ha priorità sulle
 * variabili d'ambiente: così il superadmin può configurare Whop e lo storage dal
 * pannello, senza redeploy. Le env restano come fallback.
 */

const TTL_MS = 30_000
let cache: { at: number; data: Record<string, string> } | null = null

/** Chiavi gestibili dal pannello Impostazioni. */
export const SETTING_KEYS = [
  'WHOP_API_KEY',
  'WHOP_WEBHOOK_SECRET',
  'WHOP_CHECKOUT_BASE',
  'RESEND_API_KEY',
  'MAIL_FROM',
  'SUPPORT_EMAIL',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_ENDPOINT',
  'R2_PUBLIC_BASE',
] as const
export type SettingKey = (typeof SETTING_KEYS)[number]

/** Legge tutte le impostazioni dal DB (con cache breve) e allinea lo storage. */
export async function getSettings(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data
  const data: Record<string, string> = {}
  try {
    const sc = createServiceClient()
    const { data: rows } = await sc.from('app_settings').select('key, value')
    for (const r of rows ?? []) if (r.value) data[r.key as string] = r.value as string
  } catch {
    /* tabella assente o DB irraggiungibile → si usa solo l'env */
  }
  cache = { at: Date.now(), data }
  // Propaga le chiavi storage a r2.ts (che altrimenti leggerebbe solo l'env).
  applyStorageSettings(data)
  return data
}

export function clearSettingsCache() {
  cache = null
}

/** Valore di una chiave: prima il DB, poi l'env. */
export async function getSetting(key: SettingKey): Promise<string> {
  const s = await getSettings()
  return s[key] || process.env[key] || ''
}

/** Config Whop consolidata (DB con fallback env). */
export async function getWhopConfig() {
  const s = await getSettings()
  return {
    apiKey: s.WHOP_API_KEY || process.env.WHOP_API_KEY || '',
    webhookSecret: s.WHOP_WEBHOOK_SECRET || process.env.WHOP_WEBHOOK_SECRET || '',
    checkoutBase: (s.WHOP_CHECKOUT_BASE || process.env.WHOP_CHECKOUT_BASE || '').replace(/\/$/, ''),
  }
}

/**
 * Stato di configurazione per la diagnostica: per ogni chiave dice se è impostata
 * e da dove (db | env | none), senza mai esporre il valore.
 */
export async function getSettingsStatus(): Promise<Record<string, 'db' | 'env' | 'none'>> {
  const s = await getSettings()
  const out: Record<string, 'db' | 'env' | 'none'> = {}
  for (const k of SETTING_KEYS) out[k] = s[k] ? 'db' : process.env[k] ? 'env' : 'none'
  return out
}
