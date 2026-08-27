import { createClient, getUser } from '@/lib/supabase/server'
import { resolveEntitlement, monthlyUsage } from '@/server/store'
import { Download } from 'lucide-react'
import { DowngradeButton, CancelButton } from './billing-actions'
import { Checkout } from './checkout'

export const dynamic = 'force-dynamic'

const money = (cents: number, cur = 'EUR') => `${cur === 'EUR' ? '€' : cur + ' '}${((cents || 0) / 100).toFixed(2)}`

export default async function BillingPage() {
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
  const renewal = entRow?.current_period_end ? new Date(entRow.current_period_end).toLocaleDateString('it-IT') : null

  const pkgs = (packages ?? []).map((p: any) => ({
    id: p.id, name: p.name, tier: p.tier, slug: p.slug,
    price_monthly: p.price_monthly, features: p.features ?? [], whop_plan_id: p.whop_plan_id,
  }))

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Piano &amp; fatturazione</h1>

      <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="font-semibold">Piano attuale: {ent.tier === 'premium' ? 'Premium' : 'Base'}{ent.source === 'trial' ? ' (prova)' : ''}</div>
          <div className="text-sm text-muted">Uso questo mese: {used} / {ent.unlimited ? '∞' : ent.quota} · pagamenti gestiti da Whop</div>
          {canceling && renewal && (
            <div className="mt-1 text-sm font-medium text-amber-600">Abbonamento annullato — attivo fino al {renewal}, poi non verrà rinnovato.</div>
          )}
          {!canceling && isWhop && renewal && (
            <div className="mt-1 text-xs text-muted">Prossimo rinnovo: {renewal}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold">{ent.status}</span>
          {ent.tier === 'premium' && <DowngradeButton isWhop={isWhop} />}
          {isWhop && !canceling && <CancelButton />}
        </div>
      </div>

      <Checkout
        packages={pkgs}
        email={user!.email || ''}
        fullName={profile?.full_name || ''}
        currentTier={ent.tier}
        currentStatus={ent.status}
      />
      <p className="mt-2 text-xs text-muted">I prezzi sono <b>IVA esclusa</b>: l’IVA/imposta viene calcolata da Whop in base al tuo paese al momento del pagamento.</p>

      <h2 className="mt-8 text-lg font-bold">Storico pagamenti</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Data</th><th className="p-3">Descrizione</th><th className="p-3 text-right">Importo</th><th className="p-3">Stato</th><th className="p-3 text-right">Fattura</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((pay: any) => (
              <tr key={pay.id} className="border-b border-line/60">
                <td className="p-3">{new Date(pay.created_at).toLocaleDateString('it-IT')}</td>
                <td className="p-3">{pay.description || 'Abbonamento Foevo'}</td>
                <td className="p-3 text-right">{money(pay.amount_cents, pay.currency)} <span className="text-xs text-muted">(IVA incl.)</span></td>
                <td className="p-3">{pay.status}</td>
                <td className="p-3 text-right"><a href={`/api/invoices/${pay.id}`} className="inline-flex items-center gap-1 font-semibold text-brand"><Download size={13} /> PDF</a></td>
              </tr>
            ))}
            {(!payments || payments.length === 0) && <tr><td colSpan={5} className="p-6 text-center text-muted">Nessun pagamento registrato. Compaiono qui dopo l’attivazione su Whop.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
