'use client'

import { useEffect, useRef, useState } from 'react'

export type Heatmap = { w: number; h: number; cells: number[] }
export type ViewMode = 'heat' | 'focus' | 'clean'

function colormap(v: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [40, 60, 220], [0, 200, 255], [0, 220, 90], [255, 220, 0], [255, 60, 30],
  ]
  const x = Math.min(1, Math.max(0, v)) * (stops.length - 1)
  const i = Math.floor(x), f = x - i
  const a = stops[i], b = stops[Math.min(stops.length - 1, i + 1)]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

/** Renders a heatmap grid over a screenshot, with heat / focus / clean modes. */
export function HeatmapCanvas({
  screenshotUrl, heatmap, mode = 'heat', intensity = 0.85, zones,
}: {
  screenshotUrl: string
  heatmap: Heatmap | null
  mode?: ViewMode
  intensity?: number
  zones?: { label: string; bbox: [number, number, number, number]; score: number }[]
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const draw = () => {
      const img = imgRef.current, canvas = canvasRef.current
      if (!img || !canvas || !img.complete || img.naturalWidth === 0) return
      const rw = img.clientWidth, rh = img.clientHeight
      if (!rw || !rh) return
      canvas.width = rw
      canvas.height = rh
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, rw, rh)
      if (mode === 'clean' || !heatmap) return

      // render grid to an offscreen canvas, then scale up smoothly
      const { w, h, cells } = heatmap
      const off = document.createElement('canvas')
      off.width = w; off.height = h
      const octx = off.getContext('2d')!
      const imgData = octx.createImageData(w, h)
      for (let i = 0; i < cells.length; i++) {
        const v = cells[i]
        const p = i * 4
        if (mode === 'focus') {
          // dark mask that clears where attention is high
          imgData.data[p] = 10; imgData.data[p + 1] = 10; imgData.data[p + 2] = 16
          imgData.data[p + 3] = Math.round((1 - Math.min(1, v * 1.15)) * 205)
        } else {
          const [r, g, b] = colormap(v)
          imgData.data[p] = r; imgData.data[p + 1] = g; imgData.data[p + 2] = b
          imgData.data[p + 3] = Math.round(Math.pow(v, 0.75) * 235 * intensity)
        }
      }
      octx.putImageData(imgData, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(off, 0, 0, w, h, 0, 0, rw, rh)
    }
    draw()
    const ro = new ResizeObserver(draw)
    if (imgRef.current) ro.observe(imgRef.current)
    return () => ro.disconnect()
  }, [heatmap, mode, intensity, ready])

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={screenshotUrl}
        alt="Screenshot analizzato"
        onLoad={() => setReady(true)}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: 12 }} />
      {mode !== 'clean' && zones?.map((z, i) => (
        <div key={i} title={`${z.label} · ${z.score}`}
          style={{
            position: 'absolute', left: `${z.bbox[0] * 100}%`, top: `${z.bbox[1] * 100}%`,
            width: `${z.bbox[2] * 100}%`, height: `${z.bbox[3] * 100}%`,
            border: '1.5px dashed rgba(255,255,255,.55)', borderRadius: 6, pointerEvents: 'none',
          }}>
          <span style={{
            position: 'absolute', top: -18, left: 0, fontSize: 10, fontWeight: 700,
            background: 'rgba(17,17,25,.8)', color: '#fff', padding: '1px 5px', borderRadius: 5, whiteSpace: 'nowrap',
          }}>{z.label} · {z.score}</span>
        </div>
      ))}
    </div>
  )
}
