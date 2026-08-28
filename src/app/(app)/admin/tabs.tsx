'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Image, BarChart3, Wallet, Package, SlidersHorizontal, ServerCog, Sparkles } from 'lucide-react'

const TABS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utenti', icon: Users },
  { href: '/admin/analyses', label: 'Analisi', icon: Image },
  { href: '/admin/usage', label: 'Consumo', icon: BarChart3 },
  { href: '/admin/revenue', label: 'Ricavi', icon: Wallet },
  { href: '/admin/ai', label: 'AI', icon: Sparkles },
  { href: '/admin/packages', label: 'Pacchetti', icon: Package },
  { href: '/admin/settings', label: 'Impostazioni', icon: SlidersHorizontal },
  { href: '/admin/system', label: 'Sistema', icon: ServerCog },
]

export function AdminTabs() {
  const path = usePathname()
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-line pb-2">
      {TABS.map((t) => {
        const active = t.href === '/admin' ? path === '/admin' : path.startsWith(t.href)
        return (
          <Link key={t.href} href={t.href}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${active ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-bg hover:text-ink'}`}>
            <t.icon size={15} /> {t.label}
          </Link>
        )
      })}
    </div>
  )
}
