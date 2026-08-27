'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Wallet, SlidersHorizontal } from 'lucide-react'

const SUB = [
  { href: '/affiliazione', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/affiliazione/lista', label: 'Affiliati', icon: Users },
  { href: '/affiliazione/pagamenti', label: 'Pagamenti', icon: Wallet },
  { href: '/affiliazione/impostazioni', label: 'Impostazioni', icon: SlidersHorizontal },
]

// True per la scheda dettaglio /affiliazione/<uuid> (che sta sotto "Affiliati").
const DETAIL = /^\/affiliazione\/[0-9a-fA-F-]{20,}$/

export function AffiliateAdminNav({ alertCount = 0 }: { alertCount?: number }) {
  const path = usePathname()
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUB.map((s) => {
        const active = s.exact
          ? path === s.href
          : s.href === '/affiliazione/lista'
            ? path.startsWith(s.href) || DETAIL.test(path)
            : path.startsWith(s.href)
        const badge = s.href === '/affiliazione/pagamenti' && alertCount > 0
        return (
          <Link key={s.href} href={s.href}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${active ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-bg hover:text-ink'}`}>
            <s.icon size={15} /> {s.label}
            {badge && (
              <span className="ml-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
                {alertCount}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
