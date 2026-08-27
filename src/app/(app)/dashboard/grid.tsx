'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Flame, Trash2, Search, ImageOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState, ScoreRing } from '@/components/app/ui'

type Row = {
  id: string; url: string | null; title: string | null; status: string
  tier: string | null; screenshot_url: string | null; score_conversion: number | null; created_at: string
}

const when = (s: string) => {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 1000)
  if (diff < 60) return 'ora'
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h fa`
  if (diff < 604800) return `${Math.floor(diff / 86400)} g fa`
  return new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'done') return null
  const map: Record<string, { t: string; c: string; Icon: typeof RefreshCw }> = {
    processing: { t: 'In corso', c: 'bg-amber-100 text-amber-700', Icon: RefreshCw },
    error: { t: 'Errore', c: 'bg-red-100 text-red-700', Icon: AlertTriangle },
  }
  const m = map[status] ?? { t: status, c: 'bg-line text-muted', Icon: RefreshCw }
  return (
    <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${m.c}`}>
      <m.Icon size={11} className={status === 'processing' ? 'animate-spin' : ''} /> {m.t}
    </span>
  )
}

export default function AnalysesGrid({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial)
  const [q, setQ] = useState('')
  const supabase = createClient()

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => `${r.title ?? ''} ${r.url ?? ''}`.toLowerCase().includes(s))
  }, [rows, q])

  async function remove(id: string) {
    if (!confirm('Eliminare questa analisi? L’azione è definitiva.')) return
    setRows((r) => r.filter((x) => x.id !== id))
    await supabase.from('analyses').delete().eq('id', id)
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Flame}
        title="Nessuna analisi, per ora"
        body="Apri una pagina nel browser e premi Analizza dall’estensione: heatmap, punteggio e raccomandazioni compariranno qui."
        action={
          <a href="/extension/foveo-attention.zip" download className="btn btn-primary">
            Scarica l’estensione
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
              placeholder="Cerca per titolo o indirizzo…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted">{filtered.length} di {rows.length}</span>
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
              <StatusBadge status={a.status} />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/25 to-transparent" aria-hidden />
              <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-panel/95 p-0.5 shadow-sm backdrop-blur">
                <ScoreRing value={a.status === 'done' ? a.score_conversion : null} label="Punteggio di conversione" />
              </span>
            </Link>

            <div className="flex flex-1 flex-col p-4">
              <Link href={`/analyses/${a.id}`} className="truncate text-[15px] font-bold leading-snug hover:text-brand">
                {a.title || a.url || 'Senza titolo'}
              </Link>
              <div className="mt-1 truncate text-xs text-muted">{(a.url || '').replace(/^https?:\/\//, '')}</div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <span className="rounded-md border border-line px-1.5 py-0.5 font-semibold">
                    {a.tier === 'premium' ? 'Premium' : 'Base'}
                  </span>
                  <span>{when(a.created_at)}</span>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100"
                  title="Elimina analisi"
                  aria-label="Elimina analisi"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="card p-10 text-center text-sm text-muted">Nessuna analisi corrisponde a “{q}”.</p>
      )}
    </div>
  )
}
