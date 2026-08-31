import Link from 'next/link'
import { trackedPaths, heatmapData } from '@/lib/analytics/admin'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { HeatmapViewer } from './heatmap-viewer'

export const dynamic = 'force-dynamic'

const nf = (n: number, loc: string) => (n || 0).toLocaleString(loc)

export default async function HeatmapPage({ searchParams }: { searchParams: { path?: string; d?: string; dev?: string } }) {
  const dict = getDictionary(getServerLocale())
  const t = dict.app.analytics.heatmap
  const loc = dict.common.dateLocale
  const dayS = dict.app.analytics.daysSuffix

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
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">{t.pageLabel}</label>
          <div className="flex flex-wrap gap-1.5">
            {paths.slice(0, 12).map((p) => (
              <Link key={p.path} href={q({ path: p.path })}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium ${p.path === selected ? 'bg-brand text-brand-fg' : 'border border-line text-muted hover:text-ink'}`}>
                <span className="max-w-[180px] truncate">{p.path}</span>
                <span className={`text-[10px] ${p.path === selected ? 'text-brand-fg/80' : 'text-muted'}`}>{nf(p.views, loc)}</span>
              </Link>
            ))}
            {!paths.length && <span className="text-sm text-muted">{t.noPages}</span>}
          </div>
        </div>
        <div className="ml-auto flex items-end gap-3">
          <Segment label={t.periodLabel} options={[['7', `7${dayS}`], ['30', `30${dayS}`], ['90', `90${dayS}`]]} active={String(days)} href={(v) => q({ d: v })} />
          <Segment label={t.deviceLabel} options={[['all', t.deviceAll], ['desktop', t.deviceDesktop], ['mobile', t.deviceMobile]]} active={dev} href={(v) => q({ dev: v })} />
        </div>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label={t.statClicks} value={nf(data.clicks, loc)} />
          <Stat label={t.statPageviews} value={nf(data.pageviews, loc)} />
          <Stat label={t.statScrollSamples} value={nf(data.scrollSamples, loc)} />
        </div>
      )}

      {data ? (
        <HeatmapViewer path={selected} points={data.points} scrollBuckets={data.scrollBuckets} t={t} />
      ) : (
        <div className="card p-6 text-sm text-muted">{t.pickPage}</div>
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
