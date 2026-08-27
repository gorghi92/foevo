import { createServiceClient } from '@/lib/supabase/server'
import { getSettingsStatus } from '@/lib/settings'
import { SettingsForm } from './settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const sc = createServiceClient()
  const [status, { data: packages }] = await Promise.all([
    getSettingsStatus(),
    sc.from('packages').select('name, slug, tier, whop_plan_id, active').order('order_index'),
  ])

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://foevo.app').replace(/\/$/, '')
  const webhookUrl = `${appUrl}/api/webhooks/whop`
  const pkgs = (packages ?? []).map((p: any) => ({ name: p.name, slug: p.slug, tier: p.tier, planId: p.whop_plan_id as string | null, active: p.active }))

  return <SettingsForm status={status} webhookUrl={webhookUrl} packages={pkgs} />
}
