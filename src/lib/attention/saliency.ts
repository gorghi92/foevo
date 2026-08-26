/**
 * Pure-TypeScript computer-vision saliency — no native deps.
 * Input: a small raw-RGB sample (from the extension). Output: a normalized
 * saliency grid (0..1) driven by local contrast + colour distinctiveness,
 * with a mild horizontal center bias. The semantic "smart" layer (LLM zones)
 * is blended on top in engine.ts.
 */

export type Sample = { w: number; h: number; rgb: Uint8Array }
export type Grid = { w: number; h: number; cells: Float32Array }

export function decodeSample(w: number, h: number, b64: string): Sample {
  const bin = Buffer.from(b64, 'base64')
  return { w, h, rgb: new Uint8Array(bin.buffer, bin.byteOffset, bin.byteLength) }
}

function luminance(rgb: Uint8Array, n: number): Float32Array {
  const L = new Float32Array(n)
  for (let i = 0, p = 0; i < n; i++, p += 3) {
    L[i] = (0.299 * rgb[p] + 0.587 * rgb[p + 1] + 0.114 * rgb[p + 2]) / 255
  }
  return L
}

/** Separable box blur (radius r), used as a cheap Gaussian approximation. */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  const win = 2 * r + 1
  // horizontal
  for (let y = 0; y < h; y++) {
    const row = y * w
    let acc = 0
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))]
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / win
      const add = src[row + Math.min(w - 1, x + r + 1)]
      const sub = src[row + Math.max(0, x - r)]
      acc += add - sub
    }
  }
  // vertical
  for (let x = 0; x < w; x++) {
    let acc = 0
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / win
      const add = tmp[Math.min(h - 1, y + r + 1) * w + x]
      const sub = tmp[Math.max(0, y - r) * w + x]
      acc += add - sub
    }
  }
  return out
}

export function computeSaliency(s: Sample): Grid {
  const { w, h, rgb } = s
  const n = w * h
  const L = luminance(rgb, n)

  // mean colour for distinctiveness
  let mr = 0, mg = 0, mb = 0
  for (let i = 0, p = 0; i < n; i++, p += 3) { mr += rgb[p]; mg += rgb[p + 1]; mb += rgb[p + 2] }
  mr /= n; mg /= n; mb /= n

  const raw = new Float32Array(n)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      // Sobel gradient magnitude on luminance
      const xm = Math.max(0, x - 1), xp = Math.min(w - 1, x + 1)
      const ym = Math.max(0, y - 1), yp = Math.min(h - 1, y + 1)
      const gx =
        (L[ym * w + xp] + 2 * L[i - x + xp] + L[yp * w + xp]) -
        (L[ym * w + xm] + 2 * L[i - x + xm] + L[yp * w + xm])
      const gy =
        (L[yp * w + xm] + 2 * L[yp * w + x] + L[yp * w + xp]) -
        (L[ym * w + xm] + 2 * L[ym * w + x] + L[ym * w + xp])
      const edge = Math.min(1, Math.hypot(gx, gy) / 4)
      // colour distinctiveness
      const p = i * 3
      const cd = Math.min(1, Math.hypot(rgb[p] - mr, rgb[p + 1] - mg, rgb[p + 2] - mb) / 180)
      raw[i] = 0.62 * edge + 0.38 * cd
    }
  }

  // smooth so single-pixel edges become attention blobs
  const r = Math.max(2, Math.round(w / 48))
  let sal = boxBlur(raw, w, h, r)

  // mild horizontal center bias (users scan the center column)
  const cx = (w - 1) / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / (w * 0.5)
      const hb = 0.75 + 0.25 * Math.exp(-(dx * dx) / 0.5)
      sal[y * w + x] *= hb
    }
  }

  // normalize 0..1 (percentile-ish: use max)
  let max = 1e-6
  for (let i = 0; i < n; i++) if (sal[i] > max) max = sal[i]
  for (let i = 0; i < n; i++) sal[i] = sal[i] / max

  return { w, h, cells: sal }
}

/** Average-pool a grid down to a target width, preserving aspect ratio. */
export function downscaleGrid(g: Grid, targetW: number): Grid {
  const scale = g.w / targetW
  const tw = targetW
  const th = Math.max(1, Math.round(g.h / scale))
  const out = new Float32Array(tw * th)
  for (let y = 0; y < th; y++) {
    const sy0 = Math.floor(y * scale), sy1 = Math.min(g.h, Math.floor((y + 1) * scale) + 1)
    for (let x = 0; x < tw; x++) {
      const sx0 = Math.floor(x * scale), sx1 = Math.min(g.w, Math.floor((x + 1) * scale) + 1)
      let acc = 0, cnt = 0
      for (let sy = sy0; sy < sy1; sy++) for (let sx = sx0; sx < sx1; sx++) { acc += g.cells[sy * g.w + sx]; cnt++ }
      out[y * tw + x] = cnt ? acc / cnt : 0
    }
  }
  return { w: tw, h: th, cells: out }
}
