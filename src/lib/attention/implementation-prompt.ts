/**
 * Costruisce, dai soli dati già salvati nell'analisi, un prompt pronto da
 * incollare in un assistente di coding (Cursor, Claude Code, v0, Lovable…).
 *
 * Nessuna chiamata al modello: tutto ciò che serve è già in AttentionResult,
 * quindi il prompt si genera all'istante, a costo zero e anche per le analisi
 * fatte in passato.
 *
 * Regola di fondo: Foevo vede la pagina renderizzata, NON il codice sorgente.
 * Il prompt descrive quindi *cosa* cambiare e *perché*, e lascia all'assistente
 * il compito di trovare i componenti corrispondenti. Non inventiamo mai nomi di
 * file: sarebbero plausibili e sbagliati.
 *
 * Il prompt è bilingue: segue la lingua dell'utente, così l'assistente di coding
 * riceve istruzioni nella stessa lingua in cui l'utente legge il report.
 */
import type { AttentionResult, Priority } from './types'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

// Le priorità arrivano dal modello, che può rispondere in italiano o in inglese.
const PRIO_ORDER: Record<string, number> = {
  alta: 0, media: 1, bassa: 2,
  high: 0, medium: 1, low: 2,
}

/** Etichetta leggibile della priorità nella lingua del prompt. */
const PRIO_LABEL: Record<Locale, Record<Priority, string>> = {
  it: { alta: 'alta', media: 'media', bassa: 'bassa' },
  en: { alta: 'high', media: 'medium', bassa: 'low' },
}

const COPY_IT = {
  h1: '# Interventi di ottimizzazione conversione',
  role:
    'Sei uno sviluppatore frontend esperto di CRO. Devi applicare al codice di questa pagina ' +
    'gli interventi elencati sotto, che derivano da un\'analisi di attenzione visiva e conversione.',
  caveat:
    '**Importante:** chi ha prodotto questa analisi ha visto solo la pagina renderizzata, non il codice. ' +
    'Individua tu i componenti e i file corrispondenti nel progetto partendo dai testi e dalle sezioni ' +
    'citate. Non dare per scontata nessuna struttura di file.',
  ctxTitle: 'Contesto',
  ctxPage: 'Pagina',
  ctxUrl: 'URL',
  ctxPageType: 'Tipo di pagina',
  ctxGoal: 'Obiettivo di conversione',
  ctxHeadline: 'Headline attuale',
  ctxTone: 'Tono di voce rilevato',
  ctxScores:
    'Punteggi attuali (0-100): conversione {conversion}, allineamento attenzione ' +
    '{attention}, chiarezza {clarity}, CTA {cta}',
  recsTitle: 'Interventi richiesti (in ordine di impatto)',
  recsPriority: 'priorità',
  recsWhat: '**Cosa fare:**',
  recsWhy: '**Perché:**',
  frictionsTitle: 'Frizioni da rimuovere',
  frictionsPage: 'Pagina',
  frictionsSeverity: 'gravità',
  frictionsFix: 'Correzione',
  copyTitle: 'Copy',
  copyIssue: 'Problema',
  copySuggestion: 'Proposta',
  ctaTitle: 'Call to action',
  ctaContrast: 'contrasto',
  ctaVisibility: 'visibilità',
  zonesTitle: 'Gerarchia visiva attuale (dalla più notata)',
  zonesAttention: 'attenzione stimata',
  zonesNote:
    'La gerarchia visiva deve rispecchiare l\'obiettivo di conversione: ciò che porta ' +
    'all\'azione principale va reso più evidente di ciò che non lo fa.',
  constraintsTitle: 'Vincoli',
  constraintNoRewrite: '- Non riscrivere la pagina da capo: applica modifiche mirate, mantenendo struttura e stile esistenti.',
  constraintPalette: '- Mantieni la palette attuale: {list}.',
  constraintFonts: '- Mantieni i font attuali: {list}.',
  constraintTone: '- Mantieni il tono di voce: {tone}.',
  constraintLanguage: '- Scrivi i testi nella stessa lingua della pagina.',
  constraintA11y: '- Non peggiorare l\'accessibilità: contrasto adeguato, ordine dei titoli coerente, testi alternativi.',
  constraintDeps: '- Non introdurre dipendenze nuove se non necessarie.',
  constraintMobile: '- Mantieni la resa su mobile: verifica ogni modifica anche a larghezze ridotte.',
  acceptanceTitle: 'Criteri di accettazione',
  acceptanceApplied: '- Ogni intervento sopra è stato applicato, oppure è spiegato perché non era applicabile.',
  acceptanceAboveFold: '- L\'azione principale è raggiungibile senza scorrere, su desktop e su mobile.',
  acceptanceNoRegression: '- Nessuna regressione visiva nelle sezioni non toccate.',
  acceptanceList: '- Al termine, elenca le modifiche fatte file per file.',
  disclaimer:
    '_Questi interventi sono ipotesi basate su un\'analisi predittiva dell\'attenzione, ' +
    'non su dati di traffico reale. Dove possibile, verificali con un test A/B invece di ' +
    'darli per acquisiti._',
  generatedBy: '_Generato da Foevo — foevo.app_',
}

