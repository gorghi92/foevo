'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Flame } from 'lucide-react'

const SUB = [
  { href: '/analytics', label: 'Panoramica', icon: LayoutDashboard, exact: true },
  { href: '/analytics/heatmap', label: 'Heatmap', icon: Flame },
]

export function AnalyticsNav() {
  const path = usePathname()
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUB.map((s) => {
        const active = s.exact ? path === s.href : path.startsWith(s.href)
        return (
          <Link key={s.href} href={s.href}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${active ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-bg hover:text-ink'}`}>
            <s.icon size={15} /> {s.label}
          </Link>
        )
      })}
    </div>
  )
}

/** Selettore intervallo (7/30/90 giorni) — aggiorna il query param ?d. */
export function RangePicker({ days, base }: { days: number; base: string }) {
  const opts = [7, 30, 90]
  return (
    <div className="inline-flex rounded-lg border border-line bg-panel p-0.5">
      {opts.map((d) => (
        <Link key={d} href={`${base}?d=${d}`} scroll={false}
          className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${d === days ? 'bg-brand text-brand-fg' : 'text-muted hover:text-ink'}`}>
          {d}g
        </Link>
      ))}
    </div>
  )
}
