'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Flame, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Row = {
  id: string; url: string | null; title: string | null; status: string
  tier: string | null; screenshot_url: string | null; score_conversion: number | null; created_at: string
}
const STATUS: Record<string, string> = { processing: 'In corso', done: 'Pronta', error: 'Errore' }
function scoreColor(v: number | null) { return v == null ? 'text-muted' : v >= 70 ? 'text-emerald-500' : v >= 45 ? 'text-amber-500' : 'text-red-500' }

export default function AnalysesGrid({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial)
  const supabase = createClient()

  async function remove(id: string) {
    if (!confirm('Eliminare questa analisi?')) return
    setRows((r) => r.filter((x) => x.id !== id))
    await supabase.from('analyses').delete().eq('id', id)
  }

  if (rows.length === 0) {
    return (
      <div className="card grid place-items-center gap-2 p-12 text-center text-muted">
        <Flame size={28} className="opacity-50" />
        <p>Nessuna analisi ancora. Generane una dall’estensione Chrome.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((a) => (
        <div key={a.id} className="card flex flex-col overflow-hidden">
          <Link href={`/analyses/${a.id}`} className="relative block aspect-[4/3] overflow-hidden bg-bg">
            {a.screenshot_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.screenshot_url} alt="" className="h-full w-full object-cover object-top" />
            ) : <span className="grid h-full place-items-center text-muted"><Flame size={22} /></span>}
            <span className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-xs font-bold text-white"
              style={{ background: a.status === 'done' ? '#16a34a' : a.status === 'error' ? '#dc2626' : '#d97706' }}>
              {STATUS[a.status] ?? a.status}
            </span>
          </Link>
          <div className="flex flex-1 flex-col gap-1.5 p-3">
            <div className="truncate text-sm font-semibold">{a.title || a.url || 'Senza titolo'}</div>
            <div className="truncate text-xs text-muted">{(a.url || '').replace(/^https?:\/\//, '')}</div>
            <div className="mt-auto flex items-center justify-between pt-1.5 text-sm">
              <span>Conversione <b className={scoreColor(a.score_conversion)}>{a.score_conversion ?? '—'}</b>
                <span className="ml-1.5 text-muted">· {a.tier === 'premium' ? 'Premium' : 'Base'}</span>
              </span>
              <button onClick={() => remove(a.id)} className="text-muted hover:text-red-500" title="Elimina"><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
