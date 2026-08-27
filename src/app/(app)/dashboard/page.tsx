import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import { resolveEntitlement, monthlyUsage } from '@/server/store'
import { Chrome, MousePointerClick, Gauge } from 'lucide-react'
import { PageHeader } from '@/components/app/ui'
import AnalysesGrid from './grid'

export const dynamic = 'force-dynamic'

const ONBOARDING = [
  { icon: Chrome, t: 'Installa l’estensione', b: 'Scaricala qui sotto e caricala in Chrome seguendo la guida. Poi accedi con la tua email dalle impostazioni (⚙).' },
  { icon: MousePointerClick, t: 'Apri una pagina e premi Analizza', b: 'Landing, home o scheda prodotto: la cattura parte solo quando lo decidi tu.' },
  { icon: Gauge, t: 'Leggi il report', b: 'Heatmap, zone e azioni prioritizzate compaiono qui, pronte da mettere in pratica.' },
]

export default async function DashboardPage() {
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

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Area di lavoro"
        title="Le mie analisi"
        subtitle={
          <>
            Piano <b className="text-ink">{ent.tier === 'premium' ? 'Premium' : 'Base'}</b>
            {ent.source === 'trial' ? ' · prova' : ''} · {used}
            {ent.unlimited ? '' : ` di ${ent.quota}`} analisi questo mese
            {avg != null && <> · punteggio medio <b className="text-ink">{avg}</b></>}
          </>
        }
        actions={
          <a href="/extension/foveo-attention.zip" download className="btn btn-primary">
            <Chrome size={15} /> Scarica estensione
          </a>
        }
      />

      {/* L'onboarding compare finché non c'è la prima analisi, poi sparisce. */}
      {rows.length === 0 && (
        <div className="mb-7 grid gap-4 md:grid-cols-3">
          {ONBOARDING.map((s, i) => (
            <div key={s.t} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="heat-dot grid h-8 w-8 place-items-center rounded-xl font-display text-[13px] font-extrabold text-white">
                  {i + 1}
                </span>
                <s.icon size={17} className="text-brand" />
              </div>
              <h3 className="mt-3.5 text-[15px] font-bold leading-snug">{s.t}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.b}</p>
            </div>
          ))}
        </div>
      )}

      <AnalysesGrid initial={rows} />

      {rows.length > 0 && (
        <p className="mt-6 text-center text-xs text-muted">
          Le analisi si generano dall’estensione Chrome ·{' '}
          <Link href="/billing" className="font-semibold text-brand">gestisci il piano</Link>
        </p>
      )}
    </div>
  )
}
