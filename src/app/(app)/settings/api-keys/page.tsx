import { createClient } from '@/lib/supabase/server'
import ApiKeys from './keys'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('api_keys')
    .select('id, name, prefix, created_at, revoked_at, last_used_at')
    .order('created_at', { ascending: false })
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">API key</h1>
      <p className="mt-1 text-sm text-muted">Le chiavi collegano l’estensione Chrome al tuo account. Il segreto si vede una sola volta.</p>
      <ApiKeys initial={data ?? []} />
    </div>
  )
}
