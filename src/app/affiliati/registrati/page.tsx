import { redirect } from 'next/navigation'
import { getAffiliate } from '@/lib/affiliate/auth'
import { RegisterForm } from '../auth-forms'

export const dynamic = 'force-dynamic'

export default async function AffiliateRegisterPage() {
  if (await getAffiliate()) redirect('/affiliati')
  return <RegisterForm />
}
