'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Cpu, Gauge, SlidersHorizontal, RotateCcw, Eye, Brain, RefreshCw } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

const CUSTOM = '__custom__'

type Copy = Dictionary['app']['admin']['ai']
type BadgeCopy = Copy['badge']

/** Selettore di modello: elenca i disponibili (dal provider) + i noti + il valore
 *  corrente, con opzione "Personalizzato" per scrivere un id a mano. */
function ModelSelect({ value, onChange, fetched, known, t }: {
  value: string; onChange: (v: string) => void; fetched: string[]; known: string[]; t: Copy
}) {
  const options = Array.from(new Set([...fetched, ...known, value].filter(Boolean)))
  const [custom, setCustom] = useState(false)

  if (custom) {
    return (
      <div className="mt-1 flex gap-2">
        <input className="input font-mono" value={value} onChange={(e) => onChange(e.target.value)} placeholder={t.modelIdPlaceholder} autoFocus />
        <button type="button" onClick={() => { setCustom(false); onChange(options[0] || '') }} className="btn btn-ghost px-3 text-sm">{t.backToList}</button>
      </div>
    )
  }
  return (
    <select
      className="input mt-1 font-mono"
      value={options.includes(value) ? value : (options[0] || '')}
      onChange={(e) => { if (e.target.value === CUSTOM) { setCustom(true) } else onChange(e.target.value) }}
    >
      {options.map((m) => <option key={m} value={m}>{m}</option>)}
      <option value={CUSTOM}>{t.customOption}</option>
    </select>
  )
}

type KeyStat = 'db' | 'env' | 'none'
type Init = { claudeModel: string; qwenModel: string; effort: string; semanticPct: number }

const CLAUDE_MODELS = ['claude-opus-5', 'claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5']
const QWEN_MODELS = ['qwen-vl-max-latest', 'qwen-vl-max', 'qwen-vl-plus', 'qwen3-vl-plus']
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']

