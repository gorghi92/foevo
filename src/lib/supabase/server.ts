import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookiesToSet = { name: string; value: string; options: CookieOptions }[]

const URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** RLS-respecting client bound to the current user's session cookies. */
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(URL(), ANON(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // called from a Server Component — safe to ignore, middleware refreshes the session
        }
      },
    },
  })
}

/** Service-role client — bypasses RLS. Server-only; never expose to the browser. */
export function createServiceClient() {
  return createServerClient(URL(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: { getAll() { return [] }, setAll() {} },
  })
}

export async function getUser() {
  const { data } = await createClient().auth.getUser()
  return data.user
}
