'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, CreditCard, User, Shield, Gift, Share2, BarChart3, type LucideIcon } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type NavItem = { href: string; label: string; icon: LucideIcon }
type Copy = Dictionary['app']['shell']['nav']

/* Le voci vivono qui, nel componente client: le icone sono componenti React e
 * non possono essere passate come prop da un Server Component. Le etichette
 * arrivano invece dal dizionario, passato dal layout. */
const main = (t: Copy): NavItem[] => [
  { href: '/dashboard', label: t.analyses, icon: LayoutGrid },
  { href: '/billing', label: t.billing, icon: CreditCard },
  { href: '/profile', label: t.profile, icon: User },
  { href: '/invita', label: t.invite, icon: Gift },
]
const adminItems = (t: Copy): NavItem[] => [
  { href: '/admin', label: t.superadmin, icon: Shield },
  { href: '/analytics', label: t.analytics, icon: BarChart3 },
  { href: '/affiliazione', label: t.affiliate, icon: Share2 },
]

function isActive(path: string, href: string) {
  if (href === '/dashboard') return path === '/dashboard' || path.startsWith('/analyses')
  return path === href || path.startsWith(`${href}/`)
}

function Items({ items, path, badges }: { items: NavItem[]; path: string; badges?: Record<string, number> }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((n) => {
        const active = isActive(path, n.href)
        const badge = badges?.[n.href] || 0
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
            {badge > 0 && (
              <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

/** Voci della sidebar, con sezione amministrazione opzionale. */
export function SidebarNav({ t, admin = false, alertCount = 0 }: { t: Copy; admin?: boolean; alertCount?: number }) {
  const path = usePathname()
  const badges = { '/affiliazione': alertCount }
  return (
    <>
      <Items items={main(t)} path={path} />
      {admin && (
        <>
          <div className="label mt-6 px-3 text-muted">{t.adminSection}</div>
          <div className="mt-2"><Items items={adminItems(t)} path={path} badges={badges} /></div>
        </>
      )}
    </>
  )
}

/** Barra di navigazione fissa in basso, solo su mobile. */
export function MobileNav({ t, admin = false }: { t: Copy; admin?: boolean }) {
  const path = usePathname()
  const items = admin ? [...main(t), ...adminItems(t)] : main(t)
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
