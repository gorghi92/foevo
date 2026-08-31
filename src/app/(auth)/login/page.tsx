import { Suspense } from 'react'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { LoginForm } from './login-form'

/**
 * La pagina è un Server Component solo per leggere la lingua dell'utente:
 * il form vive nel client, dove servono stato e `useSearchParams`.
 */
export default function LoginPage() {
  const d = getDictionary(getServerLocale())
  return (
    <Suspense fallback={<div className="text-sm text-muted">{d.common.loading}</div>}>
      <LoginForm t={d.app.auth.login} />
    </Suspense>
  )
}
