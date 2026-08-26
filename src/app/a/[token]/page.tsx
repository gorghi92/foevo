import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { PublicReport } from './public-report'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function load(token: string) {
  const sc = createServiceClient()
  const { data } = await sc
    .from('analyses')
    .select('*')
    .eq('share_token', token)
    .eq('public', true)
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const data = await load(params.token)
  const title = data ? `Foveo · analisi di ${data.title || data.url || 'una pagina'}` : 'Foveo'
  return {
    title,
    description: data?.result?.summary || 'Heatmap di attenzione e analisi AI di conversione — Foveo.',
    robots: { index: false },
  }
}

export default async function PublicAnalysisPage({ params }: { params: { token: string } }) {
  const data = await load(params.token)
  if (!data || data.status !== 'done') notFound()
  return <PublicReport data={data} />
}
