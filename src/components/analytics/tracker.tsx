'use client'

/**
 * Tracker analytics first-party, leggero e senza cookie di terze parti.
 * Registra: pageview (con sorgente/UTM/device), durata sulla pagina, click
 * (posizione, per la heatmap) e profondità di scroll. Gli eventi sono
 * accodati e spediti in batch con sendBeacon (così partono anche alla chiusura).
 *
 * Privacy: id casuali in localStorage/sessionStorage, nessun IP salvato,
 * rispetta Do-Not-Track e il flag localStorage `foevo_notrack`.
 */

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const ENDPOINT = '/api/analytics/collect'
const SESSION_TTL = 30 * 60 * 1000 // 30 minuti di inattività = nuova sessione
const MAX_CLICKS = 200 // tetto per sessione, evita flood
const FLUSH_MS = 4000

type Evt = Record<string, unknown>

function uid(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }
}

function detect() {
  const ua = navigator.userAgent
  const w = window.innerWidth
  let device: 'mobile' | 'tablet' | 'desktop' = 'desktop'
  if (/Mobi|Android|iPhone|iPod/i.test(ua) && w < 768) device = 'mobile'
  else if (/iPad|Tablet|Android/i.test(ua) && w < 1100) device = 'tablet'

  let browser = 'Altro'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua)) browser = 'Safari'

  let os = 'Altro'
  if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
  else if (/Linux/.test(ua)) os = 'Linux'

  return { device, browser, os }
}

function disabled(): boolean {
  // Dentro un iframe (es. anteprima heatmap del superadmin) non tracciamo:
  // evita di inquinare i dati con le visite di chi analizza.
  try { if (window.top !== window.self) return true } catch { return true }
  try {
    if (localStorage.getItem('foevo_notrack') === '1') return true
  } catch { /* storage bloccato */ }
  const dnt = (navigator as any).doNotTrack || (window as any).doNotTrack
  return dnt === '1' || dnt === 'yes'
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const ready = useRef(false)
  const queue = useRef<Evt[]>([])
  const meta = useRef({ vid: '', sid: '', device: 'desktop', browser: '', os: '' })
  const page = useRef({ path: '', start: 0, maxScroll: 0, clicks: 0, firstOfSession: false })

  // ---- inizializzazione una tantum: sessione, listener, flush, unload ----
  useEffect(() => {
    if (ready.current || disabled()) return
    ready.current = true

    // visitor persistente
    let vid = ''
    try {
      vid = localStorage.getItem('foevo_vid') || ''
      if (!vid) { vid = uid(); localStorage.setItem('foevo_vid', vid) }
    } catch { vid = uid() }

    // sessione con scadenza scorrevole
    let sid = '', fresh = true
    try {
      const now = Date.now()
      const last = Number(sessionStorage.getItem('foevo_sid_ts') || 0)
      sid = sessionStorage.getItem('foevo_sid') || ''
      if (sid && now - last < SESSION_TTL) fresh = false
      else sid = uid()
      sessionStorage.setItem('foevo_sid', sid)
      sessionStorage.setItem('foevo_sid_ts', String(now))
    } catch { sid = uid() }

    const d = detect()
    meta.current = { vid, sid, ...d }
    page.current.firstOfSession = fresh

    const touchSession = () => { try { sessionStorage.setItem('foevo_sid_ts', String(Date.now())) } catch {} }

    const onClick = (e: MouseEvent) => {
      if (page.current.clicks >= MAX_CLICKS) return
      page.current.clicks++
      const docW = document.documentElement.scrollWidth || window.innerWidth || 1
      const docH = document.documentElement.scrollHeight || window.innerHeight || 1
      push({
        k: 'click',
        x: Math.min(1, Math.max(0, e.pageX / docW)),
        y: Math.round(e.pageY),
        dh: docH,
      })
      touchSession()
    }

    const onScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop || 0
      const h = (document.documentElement.scrollHeight || 1) - window.innerHeight
      const pct = h > 0 ? Math.round((st / h) * 100) : 100
      if (pct > page.current.maxScroll) page.current.maxScroll = Math.min(100, pct)
    }

    const onHide = () => { if (document.visibilityState === 'hidden') finalize() }

    document.addEventListener('click', onClick, { capture: true, passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', finalize)

    const timer = window.setInterval(flush, FLUSH_MS)

    return () => {
      document.removeEventListener('click', onClick, { capture: true } as any)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', finalize)
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- cambio pagina: chiude la precedente, apre pageview nuova ----
  useEffect(() => {
    if (!ready.current || disabled()) return
    if (page.current.path) finalize() // pagina precedente
    startPage(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  function startPage(path: string) {
    page.current = { path, start: Date.now(), maxScroll: 0, clicks: 0, firstOfSession: page.current.firstOfSession }
    const first = page.current.firstOfSession
    page.current.firstOfSession = false
    const url = new URL(window.location.href)
    const g = (k: string) => url.searchParams.get(k) || undefined
    let rh: string | undefined
    try { rh = document.referrer ? new URL(document.referrer).hostname : undefined } catch {}
    push({
      k: 'pageview',
      r: first ? document.referrer || undefined : undefined,
      rh: first ? rh : undefined,
      us: g('utm_source'), um: g('utm_medium'), uc: g('utm_campaign'),
      sw: window.screen?.width, vw: window.innerWidth, vh: window.innerHeight,
    })
  }

  function finalize() {
    const p = page.current
    if (!p.path || !p.start) { flush(); return }
    const dur = Date.now() - p.start
    if (dur > 500) push({ k: 'ping', dm: Math.min(dur, 1000 * 60 * 30) })
    if (p.maxScroll > 0) push({ k: 'scroll', sc: p.maxScroll, dm: Math.min(dur, 1000 * 60 * 30) })
    flush(true)
  }

  function push(e: Evt) {
    const m = meta.current
    queue.current.push({ v: m.vid, s: m.sid, p: page.current.path || location.pathname, d: m.device, b: m.browser, o: m.os, ...e })
    if (queue.current.length >= 20) flush()
  }

  function flush(beacon = false) {
    if (!queue.current.length) return
    const batch = queue.current.splice(0, queue.current.length)
    const body = JSON.stringify({ events: batch })
    try {
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
        return
      }
    } catch { /* ricade su fetch */ }
    fetch(ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {})
  }

  return null
}
