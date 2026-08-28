import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { clearSettingsCache } from '@/lib/settings'
import { EFFORTS } from '@/lib/attention/llm'

export const runtime = 'nodejs'

/** Chiavi segrete: valore → upsert, '' (con chiave presente) → rimuove, assente → invariata. */
const SECRET_KEYS = ['ANTHROPIC_API_KEY', 'DASHSCOPE_API_KEY', 'DASHSCOPE_BASE_URL'] as const

const isModelId = (v: string) => /^[A-Za-z0-9._:@-]{1,80}$/.test(v)

/** Salva la configurazione AI (chiavi, modelli, effort, mix heatmap) in app_settings. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const now = new Date().toISOString()
  const toUpsert: { key: string; value: string; updated_at: string }[] = []
  const toDelete: string[] = []

  // Segreti (comportamento identico alle Impostazioni).
  for (const key of SECRET_KEYS) {
    if (!(key in b)) continue
    const value = typeof b[key] === 'string' ? (b[key] as string).trim() : ''
    if (value) toUpsert.push({ key, value, updated_at: now })
    else toDelete.push(key)
  }

  // Modelli (obbligatori se presenti nel body).
  for (const key of ['ATTENTION_CLAUDE_MODEL', 'ATTENTION_QWEN_MODEL'] as const) {
    if (!(key in b)) continue
    const value = typeof b[key] === 'string' ? (b[key] as string).trim() : ''
    if (!value) { toDelete.push(key); continue } // vuoto → torna al default/env
    if (!isModelId(value)) return NextResponse.json({ error: `Model id non valido: ${key}` }, { status: 400 })
    toUpsert.push({ key, value, updated_at: now })
  }

  // Effort (whitelist).
  if ('ATTENTION_CLAUDE_EFFORT' in b) {
    const value = String(b.ATTENTION_CLAUDE_EFFORT || '').trim()
    if (!value) toDelete.push('ATTENTION_CLAUDE_EFFORT')
    else if (!(EFFORTS as readonly string[]).includes(value)) return NextResponse.json({ error: 'Effort non valido' }, { status: 400 })
    else toUpsert.push({ key: 'ATTENTION_CLAUDE_EFFORT', value, updated_at: now })
  }

  // Mix heatmap: quota semantica 0..100.
  if ('ATTENTION_SEMANTIC_PCT' in b) {
    const n = Math.round(Number(b.ATTENTION_SEMANTIC_PCT))
    if (!Number.isFinite(n) || n < 0 || n > 100) return NextResponse.json({ error: 'Percentuale non valida (0–100)' }, { status: 400 })
    toUpsert.push({ key: 'ATTENTION_SEMANTIC_PCT', value: String(n), updated_at: now })
  }

  const sc = createServiceClient()
  if (toUpsert.length) {
    const { error } = await sc.from('app_settings').upsert(toUpsert, { onConflict: 'key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (toDelete.length) {
    const { error } = await sc.from('app_settings').delete().in('key', toDelete)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  clearSettingsCache()
  return NextResponse.json({ ok: true, saved: toUpsert.length, cleared: toDelete.length })
}
