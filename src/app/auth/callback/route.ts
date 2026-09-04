import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Handles passwordless magic-link / OAuth redirect (PKCE code exchange or OTP token_hash).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') || '/dashboard'
  const supabase = createClient()

  let ok = false
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    ok = !error
  }

  if (ok) {
    // Salva nome/cognome dal metadata al profilo (se non già presente).
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim()
      if (user && fullName) {
        const sc = createServiceClient()
        const { data: prof } = await sc.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
        if (!prof?.full_name) await sc.from('profiles').update({ full_name: fullName }).eq('id', user.id)
      }
    } catch { /* non bloccare l'accesso per questo */ }
    return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
