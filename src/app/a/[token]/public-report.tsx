'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { HeatmapCanvas, type ViewMode } from '@/components/heatmap-canvas'

const PRIO: Record<string, string> = { alta: '#dc2626', media: '#d97706', bassa: '#2563eb' }
const PORD: Record<string, number> = { alta: 0, media: 1, bassa: 2 }
const sc = (v: number) => (v >= 70 ? '#16a34a' : v >= 45 ? '#d97706' : '#dc2626')

function PriorityCallout({ recs }: { recs: any[] }) {
  if (!recs?.length) return null
  const top = recs.map((rec, i) => ({ rec, i })).sort((a, b) => (PORD[a.rec.priority] ?? 1) - (PORD[b.rec.priority] ?? 1)).slice(0, 3)
  return (
    <div className="card mt-4 flex flex-wrap items-center gap-2 border-l-4 border-brand p-3">
      <span className="text-sm font-semibold">⚡ Azioni prioritarie</span>
      <div className="flex flex-wrap gap-1.5">
        {top.map(({ rec, i }) => (
          <a key={i} href={`#rec-${i}`} className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-2 py-0.5 text-xs hover:border-brand">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PRIO[rec.priority] ?? '#666' }} />
            <span className="max-w-[220px] truncate">{rec.title}</span>
          </a>
        ))}
      </div>
      <a href="#raccomandazioni" className="btn btn-primary ml-auto px-3 py-1.5 text-[13px]">Tutte le raccomandazioni ↓</a>
    </div>
  )
}

function Gauge({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex-1 p-4 text-center" style={{ minWidth: 110 }}>
      <div className="font-display text-3xl font-extrabold" style={{ color: sc(value) }}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-line"><div style={{ width: `${value}%`, height: '100%', background: sc(value) }} /></div>
    </div>
  )
}

