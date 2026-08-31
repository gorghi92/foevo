import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { generateKey } from '@/server/api-key'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: m('notAuthenticated') }, { status: 401 })
  const { name } = (await req.json().catch(() => ({}))) as { name?: string }
  const { key, hash, prefix } = generateKey()
  const { data, error } = await createServiceClient()
    .from('api_keys')
    .insert({ user_id: user.id, name: name?.trim() || 'Estensione', key_hash: hash, prefix, scopes: ['analyze:write'] })
    .select('id, name, prefix, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ key, row: data })
}
