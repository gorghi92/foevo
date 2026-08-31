import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { AdminTabs } from './tabs'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) redirect('/dashboard')

  const dict = getDictionary(getServerLocale())
  const t = dict.app.admin.layout

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-1 flex items-center gap-2">
        <span className="heat-dot h-6 w-6 rounded-lg" aria-hidden />
        <h1 className="text-xl font-extrabold">{t.title}</h1>
        <span className="ml-auto truncate text-xs text-muted">{user?.email}</span>
      </div>
      <p className="mb-4 text-sm text-muted">{t.subtitle}</p>
      <AdminTabs t={dict.app.admin.tabs} />
      <div className="mt-5">{children}</div>
    </div>
  )
}
