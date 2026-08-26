/** Structured output of the attention analysis (stored as JSONB, rendered in the dashboard). */

export type Priority = 'alta' | 'media' | 'bassa'
export type Bbox = [number, number, number, number] // x,y,w,h normalized 0..1 over the full page

/** Real DOM element rect captured by the extension (pixel-accurate boundaries). */
export interface PageElement { type: string; text: string; bbox: Bbox }

export interface AttentionZone { label: string; bbox: Bbox; score: number; reason: string }
export interface CtaItem { text: string; bbox: Bbox | null; color: string | null; contrast: number; visibility: number; issues: string[] }
export interface BrandColor { hex: string; role: string }
export interface Friction { severity: Priority; area: string; description: string; fix: string }
export interface Recommendation { priority: Priority; title: string; detail: string; impact: string }

export interface AttentionResult {
  pageType: string
  goal: string
  summary: string
  brand: { palette: BrandColor[]; fonts: { family: string; usage: string }[]; tone: string }
  attention: { zones: AttentionZone[]; firstGlance: string[] }
  cta: CtaItem[]
  copy: { headline: string | null; clarity: number; issues: string[]; suggestions: string[] }
  frictions: Friction[]
  scores: { attentionAlignment: number; clarity: number; cta: number; conversion: number }
  recommendations: Recommendation[]
}

const GOAL_LABELS: Record<string, string> = {
  lead: 'generazione lead / iscrizioni',
  sale: 'vendita diretta / checkout',
  product: 'scheda prodotto e-commerce (aggiunta al carrello)',
  booking: 'prenotazione / appuntamento',
  signup: 'registrazione / avvio trial',
}

export function goalHint(goal: string | null | undefined): string {
  if (!goal) return 'da rilevare automaticamente dal contenuto della pagina'
  return GOAL_LABELS[goal] ?? goal
}

/** System prompt shared by both tiers. */
export function systemPrompt(): string {
  return [
    'Sei un esperto di neuromarketing e CRO (conversion rate optimization) e di eye-tracking predittivo.',
    'Analizzi lo screenshot full-page di una landing page o scheda prodotto e stimi DOVE cade l\'attenzione visiva',
    'nei primi secondi e se la gerarchia visiva è allineata all\'obiettivo di conversione.',
    'Rispondi SEMPRE ed ESCLUSIVAMENTE con un oggetto JSON valido, senza testo prima o dopo, senza markdown fences.',
    'Le coordinate bbox sono [x,y,w,h] normalizzate 0..1 rispetto all\'INTERA immagine (0,0 = alto-sinistra).',
    'Gli score sono interi 0..100. Scrivi i testi in italiano.',
  ].join(' ')
}

/** Formats the real DOM elements the extension captured, so the model can
 *  reference their EXACT coordinates instead of estimating bboxes. */
export function elementsBlock(elements?: PageElement[]): string {
  if (!elements?.length) return ''
  const lines = elements.slice(0, 40).map((e, i) => {
    const b = e.bbox.map((n) => Math.round(n * 1000) / 1000).join(',')
    const t = (e.text || '').replace(/\s+/g, ' ').slice(0, 60)
    return `[${i}] ${e.type} "${t}" bbox=[${b}]`
  }).join('\n')
  return `\n\nELEMENTI REALI rilevati sulla pagina (coordinate ESATTE dal DOM, 0..1 sull'intera immagine):\n${lines}\n\nIMPORTANTE per le "zones": quando una zona corrisponde a uno di questi elementi, imposta il campo "ref" con l'INDICE dell'elemento (numero tra parentesi) e NON inventare "bbox" — verrà usato il rettangolo reale. Usa "bbox" tuo solo se nessun elemento combacia. Preferisci sempre gli elementi reali.`
}