/** Read-only, publicly shareable, Foveo-branded analysis report. */
export function PublicReport({ data }: { data: any }) {
  const [mode, setMode] = useState<ViewMode>('heat')
  const [zones, setZones] = useState(true)
  const r = data.result

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Branded header */}
      <header className="sticky top-0 z-10 border-b border-line bg-panel/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block h-6 w-6 rounded-lg" style={{ background: 'linear-gradient(135deg,#7c5cff,#f0a020)' }} />
            <span className="text-lg font-extrabold tracking-tight">Foveo</span>
          </Link>
          <span className="hidden text-xs text-muted sm:inline">· Heatmap di attenzione &amp; analisi AI di conversione</span>
          <Link href="/signup" className="btn btn-primary ml-auto px-3 py-1.5 text-[13px]">Analizza la tua pagina →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold">{data.title || data.url || 'Analisi'}</div>
            {data.url && <a href={data.url} target="_blank" rel="noreferrer" className="text-xs text-muted">{String(data.url).replace(/^https?:\/\//, '')} <ExternalLink size={11} className="inline" /></a>}
          </div>
          <span className="rounded-md border border-line px-2.5 py-1 text-xs font-bold">{data.tier === 'premium' ? 'Premium' : 'Base'}</span>
        </div>

        {r && (
          <>
            <div className="mt-4 flex flex-wrap gap-3">
              <Gauge label="Conversione" value={r.scores?.conversion ?? 0} />
              <Gauge label="Attenzione" value={r.scores?.attentionAlignment ?? 0} />
              <Gauge label="Chiarezza" value={r.scores?.clarity ?? 0} />
              <Gauge label="CTA" value={r.scores?.cta ?? 0} />
            </div>

            <PriorityCallout recs={r.recommendations} />

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <div className="mb-2.5 flex flex-wrap gap-2">
                  {(['heat', 'focus', 'clean'] as ViewMode[]).map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={`btn ${mode === m ? 'btn-primary' : 'btn-ghost'} px-3 py-1.5 text-[13px]`}>
                      {m === 'heat' ? 'Heatmap' : m === 'focus' ? 'Focus' : 'Originale'}
                    </button>
                  ))}
                  <button onClick={() => setZones((v) => !v)} className={`btn ${zones ? 'btn-primary' : 'btn-ghost'} ml-auto px-3 py-1.5 text-[13px]`}>{zones ? 'Nascondi zone' : 'Mostra zone'}</button>
                </div>
                {data.screenshot_url
                  ? <HeatmapCanvas screenshotUrl={data.screenshot_url} heatmap={data.heatmap} mode={mode} zones={zones ? r.attention?.zones : undefined} />
                  : <div className="card p-8 text-center text-muted">Screenshot non disponibile.</div>}
              </div>

              <div className="flex flex-col gap-4">
                <div className="card p-4">
                  <div className="mb-1.5 font-semibold">Sintesi</div>
                  <p className="text-sm leading-relaxed">{r.summary || '—'}</p>
                </div>

                {r.attention?.zones?.length > 0 && (
                  <div className="card p-4">
                    <div className="mb-2 font-semibold">Zone di attenzione <span className="text-xs text-muted">· ordinate per impatto</span></div>
                    {[...r.attention.zones].sort((a: any, b: any) => b.score - a.score).slice(0, 8).map((z: any, i: number) => (
                      <div key={i} className={`py-1.5 ${i ? 'border-t border-line' : ''}`}>
                        <div className="flex items-center gap-2">
                          <b className="flex-1 truncate text-[13px]">{z.label}</b>
                          <span className="text-xs font-bold" style={{ color: sc(z.score) }}>{z.score}</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded bg-line"><div style={{ width: `${z.score}%`, height: '100%', background: sc(z.score) }} /></div>
                        {z.reason && <p className="mt-1 text-xs leading-snug text-muted">{z.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {(r.brand?.palette?.length > 0 || r.brand?.tone) && (
                  <div className="card p-4">
                    <div className="mb-2 font-semibold">Brand</div>
                    {r.brand.palette?.length > 0 && (
                      <div className="mb-2.5 flex flex-wrap gap-2">
                        {r.brand.palette.map((c: any, i: number) => (
                          <div key={i} className="text-center">
                            <div className="h-9 w-9 rounded-lg border border-black/10" style={{ background: c.hex?.startsWith('#') ? c.hex : `#${c.hex}` }} />
                            <div className="mt-0.5 text-[9px] text-muted">{c.role}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.brand.fonts?.length > 0 && <div className="text-[13px]"><b>Font:</b> {r.brand.fonts.map((f: any) => `${f.family} (${f.usage})`).join(', ')}</div>}
                    {r.brand.tone && <div className="mt-1 text-[13px]"><b>Tono:</b> {r.brand.tone}</div>}
                  </div>
                )}

                {r.cta?.length > 0 && (
                  <div className="card p-4">
                    <div className="mb-2 font-semibold">Call to action</div>
                    {r.cta.map((c: any, i: number) => (
                      <div key={i} className={`py-2 ${i ? 'border-t border-line' : ''}`}>
                        <div className="flex items-center gap-2">
                          {c.color && <span className="h-3.5 w-3.5 rounded border border-black/15" style={{ background: c.color.startsWith('#') ? c.color : `#${c.color}` }} />}
                          <b className="text-[13px]">{c.text}</b>
                        </div>
                        <div className="mt-1 text-xs text-muted">Contrasto {c.contrast} · Visibilità {c.visibility}</div>
                        {c.issues?.length > 0 && <ul className="mt-1 list-disc pl-4 text-xs">{c.issues.map((s: string, j: number) => <li key={j}>{s}</li>)}</ul>}
                      </div>
                    ))}
                  </div>
                )}

                {r.copy && (r.copy.headline || r.copy.issues?.length > 0 || r.copy.suggestions?.length > 0) && (
                  <div className="card p-4">
                    <div className="mb-2 font-semibold">Copy {typeof r.copy.clarity === 'number' && <span className="text-xs text-muted">· chiarezza {r.copy.clarity}</span>}</div>
                    {r.copy.headline && <div className="mb-1.5 text-[13px]"><b>Headline:</b> “{r.copy.headline}”</div>}
                    {r.copy.issues?.length > 0 && <><div className="text-xs font-semibold">Problemi</div><ul className="mb-2 mt-0.5 list-disc pl-4 text-xs">{r.copy.issues.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></>}
                    {r.copy.suggestions?.length > 0 && <><div className="text-xs font-semibold">Riscritture</div><ul className="mt-0.5 list-disc pl-4 text-xs">{r.copy.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></>}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {r.recommendations?.length > 0 && (
                <div id="raccomandazioni" className="card scroll-mt-20 p-4">
                  <div className="mb-2.5 font-semibold">Raccomandazioni</div>
                  {r.recommendations.map((rec: any, i: number) => (
                    <div key={i} id={`rec-${i}`} className={`scroll-mt-20 py-2.5 ${i ? 'border-t border-line' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white" style={{ background: PRIO[rec.priority] ?? '#666' }}>{rec.priority}</span>
                        <b className="text-[13.5px]">{rec.title}</b>
                      </div>
                      {rec.detail && <p className="mt-1 text-[13px] leading-snug">{rec.detail}</p>}
                      {rec.impact && <p className="mt-1 text-xs text-muted">↑ {rec.impact}</p>}
                    </div>
                  ))}
                </div>
              )}
              {r.frictions?.length > 0 && (
                <div className="card p-4">
                  <div className="mb-2.5 font-semibold">Frizioni alla conversione</div>
                  {r.frictions.map((f: any, i: number) => (
                    <div key={i} className={`py-2.5 ${i ? 'border-t border-line' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white" style={{ background: PRIO[f.severity] ?? '#666' }}>{f.severity}</span>
                        <b className="text-[13.5px]">{f.area}</b>
                      </div>
                      <p className="mt-1 text-[13px] leading-snug">{f.description}</p>
                      {f.fix && <p className="mt-1 text-xs text-muted">→ {f.fix}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Branded footer / CTA */}
        <div className="mt-8 rounded-2xl border border-line bg-panel p-6 text-center">
          <div className="text-lg font-extrabold">Vuoi la stessa analisi sulle tue pagine?</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">Foveo genera una heatmap di attenzione ibrida (computer-vision + AI) e un&apos;analisi orientata alla conversione, direttamente dal browser.</p>
          <Link href="/signup" className="btn btn-primary mt-4 px-5 py-2">Inizia gratis con Foveo</Link>
        </div>
        <p className="mt-6 text-center text-xs text-muted">Report generato con <Link href="/" className="font-semibold text-brand">Foveo</Link></p>
      </main>
    </div>
  )
}
