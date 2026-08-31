import Link from 'next/link'
import { trackedPaths, heatmapData } from '@/lib/analytics/admin'
import { HeatmapViewer } from './heatmap-viewer'

export const dynamic = 'force-dynamic'

const nf = (n: number) => (n || 0).toLocaleString('it-IT')

export default async function HeatmapPage({ searchParams }: { searchParams: { path?: string; d?: string; dev?: string } }) {
  const days = [7, 30, 90].includes(Number(searchParams.d)) ? Number(searchParams.d) : 30
  const dev = ['all', 'desktop', 'mobile', 'tablet'].includes(searchParams.dev || '') ? searchParams.dev! : 'all'

  const paths = await trackedPaths(days)
  const selected = searchParams.path || paths[0]?.path || '/'
  const data = selected ? await heatmapData(selected, days, dev) : null

  const q = (over: Record<string, string>) => {
    const p = new URLSearchParams({ path: selected, d: String(days), dev, ...over })
    return `/analytics/heatmap?${p.toString()}`
  }

  return (
    <div className="space-y-5">
      {/* controlli */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">Pagina</label>
          <div className="flex flex-wrap gap-1.5">
            {paths.slice(0, 12).map((p) => (
              <Link key={p.path} href={q({ path: p.path })}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium ${p.path === selected ? 'bg-brand text-brand-fg' : 'border border-line text-muted hover:text-ink'}`}>
                <span className="max-w-[180px] truncate">{p.path}</span>
                <span className={`text-[10px] ${p.path === selected ? 'text-brand-fg/80' : 'text-muted'}`}>{nf(p.views)}</span>
              </Link>
            ))}
            {!paths.length && <span className="text-sm text-muted">Nessuna pagina tracciata ancora.</span>}
          </div>
        </div>
        <div className="ml-auto flex items-end gap-3">
          <Segment label="Periodo" options={[['7', '7g'], ['30', '30g'], ['90', '90g']]} active={String(days)} href={(v) => q({ d: v })} />
          <Segment label="Device" options={[['all', 'Tutti'], ['desktop', 'Desktop'], ['mobile', 'Mobile']]} active={dev} href={(v) => q({ dev: v })} />
        </div>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Click registrati" value={nf(data.clicks)} />
          <Stat label="Pagine viste" value={nf(data.pageviews)} />
          <Stat label="Campioni di scroll" value={nf(data.scrollSamples)} />
        </div>
      )}

      {data ? (
        <HeatmapViewer path={selected} points={data.points} scrollBuckets={data.scrollBuckets} />
      ) : (
        <div className="card p-6 text-sm text-muted">Seleziona una pagina per vedere la heatmap.</div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold">{value}</div>
    </div>
  )
}

function Segment({ label, options, active, href }: { label: string; options: [string, string][]; active: string; href: (v: string) => string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">{label}</label>
      <div className="inline-flex rounded-lg border border-line bg-panel p-0.5">
        {options.map(([v, lbl]) => (
          <Link key={v} href={href(v)} scroll={false}
            className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${v === active ? 'bg-brand text-brand-fg' : 'text-muted hover:text-ink'}`}>
            {lbl}
          </Link>
        ))}
      </div>
    </div>
  )
}
