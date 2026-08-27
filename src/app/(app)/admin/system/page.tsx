import { createServiceClient } from '@/lib/supabase/server'
import { getSettingsStatus } from '@/lib/settings'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const has = (v?: string | null) => !!(v && v.trim())

export default async function SystemPage() {
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
  const src = (key: string) => (st[key] === 'db' ? 'da pannello' : st[key] === 'env' ? 'da env' : '')
  const cfgOk = (key: string) => st[key] !== 'none'

  const checks = [
    { label: 'Supabase URL', ok: has(process.env.NEXT_PUBLIC_SUPABASE_URL), val: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') },
    { label: 'Service role key', ok: has(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { label: 'Dominio app', ok: has(process.env.NEXT_PUBLIC_APP_URL), val: process.env.NEXT_PUBLIC_APP_URL },
    { label: 'AI premium (Claude)', ok: has(process.env.ANTHROPIC_API_KEY), val: process.env.ATTENTION_CLAUDE_MODEL || 'claude-opus-4-8' },
    { label: 'AI base (Qwen)', ok: has(process.env.DASHSCOPE_API_KEY), val: process.env.ATTENTION_QWEN_MODEL || 'qwen-vl-max' },
    { label: 'Whop API key', ok: cfgOk('WHOP_API_KEY'), warn: true, val: src('WHOP_API_KEY') },
    { label: 'Whop webhook secret', ok: cfgOk('WHOP_WEBHOOK_SECRET'), warn: true, val: src('WHOP_WEBHOOK_SECRET') },
    { label: 'Whop checkout base', ok: cfgOk('WHOP_CHECKOUT_BASE'), warn: true, val: src('WHOP_CHECKOUT_BASE') },
    { label: 'Storage R2', ok: cfgOk('R2_ACCESS_KEY_ID'), warn: true, val: cfgOk('R2_ACCESS_KEY_ID') ? src('R2_ACCESS_KEY_ID') : 'inline data-URL' },
    { label: 'Superadmin', ok: has(process.env.SUPERADMIN_EMAILS), val: process.env.SUPERADMIN_EMAILS },
    { label: 'Prova gratuita', ok: true, val: 'disattivata' },
  ]

  const counts = [
    { label: 'Utenti', v: u.count ?? 0 },
    { label: 'Analisi', v: a.count ?? 0 },
    { label: 'Pagamenti', v: p.count ?? 0 },
    { label: 'Entitlements', v: e.count ?? 0 },
    { label: 'API key attive', v: k.count ?? 0 },
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

      <h2 className="mt-6 text-lg font-bold">Configurazione</h2>
      <div className="card mt-2 divide-y divide-line">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-3 p-3">
            {c.ok ? <CheckCircle2 size={18} className="text-green-600" /> : c.warn ? <AlertTriangle size={18} className="text-amber-500" /> : <XCircle size={18} className="text-red-600" />}
            <span className="font-medium">{c.label}</span>
            <span className="ml-auto truncate text-sm text-muted">{c.val || (c.ok ? 'configurato' : c.warn ? 'opzionale — non configurato' : 'mancante')}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">I valori sensibili non vengono mostrati. Le voci in giallo sono opzionali (billing/storage).</p>
    </div>
  )
}
