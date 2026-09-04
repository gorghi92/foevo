'use client'

import { useState } from 'react'
import { UserCheck } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['app']['shell']['impersonation']

export function ImpersonationBanner({ t, email }: { t: Copy; email: string }) {
  const [busy, setBusy] = useState(false)

  async function stop() {
    setBusy(true)
    const r = await fetch('/api/admin/impersonate/stop', { method: 'POST' })
    if (!r.ok) {
      setBusy(false)
      alert((await r.json().catch(() => ({})))?.error || t.error)
      return
    }
    window.location.href = '/admin/users'
  }

  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      <UserCheck size={16} className="shrink-0" />
      <span className="min-w-0 truncate">
        {t.actingAs} <strong className="font-semibold">{email}</strong> {t.note}
      </span>
      <button
        onClick={stop}
        disabled={busy}
        className="ml-auto shrink-0 rounded-lg border border-amber-400 bg-white/60 px-3 py-1 text-xs font-semibold hover:bg-white disabled:opacity-60"
      >
        {busy ? t.stopping : t.stop}
      </button>
    </div>
  )
}
