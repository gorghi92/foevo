'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

export type NavItem = { href: string; label: string; icon: LucideIcon }

function isActive(path: string, href: string) {
  return href === '/dashboard'
    ? path === '/dashboard' || path.startsWith('/analyses')
    : path === href || path.startsWith(`${href}/`)
}

/** Voci della sidebar con stato attivo. */
export function SidebarNav({ items }: { items: NavItem[] }) {
  const path = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {items.map((n) => {
        const active = isActive(path, n.href)
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              active ? 'bg-brand-soft font-semibold text-brand' : 'font-medium text-muted hover:bg-bg hover:text-ink'
            }`}
          >
            {active && <span className="heat-rule absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full" aria-hidden />}
            <n.icon size={17} className={active ? 'text-brand' : 'text-muted group-hover:text-ink'} />
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Barra di navigazione fissa in basso, solo su mobile. */
export function MobileNav({ items }: { items: NavItem[] }) {
  const path = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg">
        {items.map((n) => {
          const active = isActive(path, n.href)
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                active ? 'text-brand' : 'text-muted'
              }`}
            >
              <n.icon size={19} />
              {n.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
