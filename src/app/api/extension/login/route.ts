import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { generateKey } from '@/server/api-key'

export const runtime = 'nodejs'

/**
 * Login dell'estensione con le credenziali Foevo: valida email/password su
 * Supabase e restituisce una API key per il device. L'utente non deve più
 * creare/incollare chiavi a mano — l'estensione la ottiene con il login.
 */
export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
  if (!email || !password) return NextResponse.json({ error: 'Email e password richieste' }, { status: 400 })

  const sb = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error || !data?.user) return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })

  const userId = data.user.id
  const sc = createServiceClient()
  // Revoca le vecchie chiavi auto-emesse per l'estensione, poi ne emette una nuova.
  await sc.from('api_keys').update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId).eq('name', 'Estensione').is('revoked_at', null)

  const { key, hash, prefix } = generateKey()
  const { error: insErr } = await sc.from('api_keys')
    .insert({ user_id: userId, name: 'Estensione', key_hash: hash, prefix, scopes: ['analyze:write'] })
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ key, email: data.user.email })
}
