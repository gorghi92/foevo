import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { m } from '@/lib/i18n/api'
import { serverError } from '@/lib/api-error'

export const runtime = 'nodejs'

/** Rende un'analisi pubblica e restituisce il path del link condivisibile. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: m('notAuthenticated') }, { status: 401 })

  const sc = createServiceClient()
  const { data: row } = await sc
    .from('analyses')
    .select('id, user_id, share_token, status')
    .eq('id', params.id)
    .maybeSingle()
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: m('analysisNotFound') }, { status: 404 })

  const token = (row.share_token as string) || randomBytes(12).toString('base64url')
  const { error } = await sc.from('analyses').update({ public: true, share_token: token }).eq('id', params.id)
  if (error) return serverError('analyses/[id]/share', error)

  return NextResponse.json({ path: `/a/${token}`, token, public: true })
}

/** Disattiva la condivisione pubblica (mantiene il token per un eventuale re-share). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: m('notAuthenticated') }, { status: 401 })
  const sc = createServiceClient()
  const { data: row } = await sc.from('analyses').select('user_id').eq('id', params.id).maybeSingle()
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: m('analysisNotFound') }, { status: 404 })
  const { error } = await sc.from('analyses').update({ public: false }).eq('id', params.id)
  if (error) return serverError('analyses/[id]/share', error)
  return NextResponse.json({ public: false })
}
