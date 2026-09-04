import { createServiceClient } from '@/lib/supabase/server'
import { getSettingsStatus } from '@/lib/settings'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const has = (v?: string | null) => !!(v && v.trim())

export default async function SystemPage() {
  const t = getDictionary(getServerLocale()).app.admin.system
  const sc = createServiceClient()
  const [a, u, p, e, k, st] = await Promise.all([
    sc.from('analyses').select('id', { count: 'exact', head: true }),
    sc.from('profiles').select('id', { count: 'exact', head: true }),
    sc.from('payments').select('id', { count: 'exact', head: true }),
    sc.from('entitlements').select('user_id', { count: 'exact', head: true }),
    sc.from('api_keys').select('id', { count: 'exact', head: true }).is('revoked_at', null),
    getSettingsStatus(),
  ])

  // Config runtime: DB (Impostazioni) ha priorità, poi env.
  const src = (key: string) => (st[key] === 'db' ? t.fromDb : st[key] === 'env' ? t.fromEnv : '')
  const cfgOk = (key: string) => st[key] !== 'none'

  const checks = [
    { label: t.checks.supabaseUrl, ok: has(process.env.NEXT_PUBLIC_SUPABASE_URL), val: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') },
    { label: t.checks.serviceRoleKey, ok: has(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { label: t.checks.appDomain, ok: has(process.env.NEXT_PUBLIC_APP_URL), val: process.env.NEXT_PUBLIC_APP_URL },
    { label: t.checks.aiPremium, ok: has(process.env.ANTHROPIC_API_KEY), val: process.env.ATTENTION_CLAUDE_MODEL || 'claude-opus-4-8' },
    { label: t.checks.aiBase, ok: has(process.env.DASHSCOPE_API_KEY), val: process.env.ATTENTION_QWEN_MODEL || 'qwen-vl-max' },
    { label: t.checks.whopApiKey, ok: cfgOk('WHOP_API_KEY'), warn: true, val: src('WHOP_API_KEY') },
    { label: t.checks.whopWebhookSecret, ok: cfgOk('WHOP_WEBHOOK_SECRET'), warn: true, val: src('WHOP_WEBHOOK_SECRET') },
    { label: t.checks.whopCheckoutBase, ok: cfgOk('WHOP_CHECKOUT_BASE'), warn: true, val: src('WHOP_CHECKOUT_BASE') },
    { label: t.checks.storageR2, ok: cfgOk('R2_ACCESS_KEY_ID'), warn: true, val: cfgOk('R2_ACCESS_KEY_ID') ? src('R2_ACCESS_KEY_ID') : t.inlineStorage },
    { label: t.checks.superadmin, ok: has(process.env.SUPERADMIN_EMAILS), val: process.env.SUPERADMIN_EMAILS },
    { label: t.checks.freeTrial, ok: true, val: t.trialOff },
  ]

  const counts = [
    { label: t.counts.users, v: u.count ?? 0 },
    { label: t.counts.analyses, v: a.count ?? 0 },
    { label: t.counts.payments, v: p.count ?? 0 },
    { label: t.counts.entitlements, v: e.count ?? 0 },
    { label: t.counts.apiKeys, v: k.count ?? 0 },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {counts.map((c) => (
          <div key={c.label} className="card p-4 text-center">
            <div className="font-display text-2xl font-extrabold">{c.v}</div>
            <div className="text-xs text-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-lg font-bold">{t.configTitle}</h2>
      <div className="card mt-2 divide-y divide-line">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-3 p-3">
            {c.ok ? <CheckCircle2 size={18} className="text-green-600" /> : c.warn ? <AlertTriangle size={18} className="text-amber-500" /> : <XCircle size={18} className="text-red-600" />}
            <span className="font-medium">{c.label}</span>
            <span className="ml-auto truncate text-sm text-muted">{c.val || (c.ok ? t.configured : c.warn ? t.optionalMissing : t.missing)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">{t.note}</p>
    </div>
  )
}
