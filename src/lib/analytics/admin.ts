import { createServiceClient } from '@/lib/supabase/server'

/**
 * Aggregazioni per la dashboard analytics del superadmin.
 * Con traffico contenuto è più semplice e robusto leggere le righe della
 * finestra temporale e aggregare in JS (un'unica query alimenta tutta la
 * dashboard). Le letture sono limitate per sicurezza.
 */

const READ_CAP = 200000

type Row = {
  visitor_id: string
  session_id: string
  kind: string
  path: string
  referrer_host: string | null
  utm_source: string | null
  utm_campaign: string | null
  device: string | null
  browser: string | null
  os: string | null
  country: string | null
  dur_ms: number | null
  created_at: string
}

export interface Overview {
  visitors: number
  sessions: number
  pageviews: number
  avgSessionSec: number
  bounceRate: number
  pagesPerSession: number
  activeNow: number
  deltas: { visitors: number; sessions: number; pageviews: number } // variazione % vs periodo precedente
  series: { date: string; visitors: number; pageviews: number }[]
  topPages: { path: string; views: number; visitors: number; avgSec: number }[]
  sources: { label: string; visitors: number; kind: 'direct' | 'referral' | 'campaign' }[]
  devices: { label: string; value: number }[]
  browsers: { label: string; value: number }[]
  countries: { label: string; value: number }[]
  recent: { path: string; device: string; country: string | null; ago: number }[]
}

const dayKey = (iso: string) => iso.slice(0, 10)

async function fetchWindow(sinceIso: string): Promise<Row[]> {
  const sc = createServiceClient()
  const { data } = await sc
    .from('analytics_events')
    .select('visitor_id,session_id,kind,path,referrer_host,utm_source,utm_campaign,device,browser,os,country,dur_ms,created_at')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })
    .limit(READ_CAP)
  return (data as Row[]) ?? []
}

function topN<V>(map: Map<string, V>, n: number, val: (v: V) => number): [string, V][] {
  return Array.from(map.entries()).sort((a, b) => val(b[1]) - val(a[1])).slice(0, n)
}

export async function analyticsOverview(days = 30): Promise<Overview> {
  const now = Date.now()
  const winMs = days * 86400000
  const since = new Date(now - winMs)
  const prevSince = new Date(now - winMs * 2)

  // Una sola lettura copre periodo corrente + precedente (per i delta).
  const all = await fetchWindow(prevSince.toISOString()).catch(() => [] as Row[])
  const cur = all.filter((r) => new Date(r.created_at).getTime() >= since.getTime())
  const prev = all.filter((r) => new Date(r.created_at).getTime() < since.getTime())

  const o = aggregate(cur, days, now)
  const p = aggregate(prev, days, now)
  const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0)

  return {
    ...o,
    deltas: {
      visitors: pct(o.visitors, p.visitors),
      sessions: pct(o.sessions, p.sessions),
      pageviews: pct(o.pageviews, p.pageviews),
    },
  }
}

