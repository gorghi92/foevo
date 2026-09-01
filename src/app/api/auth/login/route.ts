import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { emailConfigured, sendEmail, magicLinkEmail } from '@/lib/email'
import { guard, ipKey, subjectKey } from '@/lib/rate-limit'
import { m, requestLocale } from '@/lib/i18n/api'
import { serverError } from '@/lib/api-error'

export const runtime = 'nodejs'

/**
 * Invia il link di accesso. Se Resend è configurato, manda un'email BRANDIZZATA
 * Foevo (mittente foevo.app, nessuna menzione Supabase). Altrimenti ripiega sul
 * magic link standard di Supabase, così il login funziona comunque.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; next?: string }
  const email = String(body.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return NextResponse.json({ error: m('invalidEmail') }, { status: 400 })

  // Il limite per IP chiude il sondaggio massivo (la risposta dice se l'account
  // esiste); quello per email evita di trasformare il login in un mezzo per
  // bombardare di messaggi la casella di qualcun altro.
  const blocked = await guard(req, [
    { bucket: 'magiclink-ip', key: ipKey(req), windowSeconds: 900, max: 15 },
    { bucket: 'magiclink-email', key: subjectKey(`email:${email}`), windowSeconds: 900, max: 5 },
  ])
  if (blocked) return blocked

  const next = body.next && body.next.startsWith('/') ? body.next : '/dashboard'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '')

  const sc = createServiceClient()
  const { data: prof } = await sc.from('profiles').select('id').ilike('email', email).maybeSingle()
  if (!prof) return NextResponse.json({ notfound: true })

  if (await emailConfigured()) {
    const { data: link, error } = await sc.auth.admin.generateLink({ type: 'magiclink', email })
    const tokenHash = (link as any)?.properties?.hashed_token as string | undefined
    if (error || !tokenHash) return serverError('auth/login generateLink', error)
    const cb = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent(next)}`
    const { subject, html } = magicLinkEmail(cb, requestLocale(req))
    const sent = await sendEmail({ to: email, subject, html })
    if (sent) return NextResponse.json({ ok: true, branded: true })
    // se l'invio brandizzato fallisce, ripiega sotto
  }

  // Fallback: magic link standard di Supabase.
  const supa = createClient()
  const { error } = await supa.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error) return serverError('auth/login signInWithOtp', error)
  return NextResponse.json({ ok: true, branded: false })
}
