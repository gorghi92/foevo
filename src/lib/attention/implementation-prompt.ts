/**
 * Costruisce, dai soli dati già salvati nell'analisi, un prompt pronto da
 * incollare in un assistente di coding (Cursor, Claude Code, v0, Lovable…).
 *
 * Nessuna chiamata al modello: tutto ciò che serve è già in AttentionResult,
 * quindi il prompt si genera all'istante, a costo zero e anche per le analisi
 * fatte in passato.
 *
 * Regola di fondo: Foveo vede la pagina renderizzata, NON il codice sorgente.
 * Il prompt descrive quindi *cosa* cambiare e *perché*, e lascia all'assistente
 * il compito di trovare i componenti corrispondenti. Non inventiamo mai nomi di
 * file: sarebbero plausibili e sbagliati.
 */
import type { AttentionResult, Priority } from './types'

const PRIO_ORDER: Record<Priority, number> = { alta: 0, media: 1, bassa: 2 }

export interface PromptMeta {
  url?: string | null
  title?: string | null
}

const clean = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim()

/** Elenco puntato, saltando i valori vuoti. */
function bullets(items: (string | null | undefined)[], indent = ''): string[] {
  return items.map(clean).filter(Boolean).map((t) => `${indent}- ${t}`)
}

function section(title: string, lines: string[]): string[] {
  return lines.length ? ['', `## ${title}`, '', ...lines] : []
}

