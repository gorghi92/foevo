import Link from 'next/link'
import { Users, MousePointerClick, Eye, Clock, TrendingUp, TrendingDown, Radio, Globe, Monitor } from 'lucide-react'
import { analyticsOverview } from '@/lib/analytics/admin'
import { RangePicker } from './nav'

export const dynamic = 'force-dynamic'

const nf = (n: number) => (n || 0).toLocaleString('it-IT')
const pctf = (r: number) => `${(r * 100).toFixed(r >= 0.1 || r === 0 ? 0 : 1)}%`
const dur = (s: number) => {
  if (!s) return '0s'
  const m = Math.floor(s / 60), sec = s % 60
  return m ? `${m}m ${sec}s` : `${sec}s`
}
const agoLabel = (s: number) => (s < 60 ? `${s}s fa` : s < 3600 ? `${Math.floor(s / 60)}m fa` : `${Math.floor(s / 3600)}h fa`)

const FLAG: Record<string, string> = { IT: '🇮🇹', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', CH: '🇨🇭', NL: '🇳🇱', BE: '🇧🇪', AT: '🇦🇹', PT: '🇵🇹', IE: '🇮🇪', CA: '🇨🇦', BR: '🇧🇷', AU: '🇦🇺' }

export default async function AnalyticsDashboard({ searchParams }: { searchParams: { d?: string } }) {
  const days = [7, 30, 90].includes(Number(searchParams.d)) ? Number(searchParams.d) : 30
  const o = await analyticsOverview(days)

  const maxPv = Math.max(1, ...o.series.map((s) => s.pageviews))
  const empty = o.pageviews === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full ${o.activeNow ? 'animate-ping bg-green-400' : ''} opacity-75`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${o.activeNow ? 'bg-green-500' : 'bg-line'}`} />
          </span>
          <b className="text-ink">{o.activeNow}</b> {o.activeNow === 1 ? 'visitatore' : 'visitatori'} in questo momento
        </div>
        <RangePicker days={days} base="/analytics" />
      </div>

      {empty && (
        <div className="card p-5 text-sm text-muted">
          Nessun dato ancora in questa finestra. Il tracker raccoglie le visite non appena il sito riceve traffico —
          apri <code className="rounded bg-bg px-1">foevo.app</code> e ricarica tra qualche minuto.
        </div>
      )}

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Visitatori unici" value={nf(o.visitors)} delta={o.deltas.visitors} icon={<Users size={15} />} accent />
        <KPI label="Sessioni" value={nf(o.sessions)} delta={o.deltas.sessions} icon={<Radio size={15} />} />
        <KPI label="Pagine viste" value={nf(o.pageviews)} delta={o.deltas.pageviews} icon={<Eye size={15} />} />
        <KPI label="Durata media" value={dur(o.avgSessionSec)} icon={<Clock size={15} />} sub={`${o.pagesPerSession.toFixed(1)} pagine/sessione`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Frequenza di rimbalzo" value={pctf(o.bounceRate)} hint="sessioni con una sola pagina" />
        <Mini label="Pagine per sessione" value={o.pagesPerSession.toFixed(2)} />
        <Mini label="Pagine viste / visitatore" value={o.visitors ? (o.pageviews / o.visitors).toFixed(2) : '0'} />
      </div>

      {/* andamento */}
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><TrendingUp size={15} className="text-brand" /> Andamento · ultimi {days} giorni</div>
        <svg viewBox={`0 0 ${Math.max(o.series.length * 14, 60)} 130`} preserveAspectRatio="none" style={{ width: '100%', height: 160 }}>
          <line x1={0} y1={112} x2={o.series.length * 14} y2={112} style={{ stroke: 'rgb(var(--line))' }} strokeWidth={1} />
          {o.series.map((s, i) => {
            const h = Math.round((s.pageviews / maxPv) * 100)
            const hv = Math.round((s.visitors / maxPv) * 100)
            return (
              <g key={s.date}>
                <rect x={i * 14 + 2} y={112 - Math.max(1, h)} width={10} height={Math.max(1, h)} rx={2} style={{ fill: 'rgb(var(--brand))', opacity: 0.35 }}>
                  <title>{`${s.date}: ${nf(s.pageviews)} pagine viste`}</title>
                </rect>
                <rect x={i * 14 + 2} y={112 - Math.max(1, hv)} width={10} height={Math.max(1, hv)} rx={2} style={{ fill: 'rgb(var(--brand))' }}>
                  <title>{`${s.date}: ${nf(s.visitors)} visitatori`}</title>
                </rect>
              </g>
            )
          })}
        </svg>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
          <span>{o.series[0]?.date}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'rgb(var(--brand))' }} /> visitatori</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'rgb(var(--brand))', opacity: 0.35 }} /> pagine viste</span>
          </div>
          <span>oggi</span>
        </div>
      </div>

      {/* pagine top + sorgenti */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pagine più viste">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted"><th className="pb-2">Pagina</th><th className="pb-2 text-right">Viste</th><th className="pb-2 text-right">Visitatori</th><th className="pb-2 text-right">Tempo</th></tr></thead>
            <tbody>
              {o.topPages.map((p) => (
                <tr key={p.path} className="border-b border-line/50">
                  <td className="max-w-[220px] truncate py-2 font-medium">{p.path}</td>
                  <td className="py-2 text-right">{nf(p.views)}</td>
                  <td className="py-2 text-right text-muted">{nf(p.visitors)}</td>
                  <td className="py-2 text-right text-muted">{dur(p.avgSec)}</td>
                </tr>
              ))}
              {!o.topPages.length && <tr><td colSpan={4} className="py-4 text-center text-muted">—</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Sorgenti di traffico">
          <BarList items={o.sources.map((s) => ({ label: s.label, value: s.visitors, tag: s.kind === 'campaign' ? 'campagna' : s.kind === 'referral' ? 'referral' : undefined }))} />
        </Panel>
      </div>

      {/* device / browser / paesi */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={<><Monitor size={14} className="text-brand" /> Dispositivi</>}>
          <BarList items={o.devices.map((d) => ({ label: cap(d.label), value: d.value }))} />
        </Panel>
        <Panel title="Browser">
          <BarList items={o.browsers.map((d) => ({ label: d.label, value: d.value }))} />
        </Panel>
        <Panel title={<><Globe size={14} className="text-brand" /> Paesi</>}>
          <BarList items={o.countries.map((d) => ({ label: `${FLAG[d.label] || '🏳️'} ${d.label}`, value: d.value }))} />
        </Panel>
      </div>

      {/* attività recente */}
      <Panel title="Attività recente">
        <div className="space-y-1.5">
          {o.recent.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <span className="truncate font-medium">{r.path}</span>
              <span className="text-xs text-muted">· {cap(r.device)}{r.country ? ` · ${FLAG[r.country] || ''}${r.country}` : ''}</span>
              <span className="ml-auto text-xs text-muted">{agoLabel(r.ago)}</span>
            </div>
          ))}
          {!o.recent.length && <div className="text-sm text-muted">Nessuna visita recente.</div>}
        </div>
      </Panel>

      <p className="text-xs text-muted">
        Analytics first-party: dati raccolti e conservati solo sui nostri sistemi, nessun servizio terzo, nessun IP salvato.
        Per la heatmap dei click e la profondità di scroll di una pagina apri la scheda <Link href="/analytics/heatmap" className="text-brand hover:underline">Heatmap</Link>.
      </p>
    </div>
  )
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

function KPI({ label, value, sub, delta, icon, accent }: { label: string; value: string; sub?: string; delta?: number; icon?: React.ReactNode; accent?: boolean }) {
  const up = (delta ?? 0) >= 0
  return (
    <div className={`card p-4 ${accent ? 'border-brand/40 bg-brand-soft/40' : ''}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted">{icon} {label}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className="font-display text-2xl font-extrabold">{value}</div>
        {delta != null && (
          <span className={`mb-1 inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{Math.abs(delta)}%
          </span>
        )}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  )
}

function Mini({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted">{hint}</div>}
    </div>
  )
}

function Panel({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold">{title}</div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function BarList({ items }: { items: { label: string; value: number; tag?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  if (!items.length) return <div className="py-2 text-sm text-muted">—</div>
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1.5 truncate font-medium">
              {it.label}
              {it.tag && <span className="rounded border border-line px-1 text-[10px] uppercase tracking-wide text-muted">{it.tag}</span>}
            </span>
            <span className="ml-2 shrink-0 text-muted">{nf(it.value)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(3, Math.round((it.value / max) * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
