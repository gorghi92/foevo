import { createClient, getUser } from '@/lib/supabase/server'
import { resolveEntitlement, monthlyUsage } from '@/server/store'
import { Chrome, MousePointerClick, Gauge } from 'lucide-react'
import { PageHeader } from '@/components/app/ui'
import { CHROME_STORE_URL } from '@/lib/links'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { Rich } from '@/lib/i18n/rich'
import AnalysesGrid from './grid'

export const dynamic = 'force-dynamic'

// Le icone restano nel codice: non sono testo da tradurre, si accoppiano per indice.
const ONBOARDING_ICONS = [Chrome, MousePointerClick, Gauge]

/** Sostituisce i segnaposto {tier} / {used} / {quota} / {avg} nelle frasi tradotte. */
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m))

export default async function DashboardPage() {
  const locale = getServerLocale()
  const dict = getDictionary(locale)
  const t = dict.app.dashboard

  const user = await getUser()
  const supabase = createClient()
  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, url, title, status, tier, screenshot_url, score_conversion, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const [ent, used] = await Promise.all([resolveEntitlement(user!.id), monthlyUsage(user!.id)])
  const rows = analyses ?? []
  const done = rows.filter((a: any) => a.status === 'done')
  const avg = done.length
    ? Math.round(done.reduce((s: number, a: any) => s + (a.score_conversion || 0), 0) / done.length)
    : null

  // Il sottotitolo è una sequenza di pezzi uniti da " · ": così ogni lingua può
  // ordinare le parole a modo suo senza spezzare la frase nel JSX.
  const subtitleParts = [
    ent.source === 'none'
      ? t.subtitle.noPlan
      : fill(t.subtitle.plan, { tier: ent.tier === 'premium' ? 'Premium' : 'Base' }),
    ent.unlimited
      ? fill(t.subtitle.usageUnlimited, { used })
      : fill(t.subtitle.usage, { used, quota: ent.quota }),
  ]
  if (avg != null) subtitleParts.push(fill(t.subtitle.avgScore, { avg }))

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={<Rich text={subtitleParts.join(' · ')} />}
        actions={
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <Chrome size={15} /> {t.addToChrome}
          </a>
        }
      />

      {/* L'onboarding compare finché non c'è la prima analisi, poi sparisce. */}
      {rows.length === 0 && (
        <div className="mb-7 grid gap-4 md:grid-cols-3">
          {t.onboarding.map((s, i) => {
            const Icon = ONBOARDING_ICONS[i]
            return (
              <div key={s.title} className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="heat-dot grid h-8 w-8 place-items-center rounded-xl font-display text-[13px] font-extrabold text-white">
                    {i + 1}
                  </span>
                  {Icon && <Icon size={17} className="text-brand" />}
                </div>
                <h3 className="mt-3.5 text-[15px] font-bold leading-snug">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.body}</p>
              </div>
            )
          })}
        </div>
      )}

      <AnalysesGrid initial={rows} t={t} dateLocale={dict.common.dateLocale} />

      {rows.length > 0 && (
        <p className="mt-6 text-center text-xs text-muted">
          <Rich text={t.footer} />
        </p>
      )}
    </div>
  )
}
