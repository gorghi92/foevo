import { Fragment } from 'react'

/**
 * Rende il micro-markup usato nei dizionari: **grassetto**, *corsivo* e \n
 * come andata a capo. Serve a tenere le frasi intere (e traducibili) invece
 * di spezzarle in pezzi per infilarci il markup.
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
            return <Fragment key={i}>{tk.text}</Fragment>
          })}
        </Fragment>
      ))}
    </>
  )
}

type Token = { kind: 'text' | 'strong' | 'em'; text: string }

function tokenize(line: string): Token[] {
  const out: Token[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  for (const m of line.matchAll(re)) {
    const i = m.index ?? 0
    if (i > last) out.push({ kind: 'text', text: line.slice(last, i) })
    const raw = m[0]
    if (raw.startsWith('**')) out.push({ kind: 'strong', text: raw.slice(2, -2) })
    else out.push({ kind: 'em', text: raw.slice(1, -1) })
    last = i + raw.length
  }
  if (last < line.length) out.push({ kind: 'text', text: line.slice(last) })
  return out
}
