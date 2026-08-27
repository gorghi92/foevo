'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Copy, Check, Download, Lock, ChevronDown } from 'lucide-react'
import { buildImplementationPrompt } from '@/lib/attention/implementation-prompt'

/**
 * "Prompt per l'AI": trasforma l'analisi in un prompt pronto da incollare in un
 * assistente di coding. Costruito interamente dai dati già presenti nel report,
 * quindi senza chiamate al modello e senza attesa.
 */
export function AiPrompt({
  result, url, title, premium,
}: { result: any; url?: string | null; title?: string | null; premium: boolean }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const prompt = useMemo(
    () => (premium && result ? buildImplementationPrompt(result, { url, title }) : ''),
    [premium, result, url, title],
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard negata: resta il testo visibile da selezionare a mano */
      setOpen(true)
    }
  }

  function download() {
    const slug = (title || url || 'foveo').toString().toLowerCase()
      .replace(/https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
    const blob = new Blob([prompt], { type: 'text/markdown;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `prompt-${slug || 'foveo'}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }

  const head = (
    <div className="flex items-center gap-2">
      <Sparkles size={17} className="text-brand" />
      <b className="text-[15px]">Prompt per l’AI</b>
      {!premium && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">Premium</span>}
    </div>
  )

  if (!premium) {
    return (
      <div className="card mt-5 p-5">
        {head}
        <p className="mt-2 max-w-2xl text-[13px] leading-snug text-muted">
          Trasforma questa analisi in un prompt dettagliato da incollare nel tuo assistente di coding
          (Cursor, Claude Code, Lovable, v0…): interventi ordinati per impatto, copy proposto, vincoli
          di brand e criteri di accettazione.
        </p>
        <Link href="/billing" className="btn btn-primary mt-4 px-3.5 py-2 text-[13px]">
          <Lock size={14} /> Passa a Premium
        </Link>
      </div>
    )
  }

  return (
    <div className="card mt-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {head}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copy} className="btn btn-primary px-3.5 py-2 text-[13px]">
            {copied ? <><Check size={14} /> Copiato</> : <><Copy size={14} /> Copia prompt</>}
          </button>
          <button onClick={download} className="btn btn-ghost px-3 py-2 text-[13px]">
            <Download size={14} /> .md
          </button>
          <button onClick={() => setOpen((v) => !v)} className="btn btn-ghost px-3 py-2 text-[13px]">
            <ChevronDown size={14} className={open ? 'rotate-180 transition' : 'transition'} />
            {open ? 'Nascondi' : 'Anteprima'}
          </button>
        </div>
      </div>

      <p className="mt-2 max-w-2xl text-[13px] leading-snug text-muted">
        Incollalo nel tuo assistente di coding: contiene gli interventi in ordine di impatto, il copy
        proposto, i vincoli di brand e i criteri di accettazione. Non contiene riferimenti a file del
        tuo progetto — è l’assistente a doverli individuare.
      </p>

      {open && (
        <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-line bg-bg p-3 text-[11.5px] leading-relaxed">
          {prompt}
        </pre>
      )}
    </div>
  )
}
