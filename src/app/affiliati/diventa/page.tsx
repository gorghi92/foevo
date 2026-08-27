import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Gift, Link2, Repeat, Wallet, TrendingUp, ArrowRight, Check } from 'lucide-react'
import { getAffiliateRules } from '@/lib/affiliate/commission'
import { getAffiliate } from '@/lib/affiliate/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Diventa un affiliato Foevo — guadagna consigliando Foevo',
  description:
    'Promuovi Foevo con il tuo link personale e guadagna una commissione ricorrente su ogni cliente che porti, per i primi 12 mesi. Pagamenti via bonifico.',
}

const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`

export default async function DiventaAffiliato() {
  // Se è già loggato come affiliato, vai dritto al pannello.
  const aff = await getAffiliate()
  if (aff) redirect('/affiliati')

  const rules = await getAffiliateRules()
  const rate = Math.max(rules.baseBps, rules.premiumBps)
  const minEur = (rules.minPayoutCents / 100).toFixed(0)
  const months = rules.commissionMonths

  const punti = [
    {
      icon: Repeat,
      title: 'Guadagno ricorrente',
      body: `Non prendi la commissione una volta sola: la incassi su ogni rinnovo del cliente, per i primi ${months} mesi del suo abbonamento.`,
    },
    {
      icon: Link2,
      title: 'Un link solo tuo',
      body: 'Ricevi un link personale unico. Chiunque si abbona passando da lì viene attribuito a te, in automatico.',
    },
    {
      icon: Wallet,
      title: 'Paghiamo in bonifico',
      body: `Richiedi il pagamento quando vuoi, dai ${minEur} € di saldo disponibile. Inserisci l’IBAN e ci pensiamo noi.`,
    },
    {
      icon: TrendingUp,
      title: 'Tutto tracciato',
      body: 'Click, clienti portati, commissioni maturate e disponibili: li vedi in tempo reale dal tuo pannello.',
    },
  ]

  const steps = [
    'Ti registri e ricevi il tuo link personale.',
    'Condividi il link dove vuoi: social, newsletter, community, DM.',
    `Chi si abbona dal tuo link ti fa guadagnare il ${pct(rate)} per ${months} mesi.`,
    `Al raggiungimento dei ${minEur} € richiedi il bonifico.`,
  ]

  return (
    <div className="space-y-12">
      {/* hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <Gift size={14} /> Programma affiliazione
        </div>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Consiglia Foevo.<br />Guadagna il <span className="text-brand">{pct(rate)}</span> per {months} mesi.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted">
          Ogni cliente che si abbona dal tuo link ti fa guadagnare una commissione ricorrente,
          su ogni suo rinnovo, per il primo anno. Iscrizione gratuita, nessun vincolo.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/affiliati/registrati" className="btn btn-primary px-5 py-2.5 text-sm">
            Diventa affiliato <ArrowRight size={16} />
          </Link>
          <Link href="/affiliati/accedi" className="btn btn-ghost px-5 py-2.5 text-sm">
            Ho già un account
          </Link>
        </div>
      </div>

      {/* numeri chiave */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric value={pct(rate)} label={`Commissione, per ${months} mesi`} />
        <Metric value={`${minEur} €`} label="Soglia minima di pagamento" />
        <Metric value="Bonifico" label="Come ti paghiamo" />
      </div>

      {/* perché */}
      <div>
        <h2 className="mb-5 text-center font-display text-2xl font-extrabold">Come funziona il guadagno</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {punti.map((p) => (
            <div key={p.title} className="card p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><p.icon size={18} /></span>
                <div className="font-semibold">{p.title}</div>
              </div>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* passi */}
      <div className="card p-6">
        <h2 className="mb-4 font-display text-xl font-extrabold">In 4 passi</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-fg">{i + 1}</span>
              <span className="text-sm text-ink">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* già cliente */}
      <div className="rounded-xl border border-line bg-panel p-6 text-center">
        <p className="text-sm text-muted">
          <Check size={15} className="mr-1 inline text-brand" />
          Sei già cliente Foevo? Puoi diventare affiliato anche dal tuo account, nella sezione
          {' '}<b className="text-ink">“Invita e guadagna”</b>.
        </p>
      </div>

      {/* CTA finale */}
      <div className="text-center">
        <Link href="/affiliati/registrati" className="btn btn-primary px-6 py-3 text-sm">
          Crea il mio account affiliato <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="font-display text-3xl font-extrabold text-brand">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted">{label}</div>
    </div>
  )
}
