import { createClient, getUser } from '@/lib/supabase/server'
import { resolveEntitlement, monthlyUsage } from '@/server/store'
import { Check, Download } from 'lucide-react'
import { DowngradeButton } from './billing-actions'

export const dynamic = 'force-dynamic'

const money = (cents: number, cur = 'EUR') => `${cur === 'EUR' ? '€' : cur + ' '}${((cents || 0) / 100).toFixed(2)}`

export default async function BillingPage() {
  const user = await getUser()
  const supabase = createClient()
  const [{ data: packages }, ent, used, { data: payments }] = await Promise.all([
    supabase.from('packages').select('*').eq('active', true).order('order_index'),
    resolveEntitlement(user!.id),
    monthlyUsage(user!.id),
    supabase.from('payments').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50),
  ])

  const checkoutBase = process.env.WHOP_CHECKOUT_BASE || ''
  const checkoutUrl = (planId: string | null) =>
    planId && checkoutBase ? `${checkoutBase.replace(/\/$/, '')}/${planId}?email=${encodeURIComponent(user!.email || '')}` : null

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Piano &amp; fatturazione</h1>

      <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="font-semibold">Piano attuale: {ent.tier === 'premium' ? 'Premium' : 'Base'}{ent.source === 'trial' ? ' (prova)' : ''}</div>
          <div className="text-sm text-muted">Uso questo mese: {used} / {ent.unlimited ? '∞' : ent.quota} · pagamenti gestiti da Whop</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold">{ent.status}</span>
          {ent.tier === 'premium' && <DowngradeButton isWhop={ent.source === 'whop'} />}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {(packages ?? []).map((p: any) => {
          const url = checkoutUrl(p.whop_plan_id)
          return (
            <div key={p.id} className={`card p-6 ${p.tier === 'premium' ? 'ring-1 ring-brand' : ''}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <span className="label">{p.tier === 'premium' ? 'Avanzato' : 'Standard'}</span>
              </div>
              <p className="mt-2">
                <span className="font-display text-3xl font-extrabold">€{(p.price_monthly / 100).toFixed(0)}</span>
                <span className="text-muted"> + IVA/mese</span>
              </p>
              <ul className="mt-4 space-y-2">
                {(p.features ?? []).map((f: string) => <li key={f} className="flex items-start gap-2 text-sm"><Check size={15} className="mt-0.5 text-brand" /> {f}</li>)}
              </ul>
              {url
                ? <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary mt-5 w-full">Attiva su Whop</a>
                : <button disabled className="btn btn-ghost mt-5 w-full opacity-60">Checkout non configurato</button>}
            </div>
          )
        })}
      </div>
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
