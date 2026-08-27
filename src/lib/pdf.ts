/**
 * Generatore PDF minimale (una pagina, solo testo Helvetica) senza dipendenze.
 * Usa solo caratteri ASCII/Latin-1 — niente € (usa "EUR") o accenti nei valori.
 */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

function wrap(text: string, max = 95): string[] {
  const words = text.split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) { if (line) out.push(line); line = w } else line = (line ? line + ' ' : '') + w
  }
  if (line) out.push(line)
  return out
}

export interface InvoiceRow { label: string; value?: string }
export interface InvoiceData {
  number: string
  date: string
  sellerLines: string[]
  buyerLines: string[]
  rows: InvoiceRow[]
  total: string
  note?: string
}

export function renderInvoicePdf(d: InvoiceData): Buffer {
  const ops: string[] = []
  let y = 800
  const line = (text: string, size = 11, font: 'F1' | 'F2' = 'F1', dy = 16) => {
    ops.push(`BT /${font} ${size} Tf 1 0 0 1 50 ${y} Tm (${esc(text)}) Tj ET`)
    y -= dy
  }

  line('Foevo', 22, 'F2', 26)
  line('Fattura / Invoice', 14, 'F2', 24)
  line(`Numero: ${d.number}`, 11, 'F1', 14)
  line(`Data: ${d.date}`, 11, 'F1', 22)

  line('Da:', 11, 'F2', 14)
  for (const s of d.sellerLines) line(s, 10, 'F1', 13)
  y -= 8
  line('A:', 11, 'F2', 14)
  for (const s of d.buyerLines) line(s, 10, 'F1', 13)
  y -= 12

  line('Dettaglio', 12, 'F2', 18)
  for (const r of d.rows) line(`${r.label}${r.value ? ':  ' + r.value : ''}`, 10, 'F1', 14)
  y -= 8
  line(`Totale: ${d.total}`, 13, 'F2', 22)
  if (d.note) { y -= 6; for (const nl of wrap(d.note)) line(nl, 9, 'F1', 12) }

  const stream = ops.join('\n')
  const objs: Record<number, string> = {
    1: '<< /Type /Catalog /Pages 2 0 R >>',
    2: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    3: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    4: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    5: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
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
