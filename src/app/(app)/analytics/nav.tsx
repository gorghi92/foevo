'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Flame, type LucideIcon } from 'lucide-react'
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
