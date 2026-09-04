import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { resolveEntitlement } from '@/server/store'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import Report from './report'

export const dynamic = 'force-dynamic'

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase.from('analyses').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()
  const user = await getUser()
  const ent = user ? await resolveEntitlement(user.id) : null
  const locale = getServerLocale()
  const t = getDictionary(locale).app.analyses
  return <Report initial={data} premium={ent?.tier === 'premium'} t={t} locale={locale} />
}
