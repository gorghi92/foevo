import { createClient, getUser } from '@/lib/supabase/server'
import { resolveEntitlement, monthlyUsage } from '@/server/store'
import { Download } from 'lucide-react'
import { PageHeader, UsageMeter } from '@/components/app/ui'
import { DowngradeButton, CancelButton } from './billing-actions'
import { Checkout } from './checkout'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { Rich } from '@/lib/i18n/rich'

export const dynamic = 'force-dynamic'

const money = (cents: number, cur = 'EUR') => `${cur === 'EUR' ? '€' : cur + ' '}${((cents || 0) / 100).toFixed(2)}`

export default async function BillingPage() {
  const locale = getServerLocale()
  const dict = getDictionary(locale)
  const t = dict.app.billing

  const user = await getUser()
  const supabase = createClient()
  const [{ data: packages }, ent, used, { data: payments }, { data: profile }, { data: entRow }] = await Promise.all([
    supabase.from('packages').select('*').eq('active', true).order('order_index'),
    resolveEntitlement(user!.id),
    monthlyUsage(user!.id),
    supabase.from('payments').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('profiles').select('full_name').eq('id', user!.id).maybeSingle(),
    supabase.from('entitlements').select('current_period_end, cancel_at_period_end, source').eq('user_id', user!.id).maybeSingle(),
  ])

  const isWhop = entRow?.source === 'whop'
  const canceling = !!entRow?.cancel_at_period_end
  const renewal = entRow?.current_period_end ? new Date(entRow.current_period_end).toLocaleDateString(dict.common.dateLocale) : null

  const pkgs = (packages ?? []).map((p: any) => ({
    id: p.id, name: p.name, tier: p.tier, slug: p.slug,
    price_monthly: p.price_monthly, features: p.features ?? [], whop_plan_id: p.whop_plan_id,
  }))

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="min-w-[240px] flex-1">
          <div className="flex items-center gap-2.5">
            <span className="heat-dot h-9 w-9 rounded-xl" aria-hidden />
            <div>
              <div className="font-display text-lg font-extrabold leading-tight">
                {ent.source === 'none' ? t.noPlan : ent.tier === 'premium' ? 'Premium' : 'Base'}
              </div>
              <div className="text-xs text-muted">{t.currentPlanNote}</div>
            </div>
          </div>
          <div className="mt-4 max-w-xs">
            <UsageMeter t={dict.app.shell.usage} used={used} quota={ent.quota} unlimited={ent.unlimited} compact />
          </div>
          {canceling && renewal && (
            <div className="mt-1 text-sm font-medium text-amber-600">{t.canceling.replace('{date}', renewal)}</div>
          )}
          {!canceling && isWhop && renewal && (
            <div className="mt-1 text-xs text-muted">{t.nextRenewal.replace('{date}', renewal)}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold">{ent.status === 'none' ? t.statusInactive : ent.status}</span>
          {ent.tier === 'premium' && <DowngradeButton isWhop={isWhop} t={t.actions} />}
          {isWhop && !canceling && <CancelButton t={t.actions} />}
        </div>
      </div>

      <Checkout
        packages={pkgs}
        email={user!.email || ''}
        fullName={profile?.full_name || ''}
        currentTier={ent.tier}
        currentStatus={ent.status}
        t={t.plans}
      />
      <p className="mt-2 text-xs text-muted"><Rich text={t.vatNote} strongClass="" /></p>

      <h2 className="mt-10 font-display text-xl font-extrabold">{t.payments.title}</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">{t.payments.colDate}</th><th className="p-3">{t.payments.colDescription}</th><th className="p-3 text-right">{t.payments.colAmount}</th><th className="p-3">{t.payments.colStatus}</th><th className="p-3 text-right">{t.payments.colInvoice}</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((pay: any) => (
              <tr key={pay.id} className="border-b border-line/60">
                <td className="p-3">{new Date(pay.created_at).toLocaleDateString(dict.common.dateLocale)}</td>
                <td className="p-3">{pay.description || t.payments.defaultDescription}</td>
                <td className="p-3 text-right">{money(pay.amount_cents, pay.currency)} <span className="text-xs text-muted">{t.payments.vatIncluded}</span></td>
                <td className="p-3">{pay.status}</td>
                <td className="p-3 text-right"><a href={`/api/invoices/${pay.id}`} className="inline-flex items-center gap-1 font-semibold text-brand"><Download size={13} /> PDF</a></td>
              </tr>
            ))}
            {(!payments || payments.length === 0) && <tr><td colSpan={5} className="p-6 text-center text-muted">{t.payments.empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
