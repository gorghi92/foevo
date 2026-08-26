// Generates solid-brand PNG icons with a heatmap "hot dot" — no external deps.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'icons')
mkdirSync(outDir, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function png(size) {
  const bg = [0x6d, 0x28, 0xd9]      // brand violet
  const hot = [0xff, 0x5a, 0x3c]     // heatmap hot
  const warm = [0xff, 0xc1, 0x07]    // heatmap warm
  const cx = size * 0.5, cy = size * 0.5
  const raw = Buffer.alloc((size * 4 + 1) * size)
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy) / (size * 0.5)
      let r, g, b
      if (d < 0.34) { r = hot[0]; g = hot[1]; b = hot[2] }
      else if (d < 0.55) { r = warm[0]; g = warm[1]; b = warm[2] }
      else { r = bg[0]; g = bg[1]; b = bg[2] }
      // rounded corners → transparent
      const inset = size * 0.12
      const rx = Math.max(0, inset - x, x - (size - 1 - inset))
      const ry = Math.max(0, inset - y, y - (size - 1 - inset))
      const a = Math.hypot(rx, ry) > inset ? 0 : 255
      raw[o++] = r; raw[o++] = g; raw[o++] = b; raw[o++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
for (const s of [16, 48, 128]) writeFileSync(join(outDir, `icon${s}.png`), png(s))
console.log('icons written to', outDir)