function aggregate(rows: Row[], days: number, now: number): Omit<Overview, 'deltas'> {
  const visitors = new Set<string>()
  const sessions = new Map<string, { first: number; last: number; views: number; durSum: number }>()
  let pageviews = 0

  const pageViews = new Map<string, number>()
  const pageVisitors = new Map<string, Set<string>>()
  const pageDur = new Map<string, { sum: number; n: number }>()
  const seriesMap = new Map<string, { v: Set<string>; pv: number }>()
  const srcCampaign = new Map<string, Set<string>>()
  const srcReferral = new Map<string, Set<string>>()
  const directVisitors = new Set<string>()
  const devices = new Map<string, Set<string>>()
  const browsers = new Map<string, Set<string>>()
  const countries = new Map<string, Set<string>>()
  const recent: { path: string; device: string; country: string | null; ago: number }[] = []
  const activeNow = new Set<string>()
  const fiveMinAgo = now - 5 * 60000

  // giorni della serie (anche vuoti)
  for (let i = days - 1; i >= 0; i--) {
    const k = new Date(now - i * 86400000).toISOString().slice(0, 10)
    seriesMap.set(k, { v: new Set(), pv: 0 })
  }

  for (const r of rows) {
    visitors.add(r.visitor_id)
    const t = new Date(r.created_at).getTime()
    if (t >= fiveMinAgo) activeNow.add(r.visitor_id)

    const ss = sessions.get(r.session_id) ?? { first: t, last: t, views: 0, durSum: 0 }
    ss.first = Math.min(ss.first, t)
    ss.last = Math.max(ss.last, t)
    if (r.kind === 'ping') ss.durSum += r.dur_ms || 0
    sessions.set(r.session_id, ss)

    if (r.device) devices.set(r.device, (devices.get(r.device) ?? new Set()).add(r.visitor_id))
    if (r.browser) browsers.set(r.browser, (browsers.get(r.browser) ?? new Set()).add(r.visitor_id))
    if (r.country) countries.set(r.country, (countries.get(r.country) ?? new Set()).add(r.visitor_id))

    if (r.kind === 'pageview') {
      pageviews++
      ss.views++
      pageViews.set(r.path, (pageViews.get(r.path) ?? 0) + 1)
      pageVisitors.set(r.path, (pageVisitors.get(r.path) ?? new Set()).add(r.visitor_id))
      const day = seriesMap.get(dayKey(r.created_at))
      if (day) { day.v.add(r.visitor_id); day.pv++ }
      // sorgente (valutata sui pageview, che portano i campi utm/referrer)
      if (r.utm_campaign || r.utm_source) {
        const label = r.utm_campaign || r.utm_source!
        srcCampaign.set(label, (srcCampaign.get(label) ?? new Set()).add(r.visitor_id))
      } else if (r.referrer_host) {
        srcReferral.set(r.referrer_host, (srcReferral.get(r.referrer_host) ?? new Set()).add(r.visitor_id))
      }
    }
    if (r.kind === 'ping') {
      const pd = pageDur.get(r.path) ?? { sum: 0, n: 0 }
      pd.sum += r.dur_ms || 0; pd.n++
      pageDur.set(r.path, pd)
    }
    if (recent.length < 12 && r.kind === 'pageview') {
      recent.push({ path: r.path, device: r.device || '—', country: r.country, ago: Math.round((now - t) / 1000) })
    }
  }

  // Chi non ha lasciato referrer né utm su nessun pageview → diretto.
  const withSource = new Set<string>()
  srcCampaign.forEach((set) => set.forEach((v) => withSource.add(v)))
  srcReferral.forEach((set) => set.forEach((v) => withSource.add(v)))
  visitors.forEach((v) => { if (!withSource.has(v)) directVisitors.add(v) })

  const sessArr = Array.from(sessions.values())
  const durs = sessArr.map((s) => (s.durSum > 0 ? s.durSum : s.last - s.first))
  const avgSessionSec = sessArr.length ? Math.round(durs.reduce((a, b) => a + b, 0) / sessArr.length / 1000) : 0
  const bounced = sessArr.filter((s) => s.views <= 1).length
  const bounceRate = sessArr.length ? bounced / sessArr.length : 0
  const pagesPerSession = sessArr.length ? pageviews / sessArr.length : 0

  const series = Array.from(seriesMap.entries()).map(([date, d]) => ({ date, visitors: d.v.size, pageviews: d.pv }))

  const topPages = topN(pageViews, 12, (v) => v).map(([path, views]) => {
    const pd = pageDur.get(path)
    return {
      path,
      views,
      visitors: pageVisitors.get(path)?.size ?? 0,
      avgSec: pd && pd.n ? Math.round(pd.sum / pd.n / 1000) : 0,
    }
  })

  const sources = [
    ...(directVisitors.size ? [{ label: 'Diretto', visitors: directVisitors.size, kind: 'direct' as const }] : []),
    ...topN(srcCampaign, 6, (v) => v.size).map(([label, set]) => ({ label, visitors: set.size, kind: 'campaign' as const })),
    ...topN(srcReferral, 8, (v) => v.size).map(([label, set]) => ({ label, visitors: set.size, kind: 'referral' as const })),
  ].sort((a, b) => b.visitors - a.visitors).slice(0, 10)

  return {
    visitors: visitors.size,
    sessions: sessions.size,
    pageviews,
    avgSessionSec,
    bounceRate,
    pagesPerSession,
    activeNow: activeNow.size,
    series,
    topPages,
    sources,
    devices: topN(devices, 5, (v) => v.size).map(([label, set]) => ({ label, value: set.size })),
    browsers: topN(browsers, 6, (v) => v.size).map(([label, set]) => ({ label, value: set.size })),
    countries: topN(countries, 8, (v) => v.size).map(([label, set]) => ({ label, value: set.size })),
    recent,
  }
}

