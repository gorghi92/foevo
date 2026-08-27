import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getUser } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { LayoutGrid, CreditCard, Shield, LogOut } from 'lucide-react'
import { ImpersonationBanner } from './impersonation-banner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const admin = isSuperadmin(user.email)
  const impersonating = cookies().get('imp_active')?.value || null

  const nav = [
    { href: '/dashboard', label: 'Analisi', icon: LayoutGrid },
    { href: '/billing', label: 'Piano', icon: CreditCard },
    ...(admin ? [{ href: '/admin', label: 'Superadmin', icon: Shield }] : []),
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
      <main className="min-w-0 flex-1">
        {impersonating && <ImpersonationBanner email={impersonating} />}
        <div className="px-5 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  )
}
