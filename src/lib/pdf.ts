/**
 * Generatore PDF senza dipendenze (una pagina A4). Disegna un'intestazione
 * brandizzata Foevo (logo heat-dot vettoriale + wordmark), tabella voci e totale.
 * Testo in WinAnsi/Latin-1: niente € (usa "EUR"); gli accenti latini sono ok.
 */

// Colori (0..1)
const CORAL = '0.898 0.314 0.180'
const CORAL_SOFT = '1 0.945 0.925'
const INK = '0.110 0.098 0.090'
const MUTED = '0.470 0.443 0.424'
const LINE = '0.882 0.867 0.851'
const WHITE = '1 1 1'
const VIOLET = '0.427 0.157 0.851'
const WARM = '1 0.690 0.125'
const HOT = '1 0.353 0.235'

// Solo caratteri Latin-1: normalizza la punteggiatura Unicode comune, poi
// sostituisci gli eventuali residui fuori range e fai l'escape PDF.
const esc = (s: string) =>
  String(s ?? '')
    .replace(/[—–‒]/g, '-')      // — – ‒  → -
    .replace(/[‘’‛]/g, "'")      // ' ' ‛ → '
    .replace(/[“”„]/g, '"')      // " " „ → "
    .replace(/…/g, '...')                    // … → ...
    .replace(/ /g, ' ')                      // nbsp → spazio
    .replace(/[€]/g, 'EUR')
    .split('').map((ch) => (ch.charCodeAt(0) <= 0xff ? ch : '?')).join('')
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

export interface InvoiceItem { desc: string; amount: string }
export interface InvoiceData {
  number: string
  date: string
  seller: string[]
  buyer: string[]
  items: InvoiceItem[]
  total: string
  paidWith?: string
  note?: string
}

export function renderInvoicePdf(d: InvoiceData): Buffer {
  const ops: string[] = []
  const K = 0.5523

  const rect = (x: number, y: number, w: number, h: number, rgb: string) =>
    ops.push(`${rgb} rg ${x} ${y} ${w} ${h} re f`)
  const hline = (x1: number, x2: number, y: number, rgb = LINE, w = 0.8) =>
    ops.push(`${rgb} RG ${w} w ${x1} ${y} m ${x2} ${y} l S`)
  const text = (x: number, y: number, size: number, font: 'F1' | 'F2', rgb: string, s: string) =>
    ops.push(`${rgb} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${esc(s)}) Tj ET`)
  const circle = (cx: number, cy: number, r: number, rgb: string) => {
    const k = K * r
    ops.push(
      `${rgb} rg ${cx + r} ${cy} m ` +
      `${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} c ` +
      `${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} c ` +
      `${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} c ` +
      `${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} c f`,
    )
  }

  // Intestazione
  rect(0, 762, 595, 80, CORAL_SOFT)
  // logo heat-dot (cerchi concentrici)
  circle(66, 802, 12, VIOLET)
  circle(66, 803, 8, WARM)
  circle(66, 804, 4.5, HOT)
  text(86, 797, 22, 'F2', INK, 'Foevo')
  text(430, 812, 18, 'F2', CORAL, 'FATTURA')
  text(430, 795, 9, 'F1', MUTED, `Nr. ${d.number}`)
  text(430, 783, 9, 'F1', MUTED, `Data: ${d.date}`)

  // Da / Fatturato a
  let yL = 726
  text(56, yL, 8, 'F2', MUTED, 'DA')
  yL -= 15
  for (const s of d.seller) { text(56, yL, 9.5, 'F1', INK, s); yL -= 13 }

  let yR = 726
  text(320, yR, 8, 'F2', MUTED, 'FATTURATO A')
  yR -= 15
  for (const s of d.buyer) { text(320, yR, 9.5, 'F1', INK, s); yR -= 13 }

  // Tabella voci
  let y = Math.min(yL, yR) - 24
  hline(56, 539, y + 14)
  text(56, y, 8, 'F2', MUTED, 'DESCRIZIONE')
  text(452, y, 8, 'F2', MUTED, 'IMPORTO')
  y -= 8
  hline(56, 539, y + 2)
  y -= 18
  for (const it of d.items) {
    text(56, y, 10, 'F1', INK, it.desc)
    text(452, y, 10, 'F1', INK, it.amount)
    y -= 20
  }

  // Totale
  y -= 6
  rect(320, y - 22, 219, 34, CORAL)
  text(336, y - 8, 11, 'F2', WHITE, 'TOTALE')
  text(452, y - 8, 12, 'F2', WHITE, d.total)
  if (d.paidWith) text(56, y - 4, 9, 'F1', MUTED, `Pagamento: ${d.paidWith}`)

  // Footer
  hline(56, 539, 92)
  let yf = 78
  const note = d.note || 'Documento generato automaticamente da Foevo.'
  for (const nl of wrap(note, 110)) { text(56, yf, 8, 'F1', MUTED, nl); yf -= 11 }

  const stream = ops.join('\n')
  const objs: Record<number, string> = {
    1: '<< /Type /Catalog /Pages 2 0 R >>',
    2: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    3: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    4: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    5: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    6: `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
  }

  let pdf = '%PDF-1.4\n'
  const offsets: Record<number, number> = {}
  for (let i = 1; i <= 6; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1')
    pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`
  }
  const xref = Buffer.byteLength(pdf, 'latin1')
  pdf += 'xref\n0 7\n0000000000 65535 f \n'
  for (let i = 1; i <= 6; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

function wrap(text: string, max = 110): string[] {
  const words = String(text).split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) { if (line) out.push(line); line = w } else line = (line ? line + ' ' : '') + w
  }
  if (line) out.push(line)
  return out
}