function Badge({ s, t }: { s: KeyStat; t: BadgeCopy }) {
  const map = { db: { t: t.saved, c: 'bg-green-100 text-green-700' }, env: { t: t.fromEnv, c: 'bg-sky-100 text-sky-700' }, none: { t: t.notSet, c: 'bg-amber-100 text-amber-700' } }[s]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map.c}`}>{map.t}</span>
}

function SecretField({ label, hint, status, value, cleared, onChange, onClear, t }: {
  label: string; hint?: string; status: KeyStat; value: string; cleared: boolean
  onChange: (v: string) => void; onClear: () => void; t: Copy
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label">{label}</label>
        <div className="flex items-center gap-2">
          <Badge s={cleared ? 'none' : status} t={t.badge} />
          {status === 'db' && <button type="button" onClick={onClear} title={t.resetTitle} className="text-muted hover:text-red-600"><RotateCcw size={13} /></button>}
        </div>
      </div>
      <input className="input mt-1 font-mono" type="password" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={cleared ? t.clearedPlaceholder : status !== 'none' ? t.keepPlaceholder : t.keyPlaceholder} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function AiConfigForm({ init, keyStatus, t }: { init: Init; keyStatus: Record<string, KeyStat>; t: Copy }) {
  const router = useRouter()
  const [secrets, setSecrets] = useState<Record<string, string>>({})
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [claudeModel, setClaudeModel] = useState(init.claudeModel)
  const [qwenModel, setQwenModel] = useState(init.qwenModel)
  const [effort, setEffort] = useState(init.effort)
  const [pct, setPct] = useState(init.semanticPct)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [avail, setAvail] = useState<{ claude: string[]; qwen: string[] }>({ claude: [], qwen: [] })
  const [loadingModels, setLoadingModels] = useState(true)

  async function loadModels() {
    setLoadingModels(true)
    try {
      const r = await fetch('/api/admin/ai/models', { cache: 'no-store' })
      if (r.ok) { const j = await r.json(); setAvail({ claude: j.claude ?? [], qwen: j.qwen ?? [] }) }
    } catch { /* fallback alla lista statica */ } finally { setLoadingModels(false) }
  }
  useEffect(() => { loadModels() }, [])

  const setSecret = (k: string, v: string) => {
    setSecrets((s) => ({ ...s, [k]: v }))
    if (v && cleared.has(k)) setCleared((c) => { const n = new Set(c); n.delete(k); return n })
  }
  const clearSecret = (k: string) => { setSecrets((s) => ({ ...s, [k]: '' })); setCleared((c) => new Set(c).add(k)) }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    const body: Record<string, unknown> = {
      ATTENTION_CLAUDE_MODEL: claudeModel.trim(),
      ATTENTION_QWEN_MODEL: qwenModel.trim(),
      ATTENTION_CLAUDE_EFFORT: effort,
      ATTENTION_SEMANTIC_PCT: pct,
    }
    for (const [k, v] of Object.entries(secrets)) if (v.trim()) body[k] = v.trim()
    for (const k of cleared) body[k] = ''

    const r = await fetch('/api/admin/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(false)
    if (!r.ok) return setMsg((await r.json().catch(() => ({})))?.error || t.saveError)
    setSecrets({}); setCleared(new Set())
    setMsg(t.saved)
    router.refresh()
  }

  const heavyEffort = effort === 'high' || effort === 'xhigh' || effort === 'max'

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-extrabold">{t.title}</h1>
        <p className="text-sm text-muted">{t.subtitle}</p>
      </div>

      {/* chiavi */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><KeyRound size={16} className="text-brand" /> {t.keysTitle}</div>
        <div className="mt-4 space-y-4">
          <SecretField label={t.anthropicLabel} hint={t.anthropicHint} t={t}
            status={keyStatus.ANTHROPIC_API_KEY} value={secrets.ANTHROPIC_API_KEY ?? ''} cleared={cleared.has('ANTHROPIC_API_KEY')}
            onChange={(v) => setSecret('ANTHROPIC_API_KEY', v)} onClear={() => clearSecret('ANTHROPIC_API_KEY')} />
          <SecretField label={t.dashscopeLabel} hint={t.dashscopeHint} t={t}
            status={keyStatus.DASHSCOPE_API_KEY} value={secrets.DASHSCOPE_API_KEY ?? ''} cleared={cleared.has('DASHSCOPE_API_KEY')}
            onChange={(v) => setSecret('DASHSCOPE_API_KEY', v)} onClear={() => clearSecret('DASHSCOPE_API_KEY')} />
          <SecretField label={t.dashscopeUrlLabel} hint={t.dashscopeUrlHint} t={t}
            status={keyStatus.DASHSCOPE_BASE_URL} value={secrets.DASHSCOPE_BASE_URL ?? ''} cleared={cleared.has('DASHSCOPE_BASE_URL')}
            onChange={(v) => setSecret('DASHSCOPE_BASE_URL', v)} onClear={() => clearSecret('DASHSCOPE_BASE_URL')} />
        </div>
      </div>

      {/* modelli */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold"><Cpu size={16} className="text-brand" /> {t.modelsTitle}</div>
          <button type="button" onClick={loadModels} disabled={loadingModels} className="btn btn-ghost px-2.5 py-1 text-xs">
            <RefreshCw size={13} className={loadingModels ? 'animate-spin' : ''} /> {loadingModels ? t.loadingModels : t.refreshModels}
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t.claudeModelLabel}</label>
            <ModelSelect value={claudeModel} onChange={setClaudeModel} fetched={avail.claude} known={CLAUDE_MODELS} t={t} />
            <p className="mt-1 text-xs text-muted">
              {avail.claude.length ? t.claudeModelsAvailable.replace('{n}', String(avail.claude.length)) : t.claudeModelsStatic}
            </p>
          </div>
          <div>
            <label className="label">{t.qwenModelLabel}</label>
            <ModelSelect value={qwenModel} onChange={setQwenModel} fetched={avail.qwen} known={QWEN_MODELS} t={t} />
            <p className="mt-1 text-xs text-muted">
              {avail.qwen.length ? t.qwenModelsAvailable.replace('{n}', String(avail.qwen.length)) : t.qwenModelsStatic}
              <Rich text={t.qwenFallback} strongClass="" />
            </p>
          </div>
        </div>
      </div>

      {/* effort */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><Gauge size={16} className="text-brand" /> {t.effortTitle}</div>
        <p className="mt-1 text-xs text-muted">{t.effortNote}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EFFORTS.map((e) => (
            <button type="button" key={e} onClick={() => setEffort(e)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize ${effort === e ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-ink'}`}>
              {e}
            </button>
          ))}
        </div>
        {heavyEffort && <p className="mt-2 text-xs text-amber-600"><Rich text={t.effortWarning} strongClass="" /></p>}
      </div>

      {/* mix heatmap */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><SlidersHorizontal size={16} className="text-brand" /> {t.mixTitle}</div>
        <p className="mt-1 text-xs text-muted"><Rich text={t.mixNote} strongClass="" /></p>
        <div className="mt-4">
          <input type="range" min={0} max={100} step={1} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-[var(--brand,#e5502e)]" />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted"><Eye size={14} /> {t.mixVisual} <b className="text-ink">{100 - pct}%</b></span>
            <span className="flex items-center gap-1.5 text-muted">{t.mixSemantic} <b className="text-ink">{pct}%</b> <Brain size={14} /></span>
          </div>
          <p className="mt-2 text-xs text-muted"><Rich text={t.mixDefault} strongClass="" /></p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? t.saving : t.submit}</button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  )
}
