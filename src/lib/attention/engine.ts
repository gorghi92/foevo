/**
 * Orchestrates the hybrid attention analysis:
 *   CV saliency (from the extension's RGB sample)  +  LLM semantic zones
 *   → merged heatmap grid  +  structured CRO report.
 */
import { computeSaliency, decodeSample, downscaleGrid, type Grid } from './saliency'
import { analyze, providerAvailable, type Tier, type AnalyzeCtx } from './llm'
import type { AttentionResult, AttentionZone, PageElement } from './types'

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
  elements?: PageElement[] // real DOM rects from the extension (accurate zone boundaries)
}

/**
 * Blend the (pixel-accurate) CV saliency grid with anisotropic gaussian blobs
 * from the LLM's attention zones. The CV layer leads spatially — VLM bbox
 * coordinates on a tall full-page screenshot are only approximate, so the
 * zones nudge/weight the map rather than dominate it. Each blob matches its
 * box size on each axis (sigmaX from width, sigmaY from height) instead of one
 * huge isotropic sigma that smeared attention across half the page.
 */
function mergeHeatmap(sal: Grid, zones: AttentionZone[]): HeatmapData {
  const { w, h } = sal
  const zone = new Float32Array(w * h)
  let zmax = 0
  for (const z of zones) {
    const [zx, zy, zw, zh] = z.bbox
    const cx = (zx + zw / 2) * w
    const cy = (zy + zh / 2) * h
    // half-size of the box in grid cells (min 1.2 so tiny CTAs still register)
    const sx = Math.max(1.2, zw * w * 0.5)
    const sy = Math.max(1.2, zh * h * 0.5)
    const weight = z.score / 100
    const radX = Math.ceil(sx * 2.2)
    const radY = Math.ceil(sy * 2.2)
    for (let y = Math.max(0, Math.floor(cy - radY)); y < Math.min(h, cy + radY); y++) {
      for (let x = Math.max(0, Math.floor(cx - radX)); x < Math.min(w, cx + radX); x++) {
        const dx = (x - cx) / sx
        const dy = (y - cy) / sy
        const v = weight * Math.exp(-(dx * dx + dy * dy) / 2)
        const i = y * w + x
        zone[i] += v
        if (zone[i] > zmax) zmax = zone[i]
      }
    }
  }
  if (zmax > 0) for (let i = 0; i < zone.length; i++) zone[i] /= zmax

  const cells = new Float32Array(w * h)
  let max = 1e-6
  // CV-led: saliency carries the map, zones add semantic emphasis on top.
  const salWeight = zones.length ? 0.7 : 1.0
  const zoneWeight = zones.length ? 0.55 : 0
  for (let i = 0; i < cells.length; i++) {
    cells[i] = salWeight * sal.cells[i] + zoneWeight * zone[i]
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
  const { result, provider, model } = await analyze(input.tier, input.screenshot, input.ctx, input.elements)

  // 3. merge → heatmap
  const heatmap = mergeHeatmap(sal, result.attention.zones)
  return { result, heatmap, provider, model }
}

export { providerAvailable }
export type { Tier }
