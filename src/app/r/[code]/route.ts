import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { registerClick } from '@/lib/affiliate/attribute'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REF_COOKIE = 'fv_ref'
const REF_DAYS = 60

/**
 * Link referral: /r/CODE. Registra il click, memorizza il codice in un cookie
 * (dura 60 giorni) e rimanda alla landing. Se il codice non è valido reindirizza
 * comunque, senza rivelare nulla.
 */
export async function GET(req: Request, { params }: { params: { code: string } }) {
  const code = String(params.code || '').toUpperCase().slice(0, 24)
  const url = new URL(req.url)
  const dest = new URL('/', url.origin)

  try {
    const sc = createServiceClient()
    const ok = await registerClick(sc, code)
    if (ok) {
      cookies().set(REF_COOKIE, code, {
        httpOnly: true, secure: true, sameSite: 'lax', path: '/',
        expires: new Date(Date.now() + REF_DAYS * 864e5),
      })
    }
  } catch (e) { console.error('[foevo] /r click', e) }

  return NextResponse.redirect(dest)
}
