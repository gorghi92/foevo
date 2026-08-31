'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownCircle, XCircle } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['app']['billing']['actions']

export function DowngradeButton({ isWhop, t }: { isWhop: boolean; t: Copy }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function go() {
    const msg = t.downgradeConfirm + (isWhop ? t.downgradeWhopNote : '')
    if (!confirm(msg)) return
    setBusy(true)
    const res = await fetch('/api/billing/downgrade', { method: 'POST' })
    setBusy(false)
    if (!res.ok) return alert((await res.json().catch(() => ({})))?.error || t.error)
    router.refresh()
  }
  return (
    <button onClick={go} disabled={busy} className="btn btn-ghost px-3 py-1.5 text-[13px]">
      <ArrowDownCircle size={14} /> {busy ? t.downgradeBusy : t.downgrade}
    </button>
  )
}

export function CancelButton({ t }: { t: Copy }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function go() {
    if (!confirm(t.cancelConfirm)) return
    setBusy(true)
    const res = await fetch('/api/billing/cancel', { method: 'POST' })
    setBusy(false)
    if (!res.ok) return alert((await res.json().catch(() => ({})))?.error || t.error)
    router.refresh()
  }
  return (
    <button onClick={go} disabled={busy} className="btn btn-ghost px-3 py-1.5 text-[13px] text-red-600">
      <XCircle size={14} /> {busy ? t.cancelBusy : t.cancel}
    </button>
  )
}
