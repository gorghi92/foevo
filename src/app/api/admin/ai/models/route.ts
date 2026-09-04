import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { getAiConfig } from '@/lib/attention/llm'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Scarica con timeout, ritorna JSON o null (mai lancia). */
async function fetchJson(url: string, headers: Record<string, string>): Promise<any | null> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 6000)
  try {
    const r = await fetch(url, { headers, signal: ac.signal })
    if (!r.ok) return null
    return await r.json()
  } catch { return null } finally { clearTimeout(t) }
}

/** Elenco dei modelli davvero disponibili per le chiavi configurate. */
export async function GET() {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: m('superadminOnly') }, { status: 403 })

  const cfg = await getAiConfig()

  // Anthropic: GET /v1/models → data[].id (solo modelli claude-*).
  let claude: string[] = []
  if (cfg.anthropicKey) {
    const j = await fetchJson('https://api.anthropic.com/v1/models?limit=100', {
      'x-api-key': cfg.anthropicKey, 'anthropic-version': '2023-06-01',
    })
    claude = ((j?.data ?? []) as any[]).map((m) => String(m?.id || '')).filter((id) => id.startsWith('claude-'))
  }

  // DashScope (OpenAI-compatible): GET /models → data[].id, filtriamo i vision (vl).
  let qwen: string[] = []
  if (cfg.dashscopeKey) {
    const j = await fetchJson(`${cfg.dashscopeBase}/models`, { Authorization: `Bearer ${cfg.dashscopeKey}` })
    qwen = ((j?.data ?? []) as any[]).map((m) => String(m?.id || '')).filter((id) => /vl/i.test(id) && !/audio|omni|ocr/i.test(id))
  }

  const uniqSort = (a: string[]) => Array.from(new Set(a)).sort()
  return NextResponse.json({ claude: uniqSort(claude), qwen: uniqSort(qwen) }, { headers: { 'Cache-Control': 'no-store' } })
}
