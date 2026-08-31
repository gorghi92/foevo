'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, LogOut, Wallet, Link2, Users, TrendingUp } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

const money = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`

type Copy_ = Dictionary['affiliates']['dashboard']

type Overview = {
  clicks: number; conversions: number; earnedCents: number; availableCents: number
  paidCents: number; pendingPayoutCents: number; minPayoutCents: number
}
type Commission = {
  id: string; amount_cents: number; base_amount_cents: number; rate_bps: number
  plan_slug: string | null; month_index: number; status: string; created_at: string
}
type Payout = { id: string; amount_cents: number; status: string; requested_at: string; processed_at: string | null; note: string | null }
type Bank = { holder: string; iban: string; bank_name: string | null; country: string | null } | null

export function AffiliateDashboard({
  name, link, overview, commissions, payouts, bank, embedded = false, t, dateLocale, loginHref,
}: {
  name: string; link: string; overview: Overview
  commissions: Commission[]; payouts: Payout[]; bank: Bank; embedded?: boolean
  t: Copy_; dateLocale: string; loginHref: string
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const date = (v: string) => new Date(v).toLocaleDateString(dateLocale)

  async function logout() {
    await fetch('/api/affiliate/logout', { method: 'POST' })
    router.push(loginHref); router.refresh()
  }
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }

  const canPayout = overview.availableCents >= overview.minPayoutCents

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            {t.greeting}{name ? `, ${name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-sm text-muted">{t.sub}</p>
        </div>
        {!embedded && <button onClick={logout} className="btn btn-ghost px-3 py-2 text-sm"><LogOut size={15} /> {t.logout}</button>}
      </div>

      {/* link personale */}
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold"><Link2 size={16} className="text-brand" /> {t.linkTitle}</div>
        <p className="mt-1 text-xs text-muted">{t.linkSub}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-line bg-bg px-3 py-2 text-sm">{link}</code>
          <button onClick={copy} className="btn btn-primary px-3.5 py-2 text-sm">
            {copied ? <><Check size={15} /> {t.copied}</> : <><Copy size={15} /> {t.copy}</>}
          </button>
        </div>
      </div>

      {/* statistiche */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Link2 size={16} />} label={t.statClicks} value={String(overview.clicks)} />
        <Stat icon={<Users size={16} />} label={t.statCustomers} value={String(overview.conversions)} />
        <Stat icon={<TrendingUp size={16} />} label={t.statEarned} value={money(overview.earnedCents)} />
        <Stat icon={<Wallet size={16} />} label={t.statAvailable} value={money(overview.availableCents)} accent />
      </div>

      {/* prelievo */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold"><Wallet size={16} className="text-brand" /> {t.payoutTitle}</div>
            <p className="mt-1 text-xs text-muted">
              {t.payoutAvailable}: <b className="text-ink">{money(overview.availableCents)}</b>
              {overview.pendingPayoutCents > 0 && <> · {t.payoutPending}: {money(overview.pendingPayoutCents)}</>}
              {' '}· {t.payoutMin} {money(overview.minPayoutCents)} · {t.payoutMethod}
            </p>
          </div>
          <PayoutButton disabled={!canPayout} hasBank={!!bank?.iban} onDone={() => router.refresh()} t={t} />
        </div>
      </div>

      {/* coordinate bancarie */}
      <BankForm initial={bank} onSaved={() => router.refresh()} t={t} />

      {/* commissioni */}
      <div>
        <h2 className="mb-2 font-display text-lg font-extrabold">{t.commissionsTitle}</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="p-3">{t.colDate}</th><th className="p-3">{t.colPlan}</th><th className="p-3">{t.colMonth}</th>
                <th className="p-3 text-right">{t.colBase}</th><th className="p-3 text-right">{t.colRate}</th>
                <th className="p-3 text-right">{t.colCommission}</th><th className="p-3">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-line/60">
                  <td className="p-3">{date(c.created_at)}</td>
                  <td className="p-3 capitalize">{c.plan_slug || '—'}</td>
                  <td className="p-3">{c.month_index}/12</td>
                  <td className="p-3 text-right">{money(c.base_amount_cents)}</td>
                  <td className="p-3 text-right">{pct(c.rate_bps)}</td>
                  <td className="p-3 text-right font-semibold">{money(c.amount_cents)}</td>
                  <td className="p-3"><Badge status={c.status} t={t} /></td>
                </tr>
              ))}
              {commissions.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted">{t.commissionsEmpty}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* storico pagamenti */}
      {payouts.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg font-extrabold">{t.payoutsTitle}</h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="p-3">{t.colRequested}</th><th className="p-3 text-right">{t.colAmount}</th>
                <th className="p-3">{t.colStatus}</th><th className="p-3">{t.colProcessed}</th>
              </tr></thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-line/60">
                    <td className="p-3">{date(p.requested_at)}</td>
                    <td className="p-3 text-right font-semibold">{money(p.amount_cents)}</td>
                    <td className="p-3"><Badge status={p.status} t={t} /></td>
                    <td className="p-3">{p.processed_at ? date(p.processed_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? 'border-brand/40 bg-brand-soft/40' : ''}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted">{icon}{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold">{value}</div>
    </div>
  )
}

function Badge({ status, t }: { status: string; t: Copy_ }) {
  const color = status === 'paid' ? 'text-green-700 bg-green-50'
    : status === 'available' ? 'text-brand bg-brand-soft'
    : status === 'reversed' || status === 'rejected' ? 'text-red-600 bg-red-50'
    : 'text-amber-700 bg-amber-50'
  const label = (t.status as Record<string, string>)[status] || status
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${color}`}>{label}</span>
}

function PayoutButton({ disabled, hasBank, onDone, t }: { disabled: boolean; hasBank: boolean; onDone: () => void; t: Copy_ }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function request() {
    setBusy(true); setMsg('')
    const r = await fetch('/api/affiliate/payout', { method: 'POST' })
    const j = await r.json().catch(() => ({} as any))
    setBusy(false)
    if (!r.ok) return setMsg(j.error || t.payoutError)
    onDone()
  }
  return (
    <div className="text-right">
      <button onClick={request} disabled={disabled || busy} className="btn btn-primary px-4 py-2 text-sm disabled:opacity-50">
        {busy ? t.payoutSending : t.payoutCta}
      </button>
      {!hasBank && <p className="mt-1 text-xs text-amber-600">{t.payoutNeedsIban}</p>}
      {msg && <p className="mt-1 text-xs text-red-600">{msg}</p>}
    </div>
  )
}

function BankForm({ initial, onSaved, t }: { initial: Bank; onSaved: () => void; t: Copy_ }) {
  const [f, setF] = useState({
    holder: initial?.holder || '', iban: initial?.iban || '',
    bankName: initial?.bank_name || '', country: initial?.country || 'IT',
  })
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const r = await fetch('/api/affiliate/bank', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy(false)
    if (!r.ok) return setMsg({ ok: false, text: j.error || t.bankError })
    setMsg({ ok: true, text: t.bankSaved }); onSaved()
  }

  return (
    <form onSubmit={save} className="card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><Wallet size={16} className="text-brand" /> {t.bankTitle}</div>
      <p className="mt-1 text-xs text-muted">{t.bankSub}</p>
      <div className="mt-4 space-y-3">
        <div><label className="label">{t.bankHolder}</label><input className="input mt-1" value={f.holder} onChange={(e) => set('holder')(e.target.value)} placeholder={t.bankHolderPlaceholder} /></div>
        <div><label className="label">{t.bankIban}</label><input className="input mt-1 font-mono" value={f.iban} onChange={(e) => set('iban')(e.target.value)} placeholder="IT60X0542811101000000123456" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">{t.bankName}</label><input className="input mt-1" value={f.bankName} onChange={(e) => set('bankName')(e.target.value)} /></div>
          <div><label className="label">{t.bankCountry}</label><input className="input mt-1" value={f.country} onChange={(e) => set('country')(e.target.value)} placeholder="IT" /></div>
        </div>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
      <button className="btn btn-primary mt-4" disabled={busy}>{busy ? t.bankSaving : t.bankSave}</button>
    </form>
  )
}
