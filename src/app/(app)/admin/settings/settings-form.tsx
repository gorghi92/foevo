'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Copy, RotateCcw, ExternalLink, ShieldCheck, Database, CreditCard } from 'lucide-react'

type Status = Record<string, 'db' | 'env' | 'none'>
type Pkg = { name: string; slug: string; tier: string; planId: string | null; active: boolean }

const WHOP_FIELDS: { key: string; label: string; hint: string; secret?: boolean; placeholder?: string }[] = [
  { key: 'WHOP_CHECKOUT_BASE', label: 'URL base checkout', hint: 'Es. https://whop.com/checkout — a questo aggiungiamo il Plan ID del pacchetto.', placeholder: 'https://whop.com/checkout' },
  { key: 'WHOP_API_KEY', label: 'API key', hint: 'Whop → Developer → API keys. Serve per le chiamate server-to-server.', secret: true },
  { key: 'WHOP_WEBHOOK_SECRET', label: 'Webhook secret', hint: 'Whop → Developer → Webhooks: la firma con cui verifichiamo gli eventi.', secret: true },
]
const R2_FIELDS: { key: string; label: string; secret?: boolean; placeholder?: string }[] = [
  { key: 'R2_ACCOUNT_ID', label: 'Account ID', placeholder: 'Cloudflare account id' },
  { key: 'R2_ACCESS_KEY_ID', label: 'Access key ID' },
  { key: 'R2_SECRET_ACCESS_KEY', label: 'Secret access key', secret: true },
  { key: 'R2_BUCKET', label: 'Bucket', placeholder: 'foevo-media' },
  { key: 'R2_ENDPOINT', label: 'Endpoint (opzionale)', placeholder: 'https://<account>.r2.cloudflarestorage.com' },
  { key: 'R2_PUBLIC_BASE', label: 'Public base URL', placeholder: 'https://cdn.tuodominio.com' },
]

