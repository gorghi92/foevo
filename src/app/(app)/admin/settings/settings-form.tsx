'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Copy, RotateCcw, ShieldCheck, Database, CreditCard, Mail } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

type Status = Record<string, 'db' | 'env' | 'none'>
type Pkg = { name: string; slug: string; tier: string; planId: string | null; active: boolean }
type Copy = Dictionary['app']['admin']['settings']
type FieldKey = keyof Copy['fields']
type BadgeCopy = Copy['badge']

// Solo la struttura: etichette, hint e placeholder stanno nei dizionari (`fields`).
const WHOP_FIELDS: { key: FieldKey; secret?: boolean }[] = [
  { key: 'WHOP_CHECKOUT_BASE' },
  { key: 'WHOP_API_KEY', secret: true },
  { key: 'WHOP_WEBHOOK_SECRET', secret: true },
]
const EMAIL_FIELDS: { key: FieldKey; secret?: boolean }[] = [
  { key: 'RESEND_API_KEY', secret: true },
  { key: 'MAIL_FROM' },
  { key: 'SUPPORT_EMAIL' },
]
const R2_FIELDS: { key: FieldKey; secret?: boolean }[] = [
  { key: 'R2_ACCOUNT_ID' },
  { key: 'R2_ACCESS_KEY_ID' },
  { key: 'R2_SECRET_ACCESS_KEY', secret: true },
  { key: 'R2_BUCKET' },
  { key: 'R2_ENDPOINT' },
  { key: 'R2_PUBLIC_BASE' },
]

function Badge({ s, t }: { s: 'db' | 'env' | 'none'; t: BadgeCopy }) {
  const map = {
    db: { t: t.saved, c: 'bg-green-100 text-green-700' },
    env: { t: t.fromEnv, c: 'bg-sky-100 text-sky-700' },
    none: { t: t.notSet, c: 'bg-amber-100 text-amber-700' },
  }[s]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map.c}`}>{map.t}</span>
}

type FieldProps = {
  fieldKey: string; label: string; hint?: string; secret?: boolean; placeholder?: string
  status: 'db' | 'env' | 'none'; isCleared: boolean; value: string
  onChange: (v: string) => void; onClear: () => void; t: Copy
}
// Definito a livello di modulo: se fosse annidato nel form si rimonterebbe a ogni
// tasto premuto, facendo perdere il focus all'input.
function Field({ fieldKey, label, hint, secret, placeholder, status, isCleared, value, onChange, onClear, t }: FieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label" htmlFor={fieldKey}>{label}</label>
        <div className="flex items-center gap-2">
          <Badge s={isCleared ? 'none' : status} t={t.badge} />
          {status === 'db' && <button type="button" onClick={onClear} title={t.resetTitle} className="text-muted hover:text-red-600"><RotateCcw size={13} /></button>}
        </div>
      </div>
      <input
        id={fieldKey}
        className="input mt-1"
        type={secret ? 'password' : 'text'}
        autoComplete="off"
        placeholder={isCleared ? t.clearedPlaceholder : status !== 'none' ? t.keepPlaceholder : placeholder || ''}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function SettingsForm({ status, webhookUrl, packages, t }: { status: Status; webhookUrl: string; packages: Pkg[]; t: Copy }) {
  const router = useRouter()
  const [vals, setVals] = useState<Record<string, string>>({})
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState('')

  const set = (k: string, v: string) => {
    setVals((s) => ({ ...s, [k]: v }))
    if (v && cleared.has(k)) setCleared((c) => { const n = new Set(c); n.delete(k); return n })
  }
  const clear = (k: string) => {
    setVals((s) => ({ ...s, [k]: '' }))
    setCleared((c) => new Set(c).add(k))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    const body: Record<string, string> = {}
    for (const [k, v] of Object.entries(vals)) if (v.trim()) body[k] = v.trim()
    for (const k of cleared) body[k] = ''
    if (Object.keys(body).length === 0) { setBusy(false); setMsg(t.noChanges); return }
    const r = await fetch('/api/admin/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(false)
    if (!r.ok) return setMsg((await r.json().catch(() => ({})))?.error || t.saveError)
    setVals({}); setCleared(new Set()); setMsg(t.saved)
    router.refresh()
  }

  const copyWebhook = async () => { try { await navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* noop */ } }

  const withoutPlan = packages.filter((p) => p.active && !p.planId)
  const fieldProps = (f: { key: FieldKey; secret?: boolean }) => ({
    fieldKey: f.key, label: t.fields[f.key].label, hint: t.fields[f.key].hint, secret: f.secret, placeholder: t.fields[f.key].placeholder,
    status: status[f.key] || 'none', isCleared: cleared.has(f.key), value: vals[f.key] ?? '',
    onChange: (v: string) => set(f.key, v), onClear: () => clear(f.key), t,
  })

  return (
    <form onSubmit={save} className="space-y-6">
      {/* guida */}
      <div className="card border-brand/40 bg-brand-soft/50 p-5">
        <div className="flex items-center gap-2 font-semibold"><CreditCard size={18} className="text-brand" /> {t.guideTitle}</div>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li><Rich text={t.steps.one} strongClass="" /></li>
          <li><Rich text={t.steps.two} strongClass="" /></li>
          <li><Rich text={t.steps.three} strongClass="" /></li>
          <li><Rich text={t.steps.four} strongClass="" /></li>
          <li><Rich text={t.steps.five} strongClass="" /></li>
        </ol>
        <div className="mt-4">
          <label className="label">{t.webhookLabel}</label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-line bg-panel px-3 py-2 text-sm">{webhookUrl}</code>
            <button type="button" onClick={copyWebhook} className="btn btn-ghost shrink-0">{copied ? <><Check size={15} /> {t.copied}</> : <><Copy size={15} /> {t.copy}</>}</button>
          </div>
          <p className="mt-1 text-xs text-muted"><Rich text={t.webhookEvents} strongClass="" /></p>
        </div>
      </div>

      {/* stato mapping pacchetti */}
      {withoutPlan.length > 0 && (
        <div className="card border-amber-300 bg-amber-50 p-4 text-sm">
          <div className="font-semibold text-amber-800">{t.missingPlanTitle}</div>
          <p className="mt-1 text-amber-700"><Rich text={t.missingPlanBody.replace('{names}', withoutPlan.map((p) => p.name).join(', '))} strongClass="" /></p>
        </div>
      )}

      {/* whop */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} className="text-brand" /> {t.whopTitle}</div>
        <p className="mt-1 text-sm text-muted">{t.whopNote}</p>
        <div className="mt-4 grid gap-4">
          {WHOP_FIELDS.map((f) => <Field key={f.key} {...fieldProps(f)} />)}
        </div>
      </div>

      {/* email */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><Mail size={18} className="text-brand" /> {t.emailTitle} <span className="text-xs font-normal text-muted">{t.emailBadge}</span></div>
        <p className="mt-1 text-sm text-muted">{t.emailNote}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {EMAIL_FIELDS.map((f) => <Field key={f.key} {...fieldProps(f)} />)}
        </div>
      </div>

      {/* storage */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><Database size={18} className="text-brand" /> {t.storageTitle} <span className="text-xs font-normal text-muted">{t.storageBadge}</span></div>
        <p className="mt-1 text-sm text-muted">{t.storageNote}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {R2_FIELDS.map((f) => <Field key={f.key} {...fieldProps(f)} />)}
        </div>
      </div>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button className="btn btn-primary shadow-lg" disabled={busy}>{busy ? t.saving : t.submit}</button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  )
}
