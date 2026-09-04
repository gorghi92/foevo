import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { SETTING_KEYS, clearSettingsCache } from '@/lib/settings'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

/**
 * Salva la configurazione runtime (Whop, storage) in `app_settings`.
 * - value non vuoto → upsert
 * - value === '' con la chiave presente nel body → rimuove (reset all'env)
 * - chiave assente dal body → invariata
 * I segreti non vengono mai riletti verso il client.
 */
export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: m('superadminOnly') }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const sc = createServiceClient()
  const now = new Date().toISOString()

  const toUpsert: { key: string; value: string; updated_at: string }[] = []
  const toDelete: string[] = []
  for (const key of SETTING_KEYS) {
    if (!(key in body)) continue
    const raw = body[key]
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (value) toUpsert.push({ key, value, updated_at: now })
    else toDelete.push(key)
  }

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
