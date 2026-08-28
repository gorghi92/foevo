'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Cpu, Gauge, SlidersHorizontal, RotateCcw, Eye, Brain } from 'lucide-react'

type KeyStat = 'db' | 'env' | 'none'
type Init = { claudeModel: string; qwenModel: string; effort: string; semanticPct: number }

const CLAUDE_MODELS = ['claude-opus-5', 'claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5']
const QWEN_MODELS = ['qwen-vl-max-latest', 'qwen-vl-max', 'qwen-vl-plus', 'qwen3-vl-plus']
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']

function Badge({ s }: { s: KeyStat }) {
  const map = { db: { t: 'Salvato', c: 'bg-green-100 text-green-700' }, env: { t: 'Da env', c: 'bg-sky-100 text-sky-700' }, none: { t: 'Non impostato', c: 'bg-amber-100 text-amber-700' } }[s]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map.c}`}>{map.t}</span>
}

function SecretField({ label, hint, status, value, cleared, onChange, onClear }: {
  label: string; hint?: string; status: KeyStat; value: string; cleared: boolean
  onChange: (v: string) => void; onClear: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label">{label}</label>
        <div className="flex items-center gap-2">
          <Badge s={cleared ? 'none' : status} />
          {status === 'db' && <button type="button" onClick={onClear} title="Reimposta (torna all'env)" className="text-muted hover:text-red-600"><RotateCcw size={13} /></button>}
        </div>
      </div>
      <input className="input mt-1 font-mono" type="password" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={cleared ? 'sarà rimosso al salvataggio' : status !== 'none' ? '•••••••• (lascia vuoto per non cambiare)' : 'incolla la chiave'} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function AiConfigForm({ init, keyStatus }: { init: Init; keyStatus: Record<string, KeyStat> }) {
  const router = useRouter()
  const [secrets, setSecrets] = useState<Record<string, string>>({})
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [claudeModel, setClaudeModel] = useState(init.claudeModel)
  const [qwenModel, setQwenModel] = useState(init.qwenModel)
  const [effort, setEffort] = useState(init.effort)
  const [pct, setPct] = useState(init.semanticPct)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

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
    if (!r.ok) return setMsg((await r.json().catch(() => ({})))?.error || 'Errore nel salvataggio')
    setSecrets({}); setCleared(new Set())
    setMsg('Configurazione AI salvata. Attiva entro ~30s (cache), senza redeploy.')
    router.refresh()
  }

  const heavyEffort = effort === 'high' || effort === 'xhigh' || effort === 'max'

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-extrabold">Configurazione AI</h1>
        <p className="text-sm text-muted">Chiavi, modelli, effort e bilanciamento della heatmap. Le modifiche valgono per le nuove analisi.</p>
      </div>

      {/* chiavi */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><KeyRound size={16} className="text-brand" /> Chiavi API</div>
        <div className="mt-4 space-y-4">
          <SecretField label="Anthropic API key (premium)" hint="Usata per il tier Premium (Claude). console.anthropic.com → API keys."
            status={keyStatus.ANTHROPIC_API_KEY} value={secrets.ANTHROPIC_API_KEY ?? ''} cleared={cleared.has('ANTHROPIC_API_KEY')}
            onChange={(v) => setSecret('ANTHROPIC_API_KEY', v)} onClear={() => clearSecret('ANTHROPIC_API_KEY')} />
          <SecretField label="DashScope API key (base — Qwen)" hint="Usata per il tier Base (Qwen-VL) su DashScope."
            status={keyStatus.DASHSCOPE_API_KEY} value={secrets.DASHSCOPE_API_KEY ?? ''} cleared={cleared.has('DASHSCOPE_API_KEY')}
            onChange={(v) => setSecret('DASHSCOPE_API_KEY', v)} onClear={() => clearSecret('DASHSCOPE_API_KEY')} />
          <SecretField label="DashScope base URL (opzionale)" hint="Default: endpoint internazionale compatibile OpenAI. Cambialo solo se usi un'altra region."
            status={keyStatus.DASHSCOPE_BASE_URL} value={secrets.DASHSCOPE_BASE_URL ?? ''} cleared={cleared.has('DASHSCOPE_BASE_URL')}
            onChange={(v) => setSecret('DASHSCOPE_BASE_URL', v)} onClear={() => clearSecret('DASHSCOPE_BASE_URL')} />
        </div>
      </div>

      {/* modelli */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><Cpu size={16} className="text-brand" /> Modelli</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Modello Premium (Claude)</label>
            <input className="input mt-1 font-mono" list="claude-models" value={claudeModel} onChange={(e) => setClaudeModel(e.target.value)} />
            <datalist id="claude-models">{CLAUDE_MODELS.map((m) => <option key={m} value={m} />)}</datalist>
            <p className="mt-1 text-xs text-muted">Scegli dalla lista o scrivi un id. Vuoto = default (claude-opus-5).</p>
          </div>
          <div>
            <label className="label">Modello Base (Qwen)</label>
            <input className="input mt-1 font-mono" list="qwen-models" value={qwenModel} onChange={(e) => setQwenModel(e.target.value)} />
            <datalist id="qwen-models">{QWEN_MODELS.map((m) => <option key={m} value={m} />)}</datalist>
            <p className="mt-1 text-xs text-muted">Fallback automatico a <code>qwen-vl-max</code> se l'id non è disponibile.</p>
          </div>
        </div>
      </div>

      {/* effort */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><Gauge size={16} className="text-brand" /> Effort (solo Claude)</div>
        <p className="mt-1 text-xs text-muted">Più alto = ragionamento e qualità maggiori, ma più lento e costoso.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EFFORTS.map((e) => (
            <button type="button" key={e} onClick={() => setEffort(e)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize ${effort === e ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-ink'}`}>
              {e}
            </button>
          ))}
        </div>
        {heavyEffort && <p className="mt-2 text-xs text-amber-600">⚠︎ Con effort alto le analisi possono superare i tempi (timeout su pagine molto lunghe). Consigliato <b>medium</b> finché l'analisi resta sincrona.</p>}
      </div>

      {/* mix heatmap */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-semibold"><SlidersHorizontal size={16} className="text-brand" /> Bilanciamento heatmap (stima eye-tracking)</div>
        <p className="mt-1 text-xs text-muted">Quanto pesa il motore <b>semantico (AI)</b> rispetto alla <b>saliency visiva</b> nel calcolo della mappa dell'attenzione.</p>
        <div className="mt-4">
          <input type="range" min={0} max={100} step={1} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-[var(--brand,#e5502e)]" />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted"><Eye size={14} /> Saliency visiva <b className="text-ink">{100 - pct}%</b></span>
            <span className="flex items-center gap-1.5 text-muted">Motore semantico (AI) <b className="text-ink">{pct}%</b> <Brain size={14} /></span>
          </div>
          <p className="mt-2 text-xs text-muted">Default consigliato: <b>44%</b> (equilibrio storico). 0% = solo visivo, 100% = solo AI.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Salvo…' : 'Salva configurazione'}</button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  )
}
