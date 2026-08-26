import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Report from './report'

export const dynamic = 'force-dynamic'

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase.from('analyses').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()
  return <Report initial={data} />
}
