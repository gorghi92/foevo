/**
 * Orchestrates the hybrid attention analysis:
 *   CV saliency (from the extension's RGB sample)  +  LLM semantic zones
 *   → merged heatmap grid  +  structured CRO report.
 */
import { computeSaliency, decodeSample, downscaleGrid, type Grid } from './saliency'
import { analyze, providerAvailable, type Tier, type AnalyzeCtx } from './llm'
import type { AttentionResult, AttentionZone } from './types'

const HEATMAP_W = 100

export interface HeatmapData { w: number; h: number; cells: number[] }
export interface EngineOutput {
  result: AttentionResult
  heatmap: HeatmapData
  provider: 'claude' | 'qwen'
  model: string
}

export interface EngineInput {
  tier: Tier
  screenshot: string // data URL (downscaled JPEG)
  sample: { w: number; h: number; b64: string }
  ctx: AnalyzeCtx
}

/** Blend a normalized saliency grid with gaussian blobs from the LLM's attention zones. */
function mergeHeatmap(sal: Grid, zones: AttentionZone[]): HeatmapData {
  const { w, h } = sal
  const zone = new Float32Array(w * h)
  let zmax = 0
  for (const z of zones) {
    const [zx, zy, zw, zh] = z.bbox
    const cx = (zx + zw / 2) * w
    const cy = (zy + zh / 2) * h
    const sigma = Math.max(2, Math.max(zw, zh) * Math.max(w, h) * 0.5)
    const s2 = 2 * sigma * sigma
    const weight = z.score / 100
    const rad = Math.ceil(sigma * 2.2)
    for (let y = Math.max(0, Math.floor(cy - rad)); y < Math.min(h, cy + rad); y++) {
      for (let x = Math.max(0, Math.floor(cx - rad)); x < Math.min(w, cx + rad); x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy)
        const v = weight * Math.exp(-d2 / s2)
        const i = y * w + x
        zone[i] += v
        if (zone[i] > zmax) zmax = zone[i]
      }
    }
  }
  if (zmax > 0) for (let i = 0; i < zone.length; i++) zone[i] /= zmax

  const cells = new Float32Array(w * h)
  let max = 1e-6
  const salWeight = zones.length ? 0.5 : 1.0
  for (let i = 0; i < cells.length; i++) {
    cells[i] = salWeight * sal.cells[i] + (zones.length ? 1.0 : 0) * zone[i]
    if (cells[i] > max) max = cells[i]
  }
  const out: number[] = new Array(w * h)
  for (let i = 0; i < cells.length; i++) out[i] = Math.round((cells[i] / max) * 1000) / 1000
  return { w, h, cells: out }
}

export async function runEngine(input: EngineInput): Promise<EngineOutput> {
  // 1. CV saliency (fast, deterministic)
  const sample = decodeSample(input.sample.w, input.sample.h, input.sample.b64)
  const sal = downscaleGrid(computeSaliency(sample), HEATMAP_W)

  // 2. LLM semantic analysis (tier-dependent provider)
  const { result, provider, model } = await analyze(input.tier, input.screenshot, input.ctx)

  // 3. merge → heatmap
  const heatmap = mergeHeatmap(sal, result.attention.zones)
  return { result, heatmap, provider, model }
}

export { providerAvailable }
export type { Tier }