function Badge({ s }: { s: 'db' | 'env' | 'none' }) {
  const map = {
    db: { t: 'Salvato', c: 'bg-green-100 text-green-700' },
    env: { t: 'Da env', c: 'bg-sky-100 text-sky-700' },
    none: { t: 'Non impostato', c: 'bg-amber-100 text-amber-700' },
  }[s]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map.c}`}>{map.t}</span>
}

type FieldProps = {
  fieldKey: string; label: string; hint?: string; secret?: boolean; placeholder?: string
  status: 'db' | 'env' | 'none'; isCleared: boolean; value: string
  onChange: (v: string) => void; onClear: () => void
}
// Definito a livello di modulo: se fosse annidato nel form si rimonterebbe a ogni
// tasto premuto, facendo perdere il focus all'input.
function Field({ fieldKey, label, hint, secret, placeholder, status, isCleared, value, onChange, onClear }: FieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label" htmlFor={fieldKey}>{label}</label>
        <div className="flex items-center gap-2">
          <Badge s={isCleared ? 'none' : status} />
          {status === 'db' && <button type="button" onClick={onClear} title="Reimposta (torna all'env)" className="text-muted hover:text-red-600"><RotateCcw size={13} /></button>}
        </div>
      </div>
      <input
        id={fieldKey}
        className="input mt-1"
        type={secret ? 'password' : 'text'}
        autoComplete="off"
        placeholder={isCleared ? 'sarà rimosso al salvataggio' : status !== 'none' ? '•••••••• (lascia vuoto per non cambiare)' : placeholder || ''}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function SettingsForm({ status, webhookUrl, packages }: { status: Status; webhookUrl: string; packages: Pkg[] }) {
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
    if (Object.keys(body).length === 0) { setBusy(false); setMsg('Nessuna modifica da salvare.'); return }
    const r = await fetch('/api/admin/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(false)
    if (!r.ok) return setMsg((await r.json().catch(() => ({})))?.error || 'Errore nel salvataggio')
    setVals({}); setCleared(new Set()); setMsg('Impostazioni salvate. Attive subito, senza redeploy.')
    router.refresh()
  }

  const copyWebhook = async () => { try { await navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* noop */ } }

  const withoutPlan = packages.filter((p) => p.active && !p.planId)
  const fieldProps = (f: { key: string; label: string; hint?: string; secret?: boolean; placeholder?: string }) => ({
    fieldKey: f.key, label: f.label, hint: f.hint, secret: f.secret, placeholder: f.placeholder,
    status: status[f.key] || 'none', isCleared: cleared.has(f.key), value: vals[f.key] ?? '',
    onChange: (v: string) => set(f.key, v), onClear: () => clear(f.key),
  })

  return (
    <form onSubmit={save} className="space-y-6">
      {/* guida */}
      <div className="card border-brand/40 bg-brand-soft/50 p-5">
        <div className="flex items-center gap-2 font-semibold"><CreditCard size={18} className="text-brand" /> Collega Whop in 5 passi</div>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>Su <a className="text-brand underline" href="https://whop.com" target="_blank" rel="noreferrer">whop.com</a> crea i piani (uno per pacchetto: Base e Premium) con il prezzo <strong>IVA esclusa</strong>.</li>
          <li>Copia il <strong>Plan ID</strong> di ogni piano e incollalo nel relativo pacchetto (tab <Link href="/admin/packages" className="text-brand underline">Pacchetti</Link>).</li>
          <li>In <em>Developer → API keys</em> genera la <strong>API key</strong> e incollala qui sotto.</li>
          <li>In <em>Developer → Webhooks</em> crea un webhook verso l’URL qui sotto e copia il <strong>secret</strong>.</li>
          <li>Imposta l’<strong>URL base checkout</strong> e salva. Tutto diventa attivo subito.</li>
        </ol>
        <div className="mt-4">
          <label className="label">URL webhook da incollare in Whop</label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-line bg-panel px-3 py-2 text-sm">{webhookUrl}</code>
            <button type="button" onClick={copyWebhook} className="btn btn-ghost shrink-0">{copied ? <><Check size={15} /> Copiato</> : <><Copy size={15} /> Copia</>}</button>
          </div>
          <p className="mt-1 text-xs text-muted">Eventi consigliati: <code>membership.went_valid</code>, <code>membership.went_invalid</code>, <code>membership.cancelled</code>, <code>payment.succeeded</code>.</p>
        </div>
      </div>

      {/* stato mapping pacchetti */}
      {withoutPlan.length > 0 && (
        <div className="card border-amber-300 bg-amber-50 p-4 text-sm">
          <div className="font-semibold text-amber-800">Pacchetti senza Plan ID Whop</div>
          <p className="mt-1 text-amber-700">Questi piani attivi non hanno un Plan ID e non saranno acquistabili: {withoutPlan.map((p) => p.name).join(', ')}. Aggiungilo nel tab <Link href="/admin/packages" className="underline">Pacchetti</Link>.</p>
        </div>
      )}

      {/* whop */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} className="text-brand" /> Whop</div>
        <p className="mt-1 text-sm text-muted">I segreti sono salvati solo lato server e non vengono mai mostrati. Lascia un campo vuoto per non modificarlo.</p>
        <div className="mt-4 grid gap-4">
          {WHOP_FIELDS.map((f) => <Field key={f.key} {...fieldProps(f)} />)}
        </div>
      </div>

      {/* storage */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><Database size={18} className="text-brand" /> Storage screenshot (Cloudflare R2) <span className="text-xs font-normal text-muted">— opzionale</span></div>
        <p className="mt-1 text-sm text-muted">Se non configurato, gli screenshot vengono salvati inline nel database. Con R2 le immagini stanno su CDN (consigliato in produzione).</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {R2_FIELDS.map((f) => <Field key={f.key} {...fieldProps(f)} />)}
        </div>
      </div>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button className="btn btn-primary shadow-lg" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva impostazioni'}</button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  )
}
