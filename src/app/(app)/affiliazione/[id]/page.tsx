import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { affiliateDetail } from '@/lib/affiliate/admin'
import { referralLink } from '@/lib/affiliate/data'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { OverrideControl, StatusControl, ReferralsTable, CommissionsTable } from './detail'

export const dynamic = 'force-dynamic'

const money = (c: number) => `€${((c || 0) / 100).toFixed(2)}`

export default async function AdminAffiliateDetail({ params }: { params: { id: string } }) {
  const dict = getDictionary(getServerLocale())
  const t = dict.app.affiliazione.detail
  const loc = dict.common.dateLocale

  const d = await affiliateDetail(params.id)
  if (!d) notFound()
  const { aff, bank, referrals, comms, payouts } = d

  const earned = comms.filter((c: any) => c.status !== 'reversed').reduce((s: number, c: any) => s + c.amount_cents, 0)
  const available = comms.filter((c: any) => c.status === 'available').reduce((s: number, c: any) => s + c.amount_cents, 0)
  const paid = comms.filter((c: any) => c.status === 'paid').reduce((s: number, c: any) => s + c.amount_cents, 0)
  const conversions = referrals.filter((r: any) => r.status === 'converted').length

  return (
    <div className="space-y-6">
      <Link href="/affiliazione" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={15} /> {t.back}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">{aff.username}</h1>
          <p className="text-sm text-muted">{aff.full_name || '—'} · {aff.email}</p>
          <p className="mt-1 text-xs text-muted">
            {t.link} <code>{referralLink(aff.code)}</code>
            {aff.user_id && <> · <span className="rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">{t.alsoUser}</span></>}
          </p>
        </div>
        <StatusControl id={aff.id} status={aff.status} t={t} />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <KPI label={t.kpiClicks} value={String(aff.clicks)} />
        <KPI label={t.kpiCustomers} value={String(conversions)} />
        <KPI label={t.kpiEarned} value={money(earned)} />
        <KPI label={t.kpiAvailablePaid} value={`${money(available)} / ${money(paid)}`} />
      </div>

      <div className="card p-5">
        <div className="font-semibold">{t.overrideTitle}</div>
        <p className="mt-1 text-xs text-muted">{t.overrideSub}</p>
        <div className="mt-3"><OverrideControl id={aff.id} current={aff.commission_override_bps as number | null} t={t} /></div>
      </div>

      {bank && (
        <div className="card p-5 text-sm">
          <div className="font-semibold">{t.bankTitle}</div>
          <div className="mt-2 grid gap-1 text-muted sm:grid-cols-2">
            <div>{t.bankHolder}: <span className="text-ink">{bank.holder || '—'}</span></div>
            <div>{t.bankIban}: <span className="font-mono text-ink">{bank.iban || '—'}</span></div>
            <div>{t.bankName}: <span className="text-ink">{bank.bank_name || '—'}</span></div>
            <div>{t.bankCountry}: <span className="text-ink">{bank.country || '—'}</span></div>
          </div>
        </div>
      )}

      <div><h2 className="mb-2 font-display text-lg font-extrabold">{t.referralsTitle}</h2><ReferralsTable rows={referrals as any} t={t} dateLocale={loc} /></div>
      <div><h2 className="mb-2 font-display text-lg font-extrabold">{t.commissionsTitle}</h2><CommissionsTable rows={comms as any} t={t} dateLocale={loc} /></div>

      {payouts.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg font-extrabold">{t.payoutsTitle}</h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="p-3">{t.payColDate}</th><th className="p-3 text-right">{t.payColAmount}</th><th className="p-3">{t.payColStatus}</th><th className="p-3">{t.payColNote}</th>
              </tr></thead>
              <tbody>
                {payouts.map((p: any) => (
                  <tr key={p.id} className="border-b border-line/60">
                    <td className="p-3">{new Date(p.requested_at).toLocaleDateString(loc)}</td>
                    <td className="p-3 text-right font-semibold">{money(p.amount_cents)}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3 text-muted">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value }: { label: string; value: string }) {
  return <div className="card p-4"><div className="text-xs font-medium text-muted">{label}</div><div className="mt-1 font-display text-xl font-extrabold">{value}</div></div>
}