const COPY_EN: typeof COPY_IT = {
  h1: '# Conversion optimisation changes',
  role:
    'You are a frontend developer experienced in CRO. Apply to this page\'s code the changes ' +
    'listed below, which come from a visual attention and conversion analysis.',
  caveat:
    '**Important:** whoever produced this analysis saw only the rendered page, not the code. ' +
    'Find the matching components and files in the project yourself, starting from the text and ' +
    'sections quoted here. Do not assume any file structure.',
  ctxTitle: 'Context',
  ctxPage: 'Page',
  ctxUrl: 'URL',
  ctxPageType: 'Page type',
  ctxGoal: 'Conversion goal',
  ctxHeadline: 'Current headline',
  ctxTone: 'Detected tone of voice',
  ctxScores:
    'Current scores (0-100): conversion {conversion}, attention alignment ' +
    '{attention}, clarity {clarity}, CTA {cta}',
  recsTitle: 'Requested changes (in order of impact)',
  recsPriority: 'priority',
  recsWhat: '**What to do:**',
  recsWhy: '**Why:**',
  frictionsTitle: 'Frictions to remove',
  frictionsPage: 'Page',
  frictionsSeverity: 'severity',
  frictionsFix: 'Fix',
  copyTitle: 'Copy',
  copyIssue: 'Issue',
  copySuggestion: 'Suggestion',
  ctaTitle: 'Call to action',
  ctaContrast: 'contrast',
  ctaVisibility: 'visibility',
  zonesTitle: 'Current visual hierarchy (most noticed first)',
  zonesAttention: 'estimated attention',
  zonesNote:
    'The visual hierarchy must mirror the conversion goal: whatever leads to the main ' +
    'action should stand out more than whatever does not.',
  constraintsTitle: 'Constraints',
  constraintNoRewrite: '- Do not rewrite the page from scratch: make targeted changes, keeping the existing structure and style.',
  constraintPalette: '- Keep the current palette: {list}.',
  constraintFonts: '- Keep the current fonts: {list}.',
  constraintTone: '- Keep the tone of voice: {tone}.',
  constraintLanguage: '- Write the copy in the same language as the page.',
  constraintA11y: '- Do not hurt accessibility: adequate contrast, consistent heading order, alt text.',
  constraintDeps: '- Do not add new dependencies unless necessary.',
  constraintMobile: '- Keep it working on mobile: check every change at narrow widths too.',
  acceptanceTitle: 'Acceptance criteria',
  acceptanceApplied: '- Every change above has been applied, or it is explained why it did not apply.',
  acceptanceAboveFold: '- The main action is reachable without scrolling, on desktop and on mobile.',
  acceptanceNoRegression: '- No visual regression in the sections you did not touch.',
  acceptanceList: '- When done, list the changes file by file.',
  disclaimer:
    '_These changes are hypotheses based on a predictive attention analysis, not on real ' +
    'traffic data. Where you can, validate them with an A/B test instead of taking them ' +
    'for granted._',
  generatedBy: '_Generated by Foevo — foevo.app_',
}

const COPY: Record<Locale, typeof COPY_IT> = { it: COPY_IT, en: COPY_EN }

export interface PromptMeta {
  url?: string | null
  title?: string | null
  /** Lingua del prompt: segue quella dell'utente. */
  locale?: Locale
}

const clean = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim()

/** Sostituisce i segnaposto `{nome}` nel testo. */
const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key) => String(vars[key] ?? match))

/** Elenco puntato, saltando i valori vuoti. */
function bullets(items: (string | null | undefined)[], indent = ''): string[] {
  return items.map(clean).filter(Boolean).map((t) => `${indent}- ${t}`)
}

function section(title: string, lines: string[]): string[] {
  return lines.length ? ['', `## ${title}`, '', ...lines] : []
}

