import { withKey } from '@/server/api-key'
import { r2Configured, r2Put, r2PublicUrl } from '@/lib/r2'
import { runEngine, providerAvailable, type Tier } from '@/lib/attention/engine'
import { resolveEntitlement, monthlyUsage, createAnalysis, attachScreenshot, completeAnalysis, failAnalysis } from '@/server/store'
import type { PageElement } from '@/lib/attention/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

interface Body {
  url?: string; title?: string; goal?: string | null; note?: string | null
  image?: { width: number; height: number }
  fullSize?: { width: number; height: number }
  screenshot?: string
  sample?: { w: number; h: number; b64: string }
  elements?: unknown
}

/** Untrusted DOM rects from the extension: clamp, bound size, cap count. */
function sanitizeElements(raw: unknown): PageElement[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: PageElement[] = []
  for (const e of raw.slice(0, 80)) {
    const bb = (e as any)?.bbox
    if (!Array.isArray(bb) || bb.length < 4) continue
    const b = bb.map((n: any) => { const v = Number(n); return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0 })
    out.push({
      type: String((e as any)?.type || 'el').slice(0, 24),
      text: String((e as any)?.text || '').slice(0, 100),
      bbox: [b[0], b[1], Math.max(0.005, b[2]), Math.max(0.005, b[3])],
    })
    if (out.length >= 40) break
  }
  return out.length ? out : undefined
}

function pickTier(preferred: Tier): Tier | null {
  if (providerAvailable(preferred)) return preferred
  const other: Tier = preferred === 'premium' ? 'base' : 'premium'
  return providerAvailable(other) ? other : null
}

export async function POST(req: Request): Promise<Response> {
  return withKey(req, async ({ userId }) => {
    const body = (await req.json().catch(() => null)) as Body | null
    if (!body?.screenshot || !body.sample?.b64) {
      return Response.json({ error: 'Payload incompleto: servono "screenshot" e "sample".' }, { status: 400 })
    }

    const ent = await resolveEntitlement(userId)
    if (!ent.unlimited) {
      const used = await monthlyUsage(userId)
      if (used >= ent.quota) {
        return Response.json({ error: `Quota mensile esaurita (${used}/${ent.quota}).`, code: 'quota_exceeded' }, { status: 402 })
      }
    }

    const tier = pickTier(ent.tier)
    if (!tier) return Response.json({ error: 'Nessun provider AI configurato.' }, { status: 503 })

    const url = String(body.url || ''); const title = String(body.title || '')
    const ctx = { url, title, goal: body.goal ?? null, note: body.note ?? null }
    const elements = sanitizeElements(body.elements)

    const id = await createAnalysis({
      userId, url, title, goal: ctx.goal, note: ctx.note, tier,
      width: body.image?.width ?? 0, height: body.image?.height ?? 0,
      fullWidth: body.fullSize?.width ?? 0, fullHeight: body.fullSize?.height ?? 0,
    })

    let screenshotUrl = body.screenshot
    try {
      if (r2Configured()) {
        const m = body.screenshot.match(/^data:(image\/[a-z]+);base64,(.*)$/i)
        if (m) {
          const key = `analyses/${userId}/${id}.jpg`
          if (await r2Put(key, Buffer.from(m[2], 'base64'), m[1])) screenshotUrl = r2PublicUrl(key)
        }
      }
    } catch (e) { console.error('[foveo] R2 upload failed', e) }
    await attachScreenshot(id, screenshotUrl)

    try {
      const out = await runEngine({ tier, screenshot: body.screenshot, sample: body.sample, ctx, elements })
      await completeAnalysis(id, {
        result: out.result, heatmap: out.heatmap, provider: out.provider, model: out.model,
        inputTokens: out.usage.input, outputTokens: out.usage.output, costUsd: out.costUsd,
      })
      return Response.json({ id, resultPath: `/analyses/${id}`, tier: out.provider === 'claude' ? 'premium' : 'base' }, { status: 201 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore analisi'
      await failAnalysis(id, msg)
      return Response.json({ error: msg, id }, { status: 502 })
    }
  })
}
