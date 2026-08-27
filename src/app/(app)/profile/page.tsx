import { getUser, createServiceClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getUser()
  const sc = createServiceClient()
  const { data: p } = await sc.from('profiles')
    .select('first_name, last_name, full_name, billing_name, billing_vat, billing_cf, billing_address, billing_city, billing_zip, billing_country')
    .eq('id', user!.id).maybeSingle()

  // Fallback: se non ci sono first/last ma c'è full_name, prova a spezzarlo.
  let first = p?.first_name || ''
  let last = p?.last_name || ''
  if (!first && !last && p?.full_name) { const parts = String(p.full_name).split(' '); first = parts.shift() || ''; last = parts.join(' ') }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Profilo</h1>
      <p className="mt-1 text-sm text-muted">Gestisci i tuoi dati, l’accesso e i dati di fatturazione.</p>
      <ProfileForm
        email={user!.email || ''}
        initial={{
          firstName: first, lastName: last,
          billingName: p?.billing_name || '', billingVat: p?.billing_vat || '', billingCf: p?.billing_cf || '',
          billingAddress: p?.billing_address || '', billingCity: p?.billing_city || '', billingZip: p?.billing_zip || '', billingCountry: p?.billing_country || '',
        }}
      />
    </div>
  )
}
