/**
 * Dimensioni reali di un'immagine data-URL, lette dall'header dei byte
 * (JPEG/PNG/GIF) senza dipendenze esterne.
 *
 * Serve come rete di sicurezza lato server: il client dichiara le dimensioni
 * nel payload, ma il modello rifiuta con un 400 qualsiasi immagine con un lato
 * oltre MAX_IMAGE_SIDE. Meglio verificarlo sui byte che fidarsi del client.
 */

/** Limite del provider: nessun lato oltre 8000px. */
export const MAX_IMAGE_SIDE = 8000

export interface ImageDims { width: number; height: number }

function jpegSize(b: Buffer): ImageDims | null {
  // SOI + sequenza di marker; le dimensioni stanno nel segmento SOFn.
  let i = 2
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue }
    const marker = b[i + 1]
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
    const len = b.readUInt16BE(i + 2)
    // SOF0..SOF15, esclusi DHT (c4), JPGA (c8) e DAC (cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) }
    }
    if (len < 2) return null
    i += 2 + len
  }
  return null
}

function pngSize(b: Buffer): ImageDims | null {
  if (b.length < 24) return null
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}

function gifSize(b: Buffer): ImageDims | null {
  if (b.length < 10) return null
  return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) }
}

/**
 * Ritorna le dimensioni, o null se il formato non è riconosciuto: in quel caso
 * il chiamante lascia passare l'immagine invece di bloccarla. L'estensione
 * produce sempre JPEG, quindi il caso normale è coperto.
 */
export function imageSizeFromDataUrl(dataUrl: string): ImageDims | null {
  const m = /^data:image\/[a-z+]+;base64,(.*)$/is.exec(dataUrl)
  if (!m) return null
  let b: Buffer
  try { b = Buffer.from(m[1], 'base64') } catch { return null }
  if (b.length < 16) return null

  let d: ImageDims | null = null
  if (b[0] === 0xff && b[1] === 0xd8) d = jpegSize(b)
  else if (b.toString('ascii', 1, 4) === 'PNG') d = pngSize(b)
  else if (b.toString('ascii', 0, 3) === 'GIF') d = gifSize(b)

  if (!d || !Number.isFinite(d.width) || !Number.isFinite(d.height) || d.width <= 0 || d.height <= 0) return null
  return d
}

/** true se un lato supera il limite accettato dal modello. */
export function exceedsModelLimit(dataUrl: string): boolean {
  const d = imageSizeFromDataUrl(dataUrl)
  return !!d && Math.max(d.width, d.height) > MAX_IMAGE_SIDE
}
