'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Pt = { x: number; y: number }

/** Palette heatmap: blu → ciano → verde → giallo → rosso, indicizzata 0..255. */
function buildGradient(): Uint8ClampedArray {
  const c = document.createElement('canvas')
  c.width = 1; c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0.0, 'rgba(0,0,255,0)')
  g.addColorStop(0.25, 'blue')
  g.addColorStop(0.45, 'cyan')
  g.addColorStop(0.6, 'lime')
  g.addColorStop(0.8, 'yellow')
  g.addColorStop(1.0, 'red')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1, 256)
  return ctx.getImageData(0, 0, 1, 256).data
}

export function HeatmapViewer({ path, points, scrollBuckets }: { path: string; points: Pt[]; scrollBuckets: number[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gradRef = useRef<Uint8ClampedArray | null>(null)
  const [opacity, setOpacity] = useState(0.75)
  const [showPage, setShowPage] = useState(true)
  const [radius, setRadius] = useState(30)
  const [height, setHeight] = useState(1400)
  const [failed, setFailed] = useState(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current
    if (!canvas || !wrap) return
    const W = wrap.clientWidth, H = height
    if (!W || !H) return
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    if (!points.length) return

    // accumula intensità in scala di grigi
    const off = document.createElement('canvas'); off.width = W; off.height = H
    const octx = off.getContext('2d')!
    for (const p of points) {
      const x = p.x * W, y = p.y * H
      const g = octx.createRadialGradient(x, y, 0, x, y, radius)
      g.addColorStop(0, 'rgba(0,0,0,0.30)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      octx.fillStyle = g
      octx.beginPath(); octx.arc(x, y, radius, 0, Math.PI * 2); octx.fill()
    }
    // colora tramite la palette
    if (!gradRef.current) gradRef.current = buildGradient()
    const grad = gradRef.current
    const img = octx.getImageData(0, 0, W, H)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]
      if (a === 0) continue
      const off4 = a * 4
      d[i] = grad[off4]
      d[i + 1] = grad[off4 + 1]
      d[i + 2] = grad[off4 + 2]
      d[i + 3] = Math.min(255, a * 3)
    }
    ctx.putImageData(img, 0, 0)
  }, [points, radius, height])

  // altezza dalla pagina reale nell'iframe (stessa origine)
  const measure = useCallback(() => {
    const iframe = iframeRef.current
    try {
      const doc = iframe?.contentDocument
      const h = doc?.documentElement?.scrollHeight || doc?.body?.scrollHeight
      if (h && h > 200) { setHeight(h); setFailed(false); return }
    } catch { setFailed(true) }
  }, [])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [draw])

  const onLoad = () => {
    measure()
    // ricontrolla dopo il caricamento di font/immagini
    setTimeout(measure, 600)
    setTimeout(measure, 1500)
  }

  return (
    <div className="space-y-4">
      {/* controlli overlay */}
      <div className="card flex flex-wrap items-center gap-4 p-3 text-[13px]">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showPage} onChange={(e) => setShowPage(e.target.checked)} />
          Mostra la pagina
        </label>
        <label className="flex items-center gap-2">
          Intensità
          <input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2">
          Raggio
          <input type="range" min={14} max={60} step={2} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
        <span className="ml-auto text-xs text-muted">{points.length} click</span>
      </div>

      {failed && (
        <div className="card p-3 text-xs text-muted">
          Anteprima della pagina non caricabile qui: la heatmap è comunque disegnata sulla proporzione della pagina.
        </div>
      )}

      {/* viewer: iframe + canvas overlay */}
      <div ref={wrapRef} className="relative w-full overflow-hidden rounded-xl border border-line bg-white" style={{ height }}>
        {showPage && !failed && (
          <iframe
            ref={iframeRef}
            src={path}
            title="Anteprima pagina"
            onLoad={onLoad}
            className="absolute inset-0 h-full w-full"
            style={{ border: 0, background: '#fff' }}
            sandbox="allow-same-origin allow-scripts"
          />
        )}
        {!showPage && !failed && <iframe ref={iframeRef} src={path} title="misura" onLoad={onLoad} className="absolute h-px w-px opacity-0" aria-hidden />}
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity }} />
        {!points.length && (
          <div className="absolute inset-x-0 top-4 mx-auto w-fit rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            Nessun click registrato su questa pagina
          </div>
        )}
      </div>

      {/* profondità di scroll */}
      <div className="card p-5">
        <div className="mb-1 text-sm font-semibold">Profondità di scroll</div>
        <p className="mb-3 text-xs text-muted">Percentuale di visite che ha raggiunto ogni fascia di profondità della pagina.</p>
        <div className="space-y-1.5">
          {scrollBuckets.map((pct, i) => (
            <div key={i} className="flex items-center gap-3 text-[13px]">
              <span className="w-16 shrink-0 text-right text-muted">{i * 10}–{i * 10 + 10}%</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `hsl(${Math.round(200 - (i * 16))} 80% 55%)` }} />
              </div>
              <span className="w-10 shrink-0 text-right font-semibold">{pct}%</span>
            </div>
          ))}
          {!scrollBuckets.some((b) => b > 0) && <div className="text-sm text-muted">Ancora nessun dato di scroll per questa pagina.</div>}
        </div>
      </div>
    </div>
  )
}
