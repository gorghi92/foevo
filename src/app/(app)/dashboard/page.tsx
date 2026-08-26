import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import { resolveEntitlement, monthlyUsage } from '@/server/store'
import { KeyRound, Chrome } from 'lucide-react'
import AnalysesGrid from './grid'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getUser()
  const supabase = createClient()
  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, url, title, status, tier, screenshot_url, score_conversion, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const [ent, used] = await Promise.all([resolveEntitlement(user!.id), monthlyUsage(user!.id)])
  const quota = ent.unlimited ? '∞' : ent.quota

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Le mie analisi</h1>
          <p className="mt-1 text-sm text-muted">
            Piano {ent.tier === 'premium' ? 'Premium (Claude)' : 'Base (Qwen)'}{ent.source === 'trial' ? ' · prova' : ''} · questo mese <b className="text-ink">{used}</b>/{quota}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link href="/settings/api-keys" className="btn btn-ghost"><KeyRound size={15} /> API key</Link>
          <a href="/extension/foveo-attention.zip" download className="btn btn-primary"><Chrome size={15} /> Estensione</a>
        </div>
      </div>

      <div className="card mb-6 p-5">
        <p className="text-sm font-semibold">Come iniziare</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Crea una <Link href="/settings/api-keys" className="text-brand">API key</Link> e installala nell’estensione.</li>
          <li>Apri una landing o scheda prodotto e premi <b>Analizza</b>.</li>
          <li>La heatmap e il report compaiono qui.</li>
        </ol>
      </div>

      <AnalysesGrid initial={analyses ?? []} />
    </div>
  )
}
