'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

type Pkg = { id?: string; name: string; slug: string; tier: string; monthly_quota: number; unlimited: boolean; whop_plan_id: string | null; price_monthly: number; features: string[]; active: boolean; order_index: number }
type Copy = Dictionary['app']['admin']['packages']
const EMPTY: Pkg = { name: '', slug: '', tier: 'base', monthly_quota: 30, unlimited: false, whop_plan_id: '', price_monthly: 0, features: [], active: true, order_index: 0 }

export default function AdminPanel({ packages, entitlements, stats, t }: { packages: any[]; entitlements: any[]; stats: any; t: Copy }) {
  const router = useRouter()
  const [form, setForm] = useState<Pkg & { featuresText?: string }>({ ...EMPTY, featuresText: '' })
  const [ent, setEnt] = useState({ email: '', tier: 'premium', monthly_quota: 150, unlimited: false })
  const [busy, setBusy] = useState(false)

  async function savePkg(e: React.FormEvent) {
    e.preventDefault(); setBusy(true)
    const body = { ...form, features: (form.featuresText || '').split(',').map((s) => s.trim()).filter(Boolean) }
    const res = await fetch('/api/admin/package', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(false)
    if (!res.ok) return alert((await res.json()).error || t.error)
    setForm({ ...EMPTY, featuresText: '' }); router.refresh()
  }
  async function saveEnt(e: React.FormEvent) {
    e.preventDefault(); setBusy(true)
    const res = await fetch('/api/admin/entitlement', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ent) })
    setBusy(false)
    if (!res.ok) return alert((await res.json()).error || t.error)
    setEnt({ email: '', tier: 'premium', monthly_quota: 150, unlimited: false }); router.refresh()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t.title}</h2>
          <p className="text-sm text-muted"><Rich text={t.subtitle} strongClass="" /></p>
        </div>
        <Link href="/admin/settings" className="btn btn-ghost">{t.configureWhop}</Link>
      </div>
      <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-muted"><th className="p-3">{t.colName}</th><th>{t.colTier}</th><th>{t.colQuota}</th><th>{t.colPrice}</th><th>{t.colWhop}</th><th>{t.colActive}</th></tr></thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-b border-line/60 cursor-pointer hover:bg-bg"
                  onClick={() => setForm({ id: p.id, name: p.name, slug: p.slug, tier: p.tier, monthly_quota: p.monthly_quota, unlimited: p.unlimited, whop_plan_id: p.whop_plan_id || '', price_monthly: p.price_monthly, features: p.features || [], active: p.active, order_index: p.order_index, featuresText: (p.features || []).join(', ') })}>
                  <td className="p-3">{p.name}<div className="text-xs text-muted">{p.slug}</div></td>
                  <td>{p.tier}</td><td>{p.unlimited ? '∞' : p.monthly_quota}</td><td>{(p.price_monthly / 100).toFixed(0)}</td>
                  <td className="text-xs">{p.whop_plan_id || <span className="text-red-500">—</span>}</td><td>{p.active ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form onSubmit={savePkg} className="card space-y-2 p-4">
          <div className="font-semibold">{form.id ? t.editTitle : t.newTitle}</div>
          <input className="input" placeholder={t.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} required />
          <input className="input" placeholder={t.slugPlaceholder} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          <select className="input" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}><option value="base">base</option><option value="premium">premium</option></select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.unlimited} onChange={(e) => setForm({ ...form, unlimited: e.target.checked })} /> {t.unlimited}</label>
          {!form.unlimited && <input className="input" type="number" placeholder={t.quotaPlaceholder} value={form.monthly_quota} onChange={(e) => setForm({ ...form, monthly_quota: +e.target.value })} />}
          <input className="input" type="number" placeholder={t.pricePlaceholder} value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: +e.target.value })} />
          <input className="input" placeholder={t.planIdPlaceholder} value={form.whop_plan_id ?? ''} onChange={(e) => setForm({ ...form, whop_plan_id: e.target.value })} />
          <input className="input" placeholder={t.featuresPlaceholder} value={form.featuresText} onChange={(e) => setForm({ ...form, featuresText: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> {t.active}</label>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>{form.id ? t.save : t.create}</button>{form.id && <button type="button" className="btn btn-ghost" onClick={() => setForm({ ...EMPTY, featuresText: '' })}>{t.cancel}</button>}</div>
        </form>
      </div>

      <h2 className="mt-8 text-lg font-bold">{t.entitlementsTitle}</h2>
      <form onSubmit={saveEnt} className="card mt-3 flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1" style={{ minWidth: 220 }}><label className="label">{t.userEmail}</label><input className="input mt-1" placeholder={t.emailPlaceholder} value={ent.email} onChange={(e) => setEnt({ ...ent, email: e.target.value })} required /></div>
        <select className="input" style={{ width: 130 }} value={ent.tier} onChange={(e) => setEnt({ ...ent, tier: e.target.value })}><option value="base">base</option><option value="premium">premium</option></select>
        <input className="input" style={{ width: 110 }} type="number" placeholder={t.quotaShort} value={ent.monthly_quota} onChange={(e) => setEnt({ ...ent, monthly_quota: +e.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ent.unlimited} onChange={(e) => setEnt({ ...ent, unlimited: e.target.checked })} /> ∞</label>
        <button className="btn btn-primary" disabled={busy}>{t.assign}</button>
      </form>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-muted"><th className="p-3">{t.colUser}</th><th>{t.colTier}</th><th>{t.colQuota}</th><th>{t.colStatus}</th><th>{t.colSource}</th></tr></thead>
          <tbody>
            {entitlements.length === 0 && <tr><td className="p-3 text-muted" colSpan={5}>{t.entitlementsEmpty}</td></tr>}
            {entitlements.map((e: any) => (
              <tr key={e.user_id} className="border-b border-line/60"><td className="p-3">{e.email}</td><td>{e.tier}</td><td>{e.unlimited ? '∞' : e.monthly_quota}</td><td>{e.status}</td><td>{e.source}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
