'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownCircle } from 'lucide-react'

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
