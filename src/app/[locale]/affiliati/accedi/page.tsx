import { redirect } from 'next/navigation'
import { getAffiliate } from '@/lib/affiliate/auth'
import { LoginForm } from '../auth-forms'

export const dynamic = 'force-dynamic'

export default async function AffiliateLoginPage() {
  if (await getAffiliate()) redirect('/affiliati')
  return <LoginForm />
}
