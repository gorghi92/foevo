import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Gift, Link2, Repeat, Wallet, TrendingUp, ArrowRight, Check } from 'lucide-react'
import { getAffiliateRules } from '@/lib/affiliate/commission'
import { getAffiliate } from '@/lib/affiliate/auth'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

export const dynamic = 'force-dynamic'

type Params = { params: { locale: string } }

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

export function generateMetadata({ params }: Params): Metadata {
  return getDictionary(pick(params.locale)).affiliates.become.meta
}

const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`

/** Sostituisce i segnaposto {rate} / {months} / {min} nelle frasi tradotte. */
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m))

// Le icone restano nel codice: non sono testo da tradurre, si accoppiano per indice.
const POINT_ICONS = [Repeat, Link2, Wallet, TrendingUp]

export default async function DiventaAffiliato({ params }: Params) {
  const locale = pick(params.locale)
  const t = getDictionary(locale).affiliates.become
  const p = (path: string) => localePath(locale, path)

  // Se è già loggato come affiliato, vai dritto al pannello.
  const aff = await getAffiliate()
  if (aff) redirect(p('/affiliati'))

  const rules = await getAffiliateRules()
  const baseRate = rules.baseBps
  const premRate = rules.premiumBps
  const rate = Math.max(baseRate, premRate)
  const sameRate = baseRate === premRate
  const minEur = (rules.minPayoutCents / 100).toFixed(0)
  const months = rules.commissionMonths
  const vars = { rate: pct(rate), months, min: minEur }
  // Il titolo evidenzia la percentuale, quindi la frase si spezza sul segnaposto.
  const [titleBefore, titleAfter] = fill(t.titleB, { months }).split('{rate}')

  return (
    <div className="space-y-12">
      {/* hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <Gift size={14} /> {t.badge}
        </div>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {t.titleA}<br />
          {titleBefore}
          {sameRate ? t.titleThe : t.titleUpTo}
          <span className="text-brand">{pct(rate)}</span>
          {titleAfter}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted">{t.sub}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href={p('/affiliati/registrati')} className="btn btn-primary px-5 py-2.5 text-sm">
            {t.ctaRegister} <ArrowRight size={16} />
          </Link>
          <Link href={p('/affiliati/accedi')} className="btn btn-ghost px-5 py-2.5 text-sm">
            {t.ctaLogin}
          </Link>
        </div>
      </div>

      {/* numeri chiave */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric value={`${sameRate ? '' : t.titleUpTo}${pct(rate)}`} label={fill(t.metricCommission, vars)} />
        <Metric value={`${minEur} €`} label={t.metricThreshold} />
        <Metric value={t.metricPayout} label={t.metricPayoutLabel} />
      </div>

      {/* perché */}
      <div>
        <h2 className="mb-5 text-center font-display text-2xl font-extrabold">{t.pointsTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {t.points.map((pt, i) => {
            const Icon = POINT_ICONS[i] ?? Repeat
            return (
              <div key={pt.title} className="card p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={18} /></span>
                  <div className="font-semibold">{pt.title}</div>
                </div>
                <p className="mt-2 text-sm text-muted">{fill(pt.body, vars)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* commissione per piano */}
      <div>
        <h2 className="mb-1 text-center font-display text-2xl font-extrabold">{t.ratesTitle}</h2>
        <p className="mb-5 text-center text-sm text-muted">{fill(t.ratesSub, vars)}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanRate name={t.planBase} rate={pct(baseRate)} caption={fill(t.rateCaption, vars)} />
          <PlanRate name={t.planPremium} rate={pct(premRate)} caption={fill(t.rateCaption, vars)} accent />
        </div>
      </div>

      {/* passi */}
      <div className="card p-6">
        <h2 className="mb-4 font-display text-xl font-extrabold">{t.stepsTitle}</h2>
        <ol className="space-y-3">
          {t.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-fg">{i + 1}</span>
              <span className="text-sm text-ink">{fill(s, vars)}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* già cliente */}
      <div className="rounded-xl border border-line bg-panel p-6 text-center">
        <p className="text-sm text-muted">
          <Check size={15} className="mr-1 inline text-brand" />
          <Rich text={t.alreadyCustomer} />
        </p>
      </div>

      {/* CTA finale */}
      <div className="text-center">
        <Link href={p('/affiliati/registrati')} className="btn btn-primary px-6 py-3 text-sm">
          {t.finalCta} <ArrowRight size={16} />
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

function PlanRate({ name, rate, caption, accent }: { name: string; rate: string; caption: string; accent?: boolean }) {
  return (
    <div className={`card p-6 text-center ${accent ? 'border-brand/40 bg-brand-soft/40' : ''}`}>
      <div className="text-sm font-semibold text-muted">{name}</div>
      <div className="mt-1 font-display text-4xl font-extrabold text-brand">{rate}</div>
      <div className="mt-1 text-xs text-muted">{caption}</div>
    </div>
  )
}
