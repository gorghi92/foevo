'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HeatmapCanvas, type ViewMode } from '@/components/heatmap-canvas'

const PRIO: Record<string, string> = { alta: '#dc2626', media: '#d97706', bassa: '#2563eb' }
const sc = (v: number) => (v >= 70 ? '#16a34a' : v >= 45 ? '#d97706' : '#dc2626')

function Gauge({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex-1 p-4 text-center" style={{ minWidth: 120 }}>
      <div className="font-display text-3xl font-extrabold" style={{ color: sc(value) }}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-line"><div style={{ width: `${value}%`, height: '100%', background: sc(value) }} /></div>
    </div>
  )
}

export default function Report({ initial }: { initial: any }) {
  const [data, setData] = useState<any>(initial)
  const [mode, setMode] = useState<ViewMode>('heat')
  const [zones, setZones] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (data.status !== 'processing') return
    const t = setInterval(async () => {
      const { data: row } = await supabase.from('analyses').select('*').eq('id', data.id).maybeSingle()
      if (row) setData(row)
      if (row && row.status !== 'processing') clearInterval(t)
    }, 2500)
    return () => clearInterval(t)
  }, [data.status, data.id, supabase])

  const r = data.result

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard" className="btn btn-ghost"><ArrowLeft size={15} /> Analisi</Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold">{data.title || data.url}</div>
          {data.url && <a href={data.url} target="_blank" rel="noreferrer" className="text-xs text-muted">{String(data.url).replace(/^https?:\/\//, '')} <ExternalLink size={11} className="inline" /></a>}
        </div>
        <span className="rounded-md border border-line px-2.5 py-1 text-xs font-bold">{data.tier === 'premium' ? 'Premium · Claude' : 'Base · Qwen'}</span>
      </div>

      {data.status === 'processing' && (
        <div className="card mt-4 flex items-center gap-2 p-4 text-sm"><RefreshCw size={16} className="animate-spin" /> Analisi in corso… si aggiorna da sola.</div>
      )}
      {data.status === 'error' && (
        <div className="card mt-4 flex items-center gap-2 p-4 text-sm text-red-500"><AlertTriangle size={16} /> Errore: {data.error}</div>
      )}

      {data.status === 'done' && r && (
        <>
          <div className="mt-4 flex flex-wrap gap-3">
            <Gauge label="Conversione" value={r.scores?.conversion ?? 0} />
            <Gauge label="Attenzione" value={r.scores?.attentionAlignment ?? 0} />
            <Gauge label="Chiarezza" value={r.scores?.clarity ?? 0} />
            <Gauge label="CTA" value={r.scores?.cta ?? 0} />
          </div>

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
                {r.attention?.firstGlance?.length > 0 && (
                  <div className="mt-3 text-[13px]"><b>Primo sguardo:</b>{' '}
                    {r.attention.firstGlance.map((z: string, i: number) => <span key={i} className="mr-1.5 mt-1 inline-block rounded-full bg-bg px-2 py-0.5 text-xs">{i + 1}. {z}</span>)}
                  </div>
                )}
              </div>

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
              <div className="card p-4">
                <div className="mb-2.5 font-semibold">Raccomandazioni</div>
                {r.recommendations.map((rec: any, i: number) => (
                  <div key={i} className={`py-2.5 ${i ? 'border-t border-line' : ''}`}>
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
    </div>
  )
}
