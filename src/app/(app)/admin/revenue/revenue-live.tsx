'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Aggiornamento "quasi real-time": ricarica i dati dal DB ogni 30s
 *  (i webhook Whop aggiornano il DB, questa vista lo rilegge). */
export function RevenueLive() {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 30000)
    return () => clearInterval(t)
  }, [router])
  return <span className="inline-flex items-center gap-1 text-xs text-muted"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> live · aggiorna ogni 30s</span>
}
