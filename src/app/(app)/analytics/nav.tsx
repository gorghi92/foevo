'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Flame, RefreshCw, type LucideIcon } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type NavCopy = Dictionary['app']['analytics']['nav']

const SUB: { href: string; key: keyof NavCopy; icon: LucideIcon; exact?: boolean }[] = [
  { href: '/analytics', key: 'overview', icon: LayoutDashboard, exact: true },
  { href: '/analytics/heatmap', key: 'heatmap', icon: Flame },
]

export function AnalyticsNav({ t }: { t: NavCopy }) {
  const path = usePathname()
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUB.map((s) => {
        const active = s.exact ? path === s.href : path.startsWith(s.href)
        return (
          <Link key={s.href} href={s.href}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${active ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-bg hover:text-ink'}`}>
            <s.icon size={15} /> {t[s.key]}
          </Link>
        )
      })}
    </div>
  )
}

/** Selettore intervallo (7/30/90 giorni) — aggiorna il query param ?d. */
export function RangePicker({ days, base, daysSuffix }: { days: number; base: string; daysSuffix: string }) {
  const opts = [7, 30, 90]
  return (
    <div className="inline-flex rounded-lg border border-line bg-panel p-0.5">
      {opts.map((d) => (
        <Link key={d} href={`${base}?d=${d}`} scroll={false}
          className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${d === days ? 'bg-brand text-brand-fg' : 'text-muted hover:text-ink'}`}>
          {d}{daysSuffix}
        </Link>
      ))}
    </div>
  )
}

/** Ricarica i dati del server component senza ricaricare la pagina:
 *  `router.refresh()` rifà solo la richiesta RSC, quindi scroll, filtri
 *  e stato dei client component (slider della heatmap) restano dove sono. */
export function RefreshButton({ t, locale }: { t: Dictionary['app']['analytics']['refresh']; locale: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [at, setAt] = useState<string | null>(null)

  // L'orario si calcola solo nel browser: sul server non conosciamo il fuso
  // dell'utente e due rese diverse romperebbero l'hydration.
  useEffect(() => {
    if (!pending) setAt(new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }))
  }, [pending, locale])

  return (
    <div className="flex items-center gap-2">
      {at && <span className="hidden text-[11px] text-muted sm:inline">{t.updatedAt.replace('{v}', at)}</span>}
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[13px] font-medium text-muted transition hover:text-ink disabled:opacity-60"
      >
        <RefreshCw size={14} className={pending ? 'animate-spin' : ''} />
        {pending ? t.pending : t.label}
      </button>
    </div>
  )
}