export function buildImplementationPrompt(result: AttentionResult, meta: PromptMeta = {}): string {
  const L: string[] = []
  const url = clean(meta.url)
  const title = clean(meta.title)

  L.push('# Interventi di ottimizzazione conversione')
  L.push('')
  L.push(
    'Sei uno sviluppatore frontend esperto di CRO. Devi applicare al codice di questa pagina ' +
    'gli interventi elencati sotto, che derivano da un\'analisi di attenzione visiva e conversione.',
  )
  L.push('')
  L.push(
    '**Importante:** chi ha prodotto questa analisi ha visto solo la pagina renderizzata, non il codice. ' +
    'Individua tu i componenti e i file corrispondenti nel progetto partendo dai testi e dalle sezioni ' +
    'citate. Non dare per scontata nessuna struttura di file.',
  )

  // ---- contesto ----
  const ctx = bullets([
    title && `Pagina: ${title}`,
    url && `URL: ${url}`,
    result.pageType && `Tipo di pagina: ${result.pageType}`,
    result.goal && `Obiettivo di conversione: ${result.goal}`,
    result.copy?.headline && `Headline attuale: "${clean(result.copy.headline)}"`,
    result.brand?.tone && `Tono di voce rilevato: ${result.brand.tone}`,
  ])
  const s = result.scores
  if (s) {
    ctx.push(
      `- Punteggi attuali (0-100): conversione ${s.conversion}, allineamento attenzione ` +
      `${s.attentionAlignment}, chiarezza ${s.clarity}, CTA ${s.cta}`,
    )
  }
  L.push(...section('Contesto', ctx))
  if (result.summary) L.push('', clean(result.summary))

  // ---- interventi, ordinati per priorità ----
  const recs = [...(result.recommendations ?? [])].sort(
    (a, b) => (PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9),
  )
  if (recs.length) {
    const lines: string[] = []
    recs.forEach((r, i) => {
      lines.push(`### ${i + 1}. ${clean(r.title)} — priorità ${r.priority}`)
      lines.push('')
      if (r.detail) lines.push(`**Cosa fare:** ${clean(r.detail)}`)
      if (r.impact) lines.push(`**Perché:** ${clean(r.impact)}`)
      lines.push('')
    })
    L.push(...section('Interventi richiesti (in ordine di impatto)', lines))
  }

  // ---- frizioni: hanno già un campo fix ----
  const fr = [...(result.frictions ?? [])].sort(
    (a, b) => (PRIO_ORDER[a.severity] ?? 9) - (PRIO_ORDER[b.severity] ?? 9),
  )
  if (fr.length) {
    const lines: string[] = []
    fr.forEach((f) => {
      lines.push(`- **${clean(f.area) || 'Pagina'}** (gravità ${f.severity}) — ${clean(f.description)}`)
      if (f.fix) lines.push(`  - Correzione: ${clean(f.fix)}`)
    })
    L.push(...section('Frizioni da rimuovere', lines))
  }

  // ---- copy ----
  const copyLines = [
    ...bullets((result.copy?.issues ?? []).map((x) => `Problema: ${x}`)),
    ...bullets((result.copy?.suggestions ?? []).map((x) => `Proposta: ${x}`)),
  ]
  L.push(...section('Copy', copyLines))

  // ---- CTA ----
  const ctas = (result.cta ?? []).filter((c) => clean(c.text) || c.issues?.length)
  if (ctas.length) {
    const lines: string[] = []
    ctas.forEach((c) => {
      const bits = [
        c.contrast != null && `contrasto ${c.contrast}`,
        c.visibility != null && `visibilità ${c.visibility}/100`,
      ].filter(Boolean).join(', ')
      lines.push(`- CTA "${clean(c.text)}"${bits ? ` — ${bits}` : ''}`)
      lines.push(...bullets(c.issues ?? [], '  '))
    })
    L.push(...section('Call to action', lines))
  }

  // ---- gerarchia visiva ----
  const zones = [...(result.attention?.zones ?? [])].sort((a, b) => b.score - a.score).slice(0, 8)
  if (zones.length) {
    const lines = zones.map((z, i) => {
      const r = clean(z.reason)
      return `- ${i + 1}. **${clean(z.label)}** — attenzione stimata ${z.score}/100${r ? `. ${r}` : ''}`
    })
    lines.push('')
    lines.push(
      'La gerarchia visiva deve rispecchiare l\'obiettivo di conversione: ciò che porta ' +
      'all\'azione principale va reso più evidente di ciò che non lo fa.',
    )
    L.push(...section('Gerarchia visiva attuale (dalla più notata)', lines))
  }

  // ---- vincoli ----
  const palette = (result.brand?.palette ?? [])
    .map((c) => `${clean(c.hex)}${c.role ? ` (${clean(c.role)})` : ''}`)
    .filter(Boolean)
  const fonts = (result.brand?.fonts ?? [])
    .map((f) => `${clean(f.family)}${f.usage ? ` (${clean(f.usage)})` : ''}`)
    .filter(Boolean)

  L.push(...section('Vincoli', [
    '- Non riscrivere la pagina da capo: applica modifiche mirate, mantenendo struttura e stile esistenti.',
    palette.length ? `- Mantieni la palette attuale: ${palette.join(', ')}.` : '',
    fonts.length ? `- Mantieni i font attuali: ${fonts.join(', ')}.` : '',
    result.brand?.tone ? `- Mantieni il tono di voce: ${clean(result.brand.tone)}.` : '',
    '- Scrivi i testi nella stessa lingua della pagina.',
    '- Non peggiorare l\'accessibilità: contrasto adeguato, ordine dei titoli coerente, testi alternativi.',
    '- Non introdurre dipendenze nuove se non necessarie.',
    '- Mantieni la resa su mobile: verifica ogni modifica anche a larghezze ridotte.',
  ].filter(Boolean)))

  // ---- criteri di accettazione ----
  L.push(...section('Criteri di accettazione', [
    '- Ogni intervento sopra è stato applicato, oppure è spiegato perché non era applicabile.',
    '- L\'azione principale è raggiungibile senza scorrere, su desktop e su mobile.',
    '- Nessuna regressione visiva nelle sezioni non toccate.',
    '- Al termine, elenca le modifiche fatte file per file.',
  ]))

  // ---- nota finale ----
  L.push('')
  L.push('---')
  L.push('')
  L.push(
    '_Questi interventi sono ipotesi basate su un\'analisi predittiva dell\'attenzione, ' +
    'non su dati di traffico reale. Dove possibile, verificali con un test A/B invece di ' +
    'darli per acquisiti._',
  )
  L.push('')
  L.push('_Generato da Foveo — foevo.app_')

  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
