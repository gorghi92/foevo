'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, RefreshCw, AlertTriangle, Share2, Check, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

function Gauge({ label, value, primary = false }: { label: string; value: number; primary?: boolean }) {
  return (
    <div className={`card flex-1 p-5 ${primary ? 'heat-frame border-transparent' : ''}`} style={{ minWidth: 140 }}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-display text-[2.1rem] font-extrabold leading-none" style={{ color: sc(value) }}>{value}</span>
        <span className="text-xs text-muted">/ 100</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, value)}%`, background: sc(value) }} />
      </div>
    </div>
  )
}

export default function Report({ initial }: { initial: any }) {
  const [data, setData] = useState<any>(initial)
  const [mode, setMode] = useState<ViewMode>('heat')
  const [zones, setZones] = useState(true)
  const [sharePath, setSharePath] = useState<string>(initial?.share_token ? `/a/${initial.share_token}` : '')
  const [origin, setOrigin] = useState('')
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => { setOrigin(window.location.origin) }, [])
  const shareUrl = useMemo(() => (sharePath ? origin + sharePath : ''), [origin, sharePath])

  async function share() {
    setSharing(true)
    try {
      const res = await fetch(`/api/analyses/${data.id}/share`, { method: 'POST' })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Errore condivisione')
      setSharePath(j.path)
      try { await navigator.clipboard.writeText(window.location.origin + j.path); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
    } catch (e) {
      alert(String((e as Error).message || e))
    } finally {
      setSharing(false)
    }
  }
  async function copyShare() {
    try { await navigator.clipboard.writeText(shareUrl || window.location.origin + sharePath); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }

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
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink">
        <ArrowLeft size={15} /> Tutte le analisi
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2.5">
            <span className="heat-rule h-[3px] w-6 rounded-full" aria-hidden />
            <span className="label text-brand">Report</span>
          </div>
          <h1 className="truncate font-display text-[1.7rem] font-extrabold leading-tight tracking-tight md:text-3xl">
            {data.title || data.url}
          </h1>
          {data.url && (
            <a href={data.url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm text-muted transition hover:text-brand">
              {String(data.url).replace(/^https?:\/\//, '')} <ExternalLink size={12} />
            </a>
          )}
        </div>
        <span className="rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-bold">{data.tier === 'premium' ? 'Premium' : 'Base'}</span>
        {data.status === 'done' && (
          sharePath
            ? <button onClick={copyShare} className="btn btn-ghost px-3 py-1.5 text-[13px]" title={shareUrl}>{copied ? <><Check size={14} /> Copiato</> : <><Copy size={14} /> Link pubblico</>}</button>
            : <button onClick={share} disabled={sharing} className="btn btn-primary px-3 py-1.5 text-[13px]"><Share2 size={14} /> {sharing ? 'Creo link…' : 'Condividi'}</button>
        )}
      </div>
      {sharePath && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-bg px-3 py-2 text-xs">
          <Share2 size={13} className="shrink-0 text-brand" />
          <span className="flex-1 truncate">Link pubblico attivo: <a href={shareUrl || sharePath} target="_blank" rel="noreferrer" className="font-semibold text-brand">{(shareUrl || sharePath).replace(/^https?:\/\//, '')}</a></span>
          <button onClick={copyShare} className="shrink-0 font-semibold text-brand">{copied ? 'Copiato ✓' : 'Copia'}</button>
        </div>
      )}

      {data.status === 'processing' && (
        <div className="card mt-4 flex items-center gap-2 p-4 text-sm"><RefreshCw size={16} className="animate-spin" /> Analisi in corso… si aggiorna da sola.</div>
      )}
      {data.status === 'error' && (
        <div className="card mt-4 flex items-center gap-2 p-4 text-sm text-red-500"><AlertTriangle size={16} /> Errore: {data.error}</div>
      )}

      {data.status === 'done' && r && (
        <>
          <div className="mt-6 flex flex-wrap gap-4">
            <Gauge label="Conversione" value={r.scores?.conversion ?? 0} primary />
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
              <p className="mt-2 text-[11px] leading-snug text-muted">
                La heatmap deriva dai pixel reali (contrasto + colore); i riquadri delle zone sono
                <b> stime dell&apos;AI</b> e su pagine molto lunghe la posizione può non essere pixel-perfect —
                usa la lista <b>Zone di attenzione</b> a lato per l&apos;interpretazione.
              </p>
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
              <div id="raccomandazioni" className="card scroll-mt-4 p-4">
                <div className="mb-2.5 font-semibold">Raccomandazioni</div>
                {r.recommendations.map((rec: any, i: number) => (
                  <div key={i} id={`rec-${i}`} className={`scroll-mt-4 py-2.5 ${i ? 'border-t border-line' : ''}`}>
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
