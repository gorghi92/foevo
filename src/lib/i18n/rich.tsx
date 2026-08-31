import { Fragment } from 'react'
import Link from 'next/link'

/**
 * Rende il micro-markup usato nei dizionari:
 * `**grassetto**`, `*corsivo*`, `` `codice` ``, `[etichetta](/percorso)` e `\n`
 * come andata a capo. Serve a tenere le frasi intere (e quindi traducibili)
 * invece di spezzarle in pezzi per infilarci il markup.
 *
 * I link che iniziano con `/` restano interni (next/link), gli altri escono
 * in una nuova scheda con `rel` di sicurezza.
 */
export function Rich({ text, strongClass = 'text-ink' }: { text: string; strongClass?: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {tokenize(line).map((tk, i) => {
            if (tk.kind === 'strong') return <b key={i} className={strongClass}>{tk.text}</b>
            if (tk.kind === 'em') return <i key={i}>{tk.text}</i>
            if (tk.kind === 'code') return <code key={i}>{tk.text}</code>
            if (tk.kind === 'link') {
              const cls = 'font-semibold text-brand'
              return tk.href!.startsWith('/') ? (
                <Link key={i} href={tk.href!} className={cls}>{tk.text}</Link>
              ) : (
                <a key={i} href={tk.href} className={cls} target="_blank" rel="noopener noreferrer">{tk.text}</a>
              )
            }
            return <Fragment key={i}>{tk.text}</Fragment>
          })}
        </Fragment>
      ))}
    </>
  )
}

type Token = { kind: 'text' | 'strong' | 'em' | 'code' | 'link'; text: string; href?: string }

const RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g

function tokenize(line: string): Token[] {
  const out: Token[] = []
  let last = 0
  for (const m of line.matchAll(RE)) {
    const i = m.index ?? 0
    if (i > last) out.push({ kind: 'text', text: line.slice(last, i) })
    const raw = m[0]
    if (raw.startsWith('**')) out.push({ kind: 'strong', text: raw.slice(2, -2) })
    else if (raw.startsWith('`')) out.push({ kind: 'code', text: raw.slice(1, -1) })
    else if (raw.startsWith('[')) {
      const cut = raw.indexOf('](')
      out.push({ kind: 'link', text: raw.slice(1, cut), href: raw.slice(cut + 2, -1) })
    } else out.push({ kind: 'em', text: raw.slice(1, -1) })
    last = i + raw.length
  }
  if (last < line.length) out.push({ kind: 'text', text: line.slice(last) })
  return out
}
