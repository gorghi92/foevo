'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, CreditCard, User, Shield, Gift, type LucideIcon } from 'lucide-react'

type NavItem = { href: string; label: string; icon: LucideIcon }

/* Le voci vivono qui, nel componente client: le icone sono componenti React e
 * non possono essere passate come prop da un Server Component. */
const MAIN: NavItem[] = [
  { href: '/dashboard', label: 'Analisi', icon: LayoutGrid },
  { href: '/billing', label: 'Piano', icon: CreditCard },
  { href: '/profile', label: 'Profilo', icon: User },
  { href: '/invita', label: 'Invita e guadagna', icon: Gift },
]
const ADMIN: NavItem[] = [{ href: '/admin', label: 'Superadmin', icon: Shield }]

function isActive(path: string, href: string) {
  return href === '/dashboard'
    ? path === '/dashboard' || path.startsWith('/analyses')
    : path === href || path.startsWith(`${href}/`)
}

function Items({ items, path }: { items: NavItem[]; path: string }) {
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

/** Voci della sidebar, con sezione amministrazione opzionale. */
export function SidebarNav({ admin = false }: { admin?: boolean }) {
  const path = usePathname()
  return (
    <>
      <Items items={MAIN} path={path} />
      {admin && (
        <>
          <div className="label mt-6 px-3 text-muted">Amministrazione</div>
          <div className="mt-2"><Items items={ADMIN} path={path} /></div>
        </>
      )}
    </>
  )
}

/** Barra di navigazione fissa in basso, solo su mobile. */
export function MobileNav({ admin = false }: { admin?: boolean }) {
  const path = usePathname()
  const items = admin ? [...MAIN, ...ADMIN] : MAIN
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
