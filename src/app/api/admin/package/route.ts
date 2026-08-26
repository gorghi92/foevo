import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as any
  if (!b?.name || !b?.slug) return NextResponse.json({ error: 'name e slug richiesti' }, { status: 400 })
  const row = {
    name: b.name, slug: b.slug, tier: b.tier === 'premium' ? 'premium' : 'base',
    monthly_quota: Number(b.monthly_quota ?? 0), unlimited: !!b.unlimited,
    whop_plan_id: b.whop_plan_id || null, price_monthly: Number(b.price_monthly ?? 0),
    features: Array.isArray(b.features) ? b.features : [],
    active: b.active !== false, order_index: Number(b.order_index ?? 0),
    updated_at: new Date().toISOString(),
  }
  const sc = createServiceClient()
  if (b.id) {
    const { error } = await sc.from('packages').update(row).eq('id', b.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: b.id })
  }
  const { data, error } = await sc.from('packages').insert(row).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
