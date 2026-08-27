import { createServiceClient } from '@/lib/supabase/server'
import type { Tier } from '@/lib/attention/engine'
import type { AttentionResult } from '@/lib/attention/types'

export interface Entitlement {
  tier: Tier
  quota: number
  unlimited: boolean
  source: 'whop' | 'manual' | 'none'
  status: string
}

export async function resolveEntitlement(userId: string): Promise<Entitlement> {
  const sc = createServiceClient()
  const { data } = await sc
    .from('entitlements')
    .select('tier, monthly_quota, unlimited, source, status')
    .eq('user_id', userId)
    .maybeSingle()
  if (data && data.status === 'active') {
    return {
      tier: (data.tier as Tier) === 'premium' ? 'premium' : 'base',
      quota: Number(data.monthly_quota ?? 0),
      unlimited: !!data.unlimited,
      source: (data.source as Entitlement['source']) ?? 'manual',
      status: data.status as string,
    }
  }
  // Nessuna prova gratuita: senza un abbonamento attivo non si analizza.
  return { tier: 'base', quota: 0, unlimited: false, source: 'none', status: 'none' }
}

export async function monthlyUsage(userId: string): Promise<number> {
  const sc = createServiceClient()
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const { count } = await sc
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'error')
    .gte('created_at', start)
  return count ?? 0
}

export interface CreateArgs {
  userId: string
  url: string; title: string; goal: string | null; note: string | null
  tier: Tier
  width: number; height: number; fullWidth: number; fullHeight: number
}

export async function createAnalysis(a: CreateArgs): Promise<string> {
  const { data, error } = await createServiceClient()
    .from('analyses')
    .insert({
      user_id: a.userId, url: a.url, title: a.title, goal: a.goal, note: a.note,
      tier: a.tier, status: 'processing',
      width: a.width, height: a.height, full_width: a.fullWidth, full_height: a.fullHeight,
    })
    .select('id')
    .single()
  if (error) throw new Error(`DB insert: ${error.message}`)
  return data.id as string
}

export async function attachScreenshot(id: string, url: string): Promise<void> {
  await createServiceClient().from('analyses').update({ screenshot_url: url }).eq('id', id)
}

export async function completeAnalysis(id: string, out: {
  result: AttentionResult; heatmap: unknown; provider: string; model: string
  inputTokens?: number; outputTokens?: number; costUsd?: number
}): Promise<void> {
  const s = out.result.scores
  const { error } = await createServiceClient()
    .from('analyses')
    .update({
      status: 'done', page_type: out.result.pageType, provider: out.provider, model: out.model,
      heatmap: out.heatmap, result: out.result,
      score_conversion: s.conversion, score_attention: s.attentionAlignment,
      score_clarity: s.clarity, score_cta: s.cta,
      input_tokens: out.inputTokens ?? null, output_tokens: out.outputTokens ?? null, cost_usd: out.costUsd ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(`DB update: ${error.message}`)
}

export async function failAnalysis(id: string, message: string): Promise<void> {
  await createServiceClient()
    .from('analyses')
    .update({ status: 'error', error: message.slice(0, 500), updated_at: new Date().toISOString() })
    .eq('id', id)
}
