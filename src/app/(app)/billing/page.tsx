import { createClient, getUser } from '@/lib/supabase/server'
import { resolveEntitlement, monthlyUsage } from '@/server/store'
import { Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const user = await getUser()
  const supabase = createClient()
  const { data: packages } = await supabase.from('packages').select('*').eq('active', true).order('order_index')
  const [ent, used] = await Promise.all([resolveEntitlement(user!.id), monthlyUsage(user!.id)])

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
        <span className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold">{ent.status}</span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {(packages ?? []).map((p: any) => {
          const url = checkoutUrl(p.whop_plan_id)
          return (
            <div key={p.id} className={`card p-6 ${p.tier === 'premium' ? 'ring-1 ring-brand' : ''}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <span className="label">{p.tier}</span>
              </div>
              <p className="mt-2"><span className="font-display text-3xl font-extrabold">€{(p.price_monthly / 100).toFixed(0)}</span><span className="text-muted">/mese</span></p>
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
      <p className="mt-4 text-xs text-muted">Nota operatore: imposta <code>WHOP_CHECKOUT_BASE</code> e il <code>whop_plan_id</code> di ogni pacchetto (in Superadmin) per attivare i pulsanti.</p>
    </div>
  )
}
