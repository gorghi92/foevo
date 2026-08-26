import { withKey } from '@/server/api-key'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  return withKey(req, async ({ userId }) => {
    const { data, error } = await createServiceClient()
      .from('analyses')
      .select('id, status, url, title, tier, provider, page_type, score_conversion, score_attention, score_clarity, score_cta, error, created_at')
      .eq('id', params.id).eq('user_id', userId).maybeSingle()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    if (!data) return Response.json({ error: 'Analisi non trovata' }, { status: 404 })
    return Response.json({ ...data, resultPath: `/analyses/${data.id}` })
  })
}
