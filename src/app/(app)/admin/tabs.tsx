'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Image, BarChart3, Wallet, Package, SlidersHorizontal, ServerCog, Sparkles } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['app']['admin']['tabs']

export function AdminTabs({ t }: { t: Copy }) {
  const path = usePathname()
  const tabs = [
    { href: '/admin', label: t.overview, icon: LayoutDashboard },
    { href: '/admin/users', label: t.users, icon: Users },
    { href: '/admin/analyses', label: t.analyses, icon: Image },
    { href: '/admin/usage', label: t.usage, icon: BarChart3 },
    { href: '/admin/revenue', label: t.revenue, icon: Wallet },
    { href: '/admin/ai', label: t.ai, icon: Sparkles },
    { href: '/admin/packages', label: t.packages, icon: Package },
    { href: '/admin/settings', label: t.settings, icon: SlidersHorizontal },
    { href: '/admin/system', label: t.system, icon: ServerCog },
  ]
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-line pb-2">
      {tabs.map((tab) => {
        const active = tab.href === '/admin' ? path === '/admin' : path.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${active ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-bg hover:text-ink'}`}>
            <tab.icon size={15} /> {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