/** Elenco dei percorsi tracciati con conteggio pageview, per il selettore heatmap. */
export async function trackedPaths(days = 30): Promise<{ path: string; views: number }[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const sc = createServiceClient()
  const { data } = await sc
    .from('analytics_events')
    .select('path')
    .eq('kind', 'pageview')
    .gte('created_at', since)
    .limit(READ_CAP)
  const m = new Map<string, number>()
  for (const r of (data as { path: string }[]) ?? []) m.set(r.path, (m.get(r.path) ?? 0) + 1)
  return Array.from(m.entries()).map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views)
}

export interface HeatmapData {
  path: string
  points: { x: number; y: number }[]        // x,y in frazione 0..1 della pagina
  clicks: number
  pageviews: number
  scrollBuckets: number[]                    // 10 bucket: % di sessioni che ha raggiunto quel 10%
  scrollSamples: number
}

/** Dati per la heatmap di una pagina: click normalizzati + profondità di scroll. */
export async function heatmapData(path: string, days = 30, device?: string): Promise<HeatmapData> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const sc = createServiceClient()

  let clickQ = sc.from('analytics_events')
    .select('x_pct,y_px,doc_h,device')
    .eq('kind', 'click').eq('path', path).gte('created_at', since)
    .not('x_pct', 'is', null).limit(8000)
  if (device && device !== 'all') clickQ = clickQ.eq('device', device)
  const { data: clicks } = await clickQ

  let scrollQ = sc.from('analytics_events')
    .select('scroll_pct,device')
    .eq('kind', 'scroll').eq('path', path).gte('created_at', since)
    .not('scroll_pct', 'is', null).limit(READ_CAP)
  if (device && device !== 'all') scrollQ = scrollQ.eq('device', device)
  const { data: scrolls } = await scrollQ

  let pvQ = sc.from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'pageview').eq('path', path).gte('created_at', since)
  if (device && device !== 'all') pvQ = pvQ.eq('device', device)
  const { count: pageviews } = await pvQ

  const points = ((clicks as { x_pct: number; y_px: number; doc_h: number }[]) ?? [])
    .map((c) => ({ x: c.x_pct, y: c.doc_h > 0 ? Math.min(1, c.y_px / c.doc_h) : 0 }))

  // profondità di scroll: per ogni campione, i bucket fino alla soglia raggiunta.
  const buckets = new Array(10).fill(0)
  const samples = (scrolls as { scroll_pct: number }[]) ?? []
  for (const sms of samples) {
    const reached = Math.min(10, Math.floor((sms.scroll_pct || 0) / 10) + 1)
    for (let b = 0; b < reached; b++) buckets[b]++
  }
  const scrollBuckets = buckets.map((n) => (samples.length ? Math.round((n / samples.length) * 100) : 0))

  return {
    path,
    points,
    clicks: points.length,
    pageviews: pageviews ?? 0,
    scrollBuckets,
    scrollSamples: samples.length,
  }
}
