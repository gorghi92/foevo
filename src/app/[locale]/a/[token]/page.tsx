import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { PublicReport } from './public-report'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: { locale: string; token: string } }

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

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

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = getDictionary(pick(params.locale)).report.meta
  const data = await load(params.token)
  const title = data ? `${t.titlePrefix} ${data.title || data.url || t.fallbackTarget}` : 'Foevo'
  return {
    title,
    description: data?.result?.summary || t.description,
    robots: { index: false },
  }
}

export default async function PublicAnalysisPage({ params }: Params) {
  const locale = pick(params.locale)
  const data = await load(params.token)
  if (!data || data.status !== 'done') notFound()
  return <PublicReport data={data} t={getDictionary(locale).report} home={localePath(locale, '/')} />
}
