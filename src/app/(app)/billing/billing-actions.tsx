'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownCircle, XCircle } from 'lucide-react'

export function DowngradeButton({ isWhop }: { isWhop: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function go() {
    const msg = 'Vuoi passare al piano Base?' + (isWhop ? '\n\nRicorda: gestisci/annulla anche l’abbonamento su Whop per fermare gli addebiti.' : '')
    if (!confirm(msg)) return
    setBusy(true)
    const res = await fetch('/api/billing/downgrade', { method: 'POST' })
    setBusy(false)
    if (!res.ok) return alert((await res.json().catch(() => ({})))?.error || 'Errore')
    router.refresh()
  }
  return (
    <button onClick={go} disabled={busy} className="btn btn-ghost px-3 py-1.5 text-[13px]">
      <ArrowDownCircle size={14} /> {busy ? 'Downgrade…' : 'Passa a Base'}
    </button>
  )
}

export function CancelButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function go() {
    if (!confirm('Vuoi annullare l’abbonamento?\n\nResterà attivo fino alla data di rinnovo, poi non verrà più rinnovato.')) return
    setBusy(true)
    const res = await fetch('/api/billing/cancel', { method: 'POST' })
    setBusy(false)
    if (!res.ok) return alert((await res.json().catch(() => ({})))?.error || 'Errore')
    router.refresh()
  }
  return (
    <button onClick={go} disabled={busy} className="btn btn-ghost px-3 py-1.5 text-[13px] text-red-600">
      <XCircle size={14} /> {busy ? 'Annullo…' : 'Annulla abbonamento'}
    </button>
  )
}
