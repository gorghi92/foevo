import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

/** Downgrade al piano Base. Aggiorna il tier nel DB; per gli abbonati via Whop
 *  va gestita anche la sottoscrizione su Whop (avviso lato UI). */
export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: m('notAuthenticated') }, { status: 401 })

  const sc = createServiceClient()
  const { data: base } = await sc.from('packages').select('id, monthly_quota, unlimited').eq('slug', 'base').eq('active', true).maybeSingle()
  if (!base) return NextResponse.json({ error: m('basePackageUnavailable') }, { status: 400 })

  // upsert: aggiorna solo i campi passati, preservando source/whop_membership_id.
  const { error } = await sc.from('entitlements').upsert({
    user_id: user.id, package_id: (base as any).id, tier: 'base',
    monthly_quota: (base as any).monthly_quota, unlimited: (base as any).unlimited,
    status: 'active', updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
