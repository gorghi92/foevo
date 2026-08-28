import { withKey } from '@/server/api-key'
import { getSettings } from '@/lib/settings'
import { r2Configured, r2Put, r2PublicUrl } from '@/lib/r2'
import { runEngine, providerAvailable, type Tier } from '@/lib/attention/engine'
import { resolveEntitlement, monthlyUsage, createAnalysis, attachScreenshot, completeAnalysis, failAnalysis } from '@/server/store'
import type { PageElement } from '@/lib/attention/types'
import { exceedsModelLimit } from '@/lib/attention/image-size'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Opus 5 con thinking può superare i 60s: diamo margine alla funzione.
export const maxDuration = 300

interface Body {
  url?: string; title?: string; goal?: string | null; note?: string | null
  image?: { width: number; height: number }
  fullSize?: { width: number; height: number }
  screenshot?: string
  aiImage?: string
  aiSize?: { width: number; height: number }
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
    if (ent.source === 'none') {
      return Response.json({
        error: 'Nessun piano attivo: attiva un abbonamento su foevo.app per analizzare.',
        code: 'no_plan',
      }, { status: 402 })
    }
    if (!ent.unlimited) {
      const used = await monthlyUsage(userId)
      if (used >= ent.quota) {
        return Response.json({ error: `Quota mensile esaurita (${used}/${ent.quota}).`, code: 'quota_exceeded' }, { status: 402 })
      }
    }

    // Limite del modello: nessun lato oltre MAX_IMAGE_SIDE px. Le versioni
    // vecchie dell'estensione non mandano `aiImage` e su pagine molto lunghe
    // producevano uno screenshot fuori limite. Le dimensioni le leggiamo dai
    // byte, non da quelle dichiarate nel payload: così il controllo tiene
    // qualunque cosa mandi il client.
    const aiImage = body.aiImage || body.screenshot
    if (exceedsModelLimit(aiImage)) {
      return Response.json({
        error: body.aiImage
          ? 'Immagine troppo grande per l\u2019analisi: riprova su una pagina meno lunga.'
          : 'Pagina troppo lunga per questa versione dell\u2019estensione: aggiorna all\u2019ultima versione dalla dashboard.',
        code: 'image_too_large',
      }, { status: 400 })
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
      await getSettings() // allinea la config storage (DB → r2.ts) prima dell'upload
      if (r2Configured()) {
        const m = body.screenshot.match(/^data:(image\/[a-z]+);base64,(.*)$/i)
        if (m) {
          const key = `analyses/${userId}/${id}.jpg`
          if (await r2Put(key, Buffer.from(m[2], 'base64'), m[1])) screenshotUrl = r2PublicUrl(key)
        }
      }
    } catch (e) { console.error('[foevo] R2 upload failed', e) }
    await attachScreenshot(id, screenshotUrl)

    try {
      // L'analisi usa l'immagine dedicata quando l'estensione la fornisce: è
      // già entro i limiti di dimensione del modello. Lo screenshot di
      // visualizzazione resta quello mostrato nel report.
      const out = await runEngine({ tier, screenshot: aiImage, sample: body.sample, ctx, elements })
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
