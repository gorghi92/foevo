'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Flame, Trash2, Search, ImageOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState, ScoreRing } from '@/components/app/ui'
import { CHROME_STORE_URL } from '@/lib/links'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['app']['dashboard']

type Row = {
  id: string; url: string | null; title: string | null; status: string
  tier: string | null; screenshot_url: string | null; score_conversion: number | null; created_at: string
}

/** Sostituisce i segnaposto {n} / {shown} / {total} / {query} nelle frasi tradotte. */
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m))

const when = (s: string, t: Copy['grid'], dateLocale: string) => {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 1000)
  if (diff < 60) return t.ago.now
  if (diff < 3600) return fill(t.ago.minutes, { n: Math.floor(diff / 60) })
  if (diff < 86400) return fill(t.ago.hours, { n: Math.floor(diff / 3600) })
  if (diff < 604800) return fill(t.ago.days, { n: Math.floor(diff / 86400) })
  return new Date(s).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' })
}

function StatusBadge({ status, t }: { status: string; t: Copy['grid'] }) {
  if (status === 'done') return null
  const map: Record<string, { t: string; c: string; Icon: typeof RefreshCw }> = {
    processing: { t: t.statusProcessing, c: 'bg-amber-100 text-amber-700', Icon: RefreshCw },
    error: { t: t.statusError, c: 'bg-red-100 text-red-700', Icon: AlertTriangle },
  }
  const m = map[status] ?? { t: status, c: 'bg-line text-muted', Icon: RefreshCw }
  return (
    <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${m.c}`}>
      <m.Icon size={11} className={status === 'processing' ? 'animate-spin' : ''} /> {m.t}
    </span>
  )
}

export default function AnalysesGrid({
  initial, t, dateLocale,
}: { initial: Row[]; t: Copy; dateLocale: string }) {
  const [rows, setRows] = useState(initial)
  const [q, setQ] = useState('')
  const supabase = createClient()

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => `${r.title ?? ''} ${r.url ?? ''}`.toLowerCase().includes(s))
  }, [rows, q])

  async function remove(id: string) {
    if (!confirm(t.grid.deleteConfirm)) return
    setRows((r) => r.filter((x) => x.id !== id))
    await supabase.from('analyses').delete().eq('id', id)
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Flame}
        title={t.grid.emptyTitle}
        body={t.grid.emptyBody}
        action={
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {t.addToChrome}
          </a>
        }
      />
    )
  }

  return (
    <div>
      {rows.length > 5 && (
        <div className="mb-5 flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9"
              placeholder={t.grid.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted">{fill(t.grid.counter, { shown: filtered.length, total: rows.length })}</span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <div key={a.id} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg">
            <Link href={`/analyses/${a.id}`} className="relative block aspect-[4/3] overflow-hidden bg-bg">
              {a.screenshot_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.screenshot_url}
                  alt=""
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <span className="grid h-full place-items-center text-muted"><ImageOff size={22} /></span>
              )}
              <StatusBadge status={a.status} t={t.grid} />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/25 to-transparent" aria-hidden />
              <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-panel/95 p-0.5 shadow-sm backdrop-blur">
                <ScoreRing value={a.status === 'done' ? a.score_conversion : null} label={t.grid.scoreLabel} />
              </span>
            </Link>

            <div className="flex flex-1 flex-col p-4">
              <Link href={`/analyses/${a.id}`} className="truncate text-[15px] font-bold leading-snug hover:text-brand">
                {a.title || a.url || t.grid.untitled}
              </Link>
              <div className="mt-1 truncate text-xs text-muted">{(a.url || '').replace(/^https?:\/\//, '')}</div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <span className="rounded-md border border-line px-1.5 py-0.5 font-semibold">
                    {a.tier === 'premium' ? 'Premium' : 'Base'}
                  </span>
                  <span>{when(a.created_at, t.grid, dateLocale)}</span>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100"
                  title={t.grid.deleteAction}
                  aria-label={t.grid.deleteAction}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="card p-10 text-center text-sm text-muted">{fill(t.grid.noMatch, { query: q })}</p>
      )}
    </div>
  )
}