export function buildImplementationPrompt(result: AttentionResult, meta: PromptMeta = {}): string {
  const locale = meta.locale ?? DEFAULT_LOCALE
  const c = COPY[locale] ?? COPY[DEFAULT_LOCALE]
  const prio = (p: Priority) => (PRIO_LABEL[locale] ?? PRIO_LABEL[DEFAULT_LOCALE])[p] ?? p

  const L: string[] = []
  const url = clean(meta.url)
  const title = clean(meta.title)

  L.push(c.h1)
  L.push('')
  L.push(c.role)
  L.push('')
  L.push(c.caveat)

  // ---- contesto ----
  const ctx = bullets([
    title && `${c.ctxPage}: ${title}`,
    url && `${c.ctxUrl}: ${url}`,
    result.pageType && `${c.ctxPageType}: ${result.pageType}`,
    result.goal && `${c.ctxGoal}: ${result.goal}`,
    result.copy?.headline && `${c.ctxHeadline}: "${clean(result.copy.headline)}"`,
    result.brand?.tone && `${c.ctxTone}: ${result.brand.tone}`,
  ])
  const s = result.scores
  if (s) {
    ctx.push(`- ${fill(c.ctxScores, {
      conversion: s.conversion, attention: s.attentionAlignment, clarity: s.clarity, cta: s.cta,
    })}`)
  }
  L.push(...section(c.ctxTitle, ctx))
  if (result.summary) L.push('', clean(result.summary))

  // ---- interventi, ordinati per priorità ----
  const recs = [...(result.recommendations ?? [])].sort(
    (a, b) => (PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9),
  )
  if (recs.length) {
    const lines: string[] = []
    recs.forEach((r, i) => {
      lines.push(`### ${i + 1}. ${clean(r.title)} — ${c.recsPriority} ${prio(r.priority)}`)
      lines.push('')
      if (r.detail) lines.push(`${c.recsWhat} ${clean(r.detail)}`)
      if (r.impact) lines.push(`${c.recsWhy} ${clean(r.impact)}`)
      lines.push('')
    })
    L.push(...section(c.recsTitle, lines))
  }

  // ---- frizioni: hanno già un campo fix ----
  const fr = [...(result.frictions ?? [])].sort(
    (a, b) => (PRIO_ORDER[a.severity] ?? 9) - (PRIO_ORDER[b.severity] ?? 9),
  )
  if (fr.length) {
    const lines: string[] = []
    fr.forEach((f) => {
      lines.push(`- **${clean(f.area) || c.frictionsPage}** (${c.frictionsSeverity} ${prio(f.severity)}) — ${clean(f.description)}`)
      if (f.fix) lines.push(`  - ${c.frictionsFix}: ${clean(f.fix)}`)
    })
    L.push(...section(c.frictionsTitle, lines))
  }

  // ---- copy ----
  const copyLines = [
    ...bullets((result.copy?.issues ?? []).map((x) => `${c.copyIssue}: ${x}`)),
    ...bullets((result.copy?.suggestions ?? []).map((x) => `${c.copySuggestion}: ${x}`)),
  ]
  L.push(...section(c.copyTitle, copyLines))

  // ---- CTA ----
  const ctas = (result.cta ?? []).filter((x) => clean(x.text) || x.issues?.length)
  if (ctas.length) {
    const lines: string[] = []
    ctas.forEach((x) => {
      const bits = [
        x.contrast != null && `${c.ctaContrast} ${x.contrast}`,
        x.visibility != null && `${c.ctaVisibility} ${x.visibility}/100`,
      ].filter(Boolean).join(', ')
      lines.push(`- CTA "${clean(x.text)}"${bits ? ` — ${bits}` : ''}`)
      lines.push(...bullets(x.issues ?? [], '  '))
    })
    L.push(...section(c.ctaTitle, lines))
  }

  // ---- gerarchia visiva ----
  const zones = [...(result.attention?.zones ?? [])].sort((a, b) => b.score - a.score).slice(0, 8)
  if (zones.length) {
    const lines = zones.map((z, i) => {
      const reason = clean(z.reason)
      return `- ${i + 1}. **${clean(z.label)}** — ${c.zonesAttention} ${z.score}/100${reason ? `. ${reason}` : ''}`
    })
    lines.push('')
    lines.push(c.zonesNote)
    L.push(...section(c.zonesTitle, lines))
  }

  // ---- vincoli ----
  const palette = (result.brand?.palette ?? [])
    .map((x) => `${clean(x.hex)}${x.role ? ` (${clean(x.role)})` : ''}`)
    .filter(Boolean)
  const fonts = (result.brand?.fonts ?? [])
    .map((f) => `${clean(f.family)}${f.usage ? ` (${clean(f.usage)})` : ''}`)
    .filter(Boolean)

  L.push(...section(c.constraintsTitle, [
    c.constraintNoRewrite,
    palette.length ? fill(c.constraintPalette, { list: palette.join(', ') }) : '',
    fonts.length ? fill(c.constraintFonts, { list: fonts.join(', ') }) : '',
    result.brand?.tone ? fill(c.constraintTone, { tone: clean(result.brand.tone) }) : '',
    c.constraintLanguage,
    c.constraintA11y,
    c.constraintDeps,
    c.constraintMobile,
  ].filter(Boolean)))

  // ---- criteri di accettazione ----
  L.push(...section(c.acceptanceTitle, [
    c.acceptanceApplied,
    c.acceptanceAboveFold,
    c.acceptanceNoRegression,
    c.acceptanceList,
  ]))

  // ---- nota finale ----
  L.push('')
  L.push('---')
  L.push('')
  L.push(c.disclaimer)
  L.push('')
  L.push(c.generatedBy)

  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