/** Premium (Claude) — full brand + CTA + copy + conversion analysis. */
export function premiumPrompt(ctx: { url: string; title: string; goal: string | null; note: string | null }, elements?: PageElement[]): string {
  return `Contesto pagina:
- URL: ${ctx.url}
- Titolo: ${ctx.title}
- Obiettivo di conversione: ${goalHint(ctx.goal)}
- Note utente: ${ctx.note || '—'}

Analizza e restituisci ESATTAMENTE questo JSON:
{
  "pageType": "landing" | "product" | "homepage" | "checkout" | "other",
  "goal": "<obiettivo di conversione dedotto, breve>",
  "summary": "<2-3 frasi: cosa attira l'attenzione ora e se è allineato all'obiettivo>",
  "brand": {
    "palette": [{"hex":"#rrggbb","role":"background|primary|cta|text|accent"}],
    "fonts": [{"family":"<nome o stile es. sans grotesque>","usage":"heading|body|cta"}],
    "tone": "<tono percepito del brand: es. premium, amichevole, tecnico>"
  },
  "attention": {
    "zones": [{"label":"<es. Headline, CTA principale, Immagine hero, Prezzo>","ref":<indice elemento reale o null>,"bbox":[x,y,w,h],"score":0-100,"reason":"<perché attira o no>"}],
    "firstGlance": ["<label>", "..."]  // ordine dei 3-5 elementi visti per primi
  },
  "cta": [{"text":"<testo bottone>","bbox":[x,y,w,h],"color":"#rrggbb","contrast":0-100,"visibility":0-100,"issues":["..."]}],
  "copy": {"headline":"<headline principale>","clarity":0-100,"issues":["..."],"suggestions":["<riscrittura più persuasiva>","..."]},
  "frictions": [{"severity":"alta|media|bassa","area":"<zona>","description":"<cosa disturba la conversione>","fix":"<come risolvere>"}],
  "scores": {"attentionAlignment":0-100,"clarity":0-100,"cta":0-100,"conversion":0-100},
  "recommendations": [{"priority":"alta|media|bassa","title":"<azione>","detail":"<come farla>","impact":"<effetto atteso sulla conversione>"}]
}

Regole:
- Identifica i colori REALI usati (specialmente quello delle CTA) e valuta se la CTA "stacca" abbastanza dal resto.
- Valuta se ciò che cattura l'attenzione (score alto nelle zones) coincide con l'elemento che porta alla conversione. Se no, spiegalo in summary e in recommendations.
- Includi 4-8 zones, 1-4 cta, 3-6 recommendations ordinate per priorità.${elementsBlock(elements)}`
}

/** Base (Qwen) — lighter zone + score analysis. */
export function basePrompt(ctx: { url: string; title: string; goal: string | null }, elements?: PageElement[]): string {
  return `Contesto: URL ${ctx.url}; Titolo "${ctx.title}"; Obiettivo: ${goalHint(ctx.goal)}.
Restituisci ESATTAMENTE questo JSON (in italiano):
{
  "pageType":"landing|product|homepage|other",
  "goal":"<obiettivo dedotto>",
  "summary":"<2 frasi su cosa attira l'attenzione e se aiuta la conversione>",
  "attention":{"zones":[{"label":"...","ref":<indice elemento reale o null>,"bbox":[x,y,w,h],"score":0-100,"reason":"..."}],"firstGlance":["..."]},
  "cta":[{"text":"...","bbox":[x,y,w,h],"color":"#rrggbb","contrast":0-100,"visibility":0-100,"issues":[]}],
  "scores":{"attentionAlignment":0-100,"clarity":0-100,"cta":0-100,"conversion":0-100},
  "recommendations":[{"priority":"alta|media|bassa","title":"...","detail":"...","impact":"..."}]
}
Includi 3-6 zones e 2-4 recommendations. bbox normalizzate 0..1 sull'intera immagine.${elementsBlock(elements)}`
}

