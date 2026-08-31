import Link from 'next/link'
import { MousePointerClick, UserPlus, BadgeCheck, Repeat, TrendingUp } from 'lucide-react'
import { affiliateAnalytics, listAffiliates, unreadAlerts } from '@/lib/affiliate/admin'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { AlertsPanel } from './panels'

export const dynamic = 'force-dynamic'

const eur = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
const pctf = (r: number) => `${(r * 100).toFixed(r >= 0.1 || r === 0 ? 0 : 1)}%`

export default async function AffiliateDashboardPage() {
  const dict = getDictionary(getServerLocale())
  const t = dict.app.affiliazione
  const d = t.dashboard
  const loc = dict.common.dateLocale

  const [a, rows, alerts] = await Promise.all([affiliateAnalytics(), listAffiliates(), unreadAlerts()])
  const top = [...rows].sort((x, y) => y.earnedCents - x.earnedCents).slice(0, 5)
  const maxGross = Math.max(1, ...a.months.map((m) => m.grossCents))
  const maxConv = Math.max(1, ...a.months.map((m) => m.conversions))

  return (
    <div className="space-y-6">
      <AlertsPanel alerts={alerts.alerts as any} t={t.alerts} dateLocale={loc} />

      {/* KPI principali */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label={d.kpiActive} value={`${a.activeAffiliates}`} sub={d.kpiActiveSub.replace('{n}', String(a.totalAffiliates))} />
        <KPI label={d.kpiClicks} value={a.clicks.toLocaleString(loc)} />
        <KPI label={d.kpiCustomers} value={`${a.conversions}`} sub={d.kpiCustomersSub.replace('{n}', String(a.activeCustomers))} />
        <KPI label={d.kpiRevenue} value={eur(a.grossCents)} accent sub={d.kpiRevenueSub} />
      </div>

      {/* imbuto + rinnovi */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="text-sm font-semibold">{d.funnelTitle}</div>
          <p className="mt-0.5 text-xs text-muted">{d.funnelSub}</p>
          <div className="mt-4 space-y-3">
            <FunnelRow icon={<MousePointerClick size={15} />} label={d.funnelClicks} value={a.clicks} of={a.clicks} rate={null} locale={loc} />
            <FunnelRow icon={<UserPlus size={15} />} label={d.funnelSignups} value={a.conversions} of={a.clicks} rate={a.signupRate} rateLabel={d.funnelSignupRate} locale={loc} />
            <FunnelRow icon={<BadgeCheck size={15} />} label={d.funnelActive} value={a.activeCustomers} of={a.clicks} rate={a.activeRate} rateLabel={d.funnelActiveRate} locale={loc} />
          </div>
        </div>

        <div className="card p-5">
          <div className="text-sm font-semibold">{d.renewalsTitle}</div>
          <p className="mt-0.5 text-xs text-muted">{d.renewalsSub}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Mini label={d.firstPayments} value={`${a.firstPayments}`} />
            <Mini label={d.renewalPayments} value={`${a.renewalPayments}`} />
            <Mini label={d.renewalRate} value={pctf(a.renewalRate)} accent />
          </div>
          <p className="mt-3 text-xs text-muted">
            {d.renewalsNote}
          </p>
        </div>
      </div>

      {/* economia commissioni */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label={d.earned} value={eur(a.earnedCents)} />
        <KPI label={d.available} value={eur(a.availableCents)} accent />
        <KPI label={d.paid} value={eur(a.paidCents)} />
        <KPI label={d.reversed} value={eur(a.reversedCents)} muted />
      </div>

      {/* andamento 6 mesi */}
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold"><TrendingUp size={15} className="text-brand" /> {d.trendTitle}</div>
        <div className="mt-4 grid grid-cols-6 gap-2">
          {a.months.map((m) => (
            <div key={m.key} className="flex flex-col items-center gap-1">
              <div className="flex h-28 w-full items-end justify-center gap-1">
                <div className="w-2.5 rounded-t bg-brand/80" style={{ height: `${Math.round((m.grossCents / maxGross) * 100)}%` }} title={d.trendBarRevenue.replace('{v}', eur(m.grossCents))} />
                <div className="w-2.5 rounded-t bg-amber-400" style={{ height: `${Math.round((m.conversions / maxConv) * 100)}%` }} title={d.trendBarSignups.replace('{n}', String(m.conversions))} />
              </div>
              <div className="text-[11px] text-muted">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand/80" /> {d.legendRevenue}</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> {d.legendSignups}</span>
        </div>
      </div>

      {/* top affiliati */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-extrabold">{d.topTitle}</h2>
          <Link href="/affiliazione/lista" className="text-sm text-brand hover:underline">{d.topSeeAll}</Link>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">{d.colAffiliate}</th><th className="p-3 text-right">{d.colCustomers}</th>
              <th className="p-3 text-right">{d.colEarned}</th><th className="p-3 text-right">{d.colAvailable}</th>
            </tr></thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className="p-3"><Link href={`/affiliazione/${r.id}`} className="font-semibold text-brand hover:underline">{r.username}</Link></td>
                  <td className="p-3 text-right">{r.conversions}</td>
                  <td className="p-3 text-right font-semibold">{eur(r.earnedCents)}</td>
                  <td className="p-3 text-right">{eur(r.availableCents)}</td>
                </tr>
              ))}
              {top.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">{d.topEmpty}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, sub, accent, muted }: { label: string; value: string; sub?: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? 'border-brand/40 bg-brand-soft/40' : ''}`}>
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl font-extrabold ${muted ? 'text-muted' : ''}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  )
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? 'border-brand/40 bg-brand-soft/40' : 'border-line'}`}>
      <div className="font-display text-xl font-extrabold">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </div>
  )
}

function FunnelRow({ icon, label, value, of, rate, rateLabel, locale }: {
  icon: React.ReactNode; label: string; value: number; of: number; rate: number | null; rateLabel?: string; locale: string
}) {
  const w = of > 0 ? Math.max(4, Math.round((value / of) * 100)) : 4
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-ink">{icon} {label}</span>
        <span className="text-muted"><b className="text-ink">{value.toLocaleString(locale)}</b>{rate != null && rateLabel ? ` · ${(rate * 100).toFixed(rate >= 0.1 ? 0 : 1)}% ${rateLabel}` : ''}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full bg-brand" style={{ width: `${w}%` }} />
      </div>
    </div>
  )
}
