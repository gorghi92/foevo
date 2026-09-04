import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getUser } from '@/lib/supabase/server'
import { resolveEntitlement, monthlyUsage, planLabel } from '@/server/store'
import { isSuperadmin } from '@/lib/superadmin'
import { unreadAlerts } from '@/lib/affiliate/admin'
import { LogOut } from 'lucide-react'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'
import { ImpersonationBanner } from './impersonation-banner'
import { SidebarNav, MobileNav } from '@/components/app/nav'
import { UsageMeter } from '@/components/app/ui'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const locale = getServerLocale()
  const t = getDictionary(locale).app.shell
  const admin = isSuperadmin(user.email)
  const impersonating = cookies().get('imp_active')?.value || null
  const [ent, used, alerts] = await Promise.all([
    resolveEntitlement(user.id),
    monthlyUsage(user.id),
    admin ? unreadAlerts(1).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 }),
  ])

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ---- sidebar (desktop) ---- */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-panel px-4 py-5 md:flex">
        <Link href="/dashboard" className="mb-7 flex items-center gap-2.5 px-2">
          <span className="heat-dot h-8 w-8 rounded-xl" aria-hidden />
          <span className="font-display text-base font-extrabold tracking-tight">Foevo</span>
        </Link>

        <SidebarNav t={t.nav} admin={admin} alertCount={alerts.count} />

        <div className="mt-auto space-y-3 pt-6">
          <UsageMeter t={t.usage} used={used} quota={ent.quota} unlimited={ent.unlimited} />
          <div className="border-t border-line pt-3">
            <div className="flex items-center gap-2.5 px-1">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold uppercase text-brand">
                {(user.email || '?').slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight">{user.email}</p>
                <p className="text-[11px] leading-tight text-muted">
                  {t.plan.replace('{name}', planLabel(ent))}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <form action="/auth/signout" method="post" className="min-w-0 flex-1">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-bg hover:text-ink">
                  <LogOut size={17} /> {t.logout}
                </button>
              </form>
              <LanguageSwitcher current={locale} />
            </div>
          </div>
        </div>
      </aside>

      {/* ---- contenuto ---- */}
      <main className="min-w-0 flex-1">
        {impersonating && <ImpersonationBanner t={t.impersonation} email={impersonating} />}

        {/* barra superiore (mobile) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-panel/95 px-5 py-3 backdrop-blur md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="heat-dot h-7 w-7 rounded-lg" aria-hidden />
            <span className="font-display text-base font-extrabold">Foevo</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={locale} />
            <form action="/auth/signout" method="post">
              <button className="flex items-center gap-1.5 text-sm font-medium text-muted" aria-label={t.logout}>
                <LogOut size={16} /> {t.logout}
              </button>
            </form>
          </div>
        </header>

        <div className="px-5 py-7 pb-24 md:px-9 md:py-9 md:pb-9">{children}</div>
      </main>

      <MobileNav t={t.nav} admin={admin} />
    </div>
  )
}
