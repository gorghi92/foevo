import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { LayoutGrid, KeyRound, CreditCard, Shield, BarChart3, LogOut } from 'lucide-react'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const admin = isSuperadmin(user.email)

  const nav = [
    { href: '/dashboard', label: 'Analisi', icon: LayoutGrid },
    { href: '/settings/api-keys', label: 'API key', icon: KeyRound },
    { href: '/billing', label: 'Piano', icon: CreditCard },
    ...(admin ? [
      { href: '/admin', label: 'Superadmin', icon: Shield },
      { href: '/admin/usage', label: 'Consumo', icon: BarChart3 },
    ] : []),
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-panel p-4 md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
          <span className="heat-dot h-7 w-7 rounded-lg" aria-hidden />
          <span className="font-display text-base font-extrabold">Foveo</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-ink">
              <n.icon size={17} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate px-3 text-xs text-muted">{user.email}</p>
          <form action="/auth/signout" method="post">
            <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-ink">
              <LogOut size={17} /> Esci
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  )
}
