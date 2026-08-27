'use client'

import { useState } from 'react'
import { UserCheck } from 'lucide-react'

export function ImpersonationBanner({ email }: { email: string }) {
  const [busy, setBusy] = useState(false)

  async function stop() {
    setBusy(true)
    const r = await fetch('/api/admin/impersonate/stop', { method: 'POST' })
    if (!r.ok) {
      setBusy(false)
      alert((await r.json().catch(() => ({})))?.error || 'Errore')
      return
    }
    window.location.href = '/admin/users'
  }

  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      <UserCheck size={16} className="shrink-0" />
      <span className="min-w-0 truncate">
        Stai operando come <strong className="font-semibold">{email}</strong> (impersonificazione superadmin)
      </span>
      <button
        onClick={stop}
        disabled={busy}
        className="ml-auto shrink-0 rounded-lg border border-amber-400 bg-white/60 px-3 py-1 text-xs font-semibold hover:bg-white disabled:opacity-60"
      >
        {busy ? 'Ripristino…' : 'Torna al mio account'}
      </button>
    </div>
  )
}