// ---- defensive normalization (LLMs drift; never throw on a missing field) ----
const clamp = (n: unknown, lo = 0, hi = 100): number => {
  const v = typeof n === 'number' ? n : Number(n)
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : 0
}
const str = (s: unknown, d = ''): string => (typeof s === 'string' ? s : d)
const arr = <T>(a: unknown): T[] => (Array.isArray(a) ? (a as T[]) : [])
const prio = (p: unknown): Priority => (p === 'alta' || p === 'bassa' ? p : 'media')

function normBbox(b: unknown): Bbox | null {
  if (!Array.isArray(b) || b.length < 4) return null
  const n = b.map((x) => { const v = Number(x); return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0 }) as number[]
  return [n[0], n[1], Math.max(0.01, n[2]), Math.max(0.01, n[3])]
}

export function normalizeResult(raw: any, fallbackGoal: string, elements?: PageElement[]): AttentionResult {
  const r = raw && typeof raw === 'object' ? raw : {}
  const zones = arr<any>(r?.attention?.zones).map((z) => {
    // Prefer the real DOM element's exact rect when the model referenced one.
    const ref = Number(z?.ref)
    const refBox = elements && Number.isInteger(ref) && ref >= 0 && ref < elements.length ? elements[ref].bbox : null
    return {
      label: str(z?.label, 'Zona'),
      bbox: refBox ?? normBbox(z?.bbox) ?? [0.4, 0.1, 0.2, 0.1],
      score: clamp(z?.score), reason: str(z?.reason),
    }
  }).filter((z) => z.label).slice(0, 12)

  return {
    pageType: str(r.pageType, 'other'),
    goal: str(r.goal, fallbackGoal),
    summary: str(r.summary),
    brand: {
      palette: arr<any>(r?.brand?.palette).map((c) => ({ hex: str(c?.hex), role: str(c?.role, 'accent') })).filter((c) => /^#?[0-9a-f]{3,8}$/i.test(c.hex)).slice(0, 8),
      fonts: arr<any>(r?.brand?.fonts).map((f) => ({ family: str(f?.family), usage: str(f?.usage) })).filter((f) => f.family).slice(0, 4),
      tone: str(r?.brand?.tone),
    },
    attention: { zones, firstGlance: arr<any>(r?.attention?.firstGlance).map((s) => str(s)).filter(Boolean).slice(0, 6) },
    cta: arr<any>(r.cta).map((c) => ({
      text: str(c?.text), bbox: normBbox(c?.bbox), color: /^#?[0-9a-f]{3,8}$/i.test(str(c?.color)) ? str(c?.color) : null,
      contrast: clamp(c?.contrast), visibility: clamp(c?.visibility), issues: arr<any>(c?.issues).map((s) => str(s)).filter(Boolean),
    })).filter((c) => c.text).slice(0, 6),
    copy: {
      headline: r?.copy?.headline ? str(r.copy.headline) : null,
      clarity: clamp(r?.copy?.clarity), issues: arr<any>(r?.copy?.issues).map((s) => str(s)).filter(Boolean),
      suggestions: arr<any>(r?.copy?.suggestions).map((s) => str(s)).filter(Boolean),
    },
    frictions: arr<any>(r.frictions).map((f) => ({ severity: prio(f?.severity), area: str(f?.area), description: str(f?.description), fix: str(f?.fix) })).filter((f) => f.description).slice(0, 8),
    scores: {
      attentionAlignment: clamp(r?.scores?.attentionAlignment), clarity: clamp(r?.scores?.clarity),
      cta: clamp(r?.scores?.cta), conversion: clamp(r?.scores?.conversion),
    },
    recommendations: arr<any>(r.recommendations).map((x) => ({ priority: prio(x?.priority), title: str(x?.title), detail: str(x?.detail), impact: str(x?.impact) })).filter((x) => x.title).slice(0, 8),
  }
}

/** Extract a JSON object from an LLM text response (tolerates fences / prose). */
export function extractJson(text: string): any {
  if (!text) throw new Error('empty LLM response')
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) throw new Error('no JSON object in LLM response')
  return JSON.parse(t.slice(start, end + 1))
}
