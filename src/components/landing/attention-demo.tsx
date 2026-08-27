'use client'

import { useEffect, useState } from 'react'

type Mode = 'heatmap' | 'zone' | 'clean'

const MODES: { id: Mode; label: string }[] = [
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'zone', label: 'Zone' },
  { id: 'clean', label: 'Originale' },
]

/** Punti caldi della mappa: posizione %, dimensione, intensità. */
const BLOBS = [
  { x: 30, y: 22, w: 46, h: 30, c: 'var(--hot)', o: 0.85 },
  { x: 20, y: 52, w: 26, h: 18, c: 'var(--warm)', o: 0.6 },
  { x: 74, y: 30, w: 30, h: 22, c: 'var(--warm)', o: 0.45 },
  { x: 27, y: 88, w: 40, h: 16, c: 'var(--hot)', o: 0.5 },
  { x: 78, y: 72, w: 20, h: 14, c: 'var(--warm)', o: 0.3 },
]

/** Zone ancorate agli elementi, come le restituisce il motore. */
const ZONES = [
  { x: 6, y: 26, w: 52, h: 22, label: 'Headline', rank: 1 },
  { x: 6, y: 54, w: 24, h: 12, label: 'CTA principale', rank: 2, warn: true },
  { x: 64, y: 22, w: 30, h: 30, label: 'Immagine prodotto', rank: 3 },
  { x: 6, y: 84, w: 88, h: 12, label: 'Cookie banner', rank: 4, warn: true },
]

export function AttentionDemo() {
  const [mode, setMode] = useState<Mode>('heatmap')
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => {
      setMode((m) => (m === 'heatmap' ? 'zone' : m === 'zone' ? 'clean' : 'heatmap'))
    }, 3200)
    return () => clearInterval(t)
  }, [auto])

  const pick = (m: Mode) => { setAuto(false); setMode(m) }

  return (
    <div className="card overflow-hidden p-0 shadow-[0_24px_60px_-24px_rgba(28,25,23,.28)]">
      {/* barra browser */}
      <div className="flex items-center gap-3 border-b border-line bg-bg px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
        </div>
        <div className="flex-1 truncate rounded-md border border-line bg-panel px-2.5 py-1 text-[11px] text-muted">
          il-tuo-sito.com/prodotto
        </div>
        <div className="hidden gap-1 sm:flex">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => pick(m.id)}
              aria-pressed={mode === m.id}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                mode === m.id ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-panel hover:text-ink'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* viewport */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-panel">
        {/* wireframe della pagina analizzata */}
        <div className="absolute inset-0 p-[5%]">
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-[18%] rounded-full bg-line" />
            <div className="flex gap-2">
              <div className="h-2 w-8 rounded-full bg-line/70" />
              <div className="h-2 w-8 rounded-full bg-line/70" />
              <div className="h-5 w-14 rounded-md bg-brand-soft" />
            </div>
          </div>
          <div className="mt-[7%] flex gap-[5%]">
            <div className="w-[56%] space-y-3">
              <div className="h-5 w-[92%] rounded bg-line" />
              <div className="h-5 w-[68%] rounded bg-line" />
              <div className="mt-4 h-2 w-[84%] rounded-full bg-line/70" />
              <div className="h-2 w-[72%] rounded-full bg-line/70" />
              <div className="mt-5 h-8 w-[42%] rounded-lg bg-brand/85" />
            </div>
            <div className="h-[58%] w-[39%] rounded-xl bg-line/60" />
          </div>
          <div className="absolute inset-x-[5%] bottom-[4%] flex items-center justify-between rounded-xl border border-line bg-bg px-3 py-2.5">
            <div className="h-2 w-[46%] rounded-full bg-line" />
            <div className="h-5 w-16 rounded-md bg-line" />
          </div>
        </div>

        {/* heatmap */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{ opacity: mode === 'heatmap' ? 1 : 0 }}
          aria-hidden
        >
          {BLOBS.map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${b.x - b.w / 2}%`, top: `${b.y - b.h / 2}%`,
                width: `${b.w}%`, height: `${b.h}%`,
                background: `radial-gradient(closest-side, rgb(${b.c}) 0%, rgb(${b.c} / .55) 45%, transparent 72%)`,
                opacity: b.o, filter: 'blur(10px)',
              }}
            />
          ))}
        </div>

        {/* zone */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{ opacity: mode === 'zone' ? 1 : 0 }}
          aria-hidden
        >
          {ZONES.map((z, i) => (
            <div
              key={i}
              className="absolute rounded-lg border-2"
              style={{
                left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
                borderColor: z.warn ? 'rgb(var(--hot))' : 'rgb(var(--brand))',
                background: z.warn ? 'rgb(var(--hot) / .07)' : 'rgb(var(--brand) / .05)',
              }}
            >
              <span
                className="absolute -top-2.5 left-2 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold text-white sm:text-[10px]"
                style={{ background: z.warn ? 'rgb(var(--hot))' : 'rgb(var(--brand))' }}
              >
                {z.rank}. {z.label}
              </span>
            </div>
          ))}
        </div>

        {/* punteggio */}
        <div className="absolute right-3 top-3 rounded-xl border border-line bg-panel/95 px-3 py-2 text-center shadow-sm backdrop-blur">
          <div className="font-display text-xl font-extrabold leading-none text-ink">68</div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">conversione</div>
        </div>
      </div>

      {/* riga raccomandazioni */}
      <div className="grid gap-px border-t border-line bg-line sm:grid-cols-3">
        {[
          { t: 'Il cookie banner copre la CTA', s: 'Alta' },
          { t: 'Headline generica, nessun beneficio', s: 'Alta' },
          { t: 'Contrasto del bottone insufficiente', s: 'Media' },
        ].map((r) => (
          <div key={r.t} className="bg-panel px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
                style={{ background: r.s === 'Alta' ? 'rgb(var(--hot))' : 'rgb(var(--warm))' }}
              >
                {r.s}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-ink">{r.t}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
