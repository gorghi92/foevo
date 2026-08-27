import { createServiceClient } from '@/lib/supabase/server'
import { SignupForm, type PlanOption } from './signup-form'

export const dynamic = 'force-dynamic'

/**
 * I piani arrivano dal database, non da valori scritti a mano: il prezzo
 * mostrato qui è lo stesso che verrà poi addebitato da /api/checkout/start.
 */
export default async function SignupPage() {
  const sc = createServiceClient()
  const { data } = await sc
    .from('packages')
    .select('slug, name, price_monthly, tier, whop_plan_id, active, order_index')
    .eq('active', true)
    .order('order_index')

  const plans: PlanOption[] = (data ?? [])
    .filter((p: any) => p.whop_plan_id) // senza piano Whop il checkout non parte
    .map((p: any) => ({
      slug: String(p.slug),
      name: String(p.name),
      price: Number(p.price_monthly ?? 0),
      tier: p.tier === 'premium' ? 'premium' : 'base',
    }))

  return <SignupForm plans={plans} />
}
