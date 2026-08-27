/* Foveo — background service worker
 * Captures a full-page screenshot (scroll + stitch), builds a downscaled
 * display image + a tiny RGB sample for server-side saliency, and POSTs it. */

const MAX_PAGE_HEIGHT = 20000   // px cap (very long pages)
const MAX_SLICES = 24
const DISPLAY_MAX_W = 1440
const DISPLAY_MAX_H = 7800     // sotto il limite di 8000px per lato dell'API di analisi
// Limiti dell'immagine inviata al modello di analisi (Claude Opus 5, tier
// high-resolution): lato lungo max 2576px e 4784 "visual token" da 28x28px.
// Oltre queste soglie l'immagine viene comunque ridotta lato server, quindi
// mandarla piu' grande aggiunge peso e latenza senza aggiungere dettaglio.
const AI_MAX_SIDE = 2576
const AI_MAX_TOKENS = 4784
const AI_PATCH = 28
const SAMPLE_W = 192
const CAPTURE_GAP_MS = 520      // respect captureVisibleTab rate limit (~2/s)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getSettings() {
  const s = await chrome.storage.sync.get(['apiKey'])
  // Endpoint fisso: coincide con l'host dichiarato in host_permissions.
  return { apiBase: 'https://foevo.app', apiKey: s.apiKey || '' }
}
function progress(text) { chrome.runtime.sendMessage({ type: 'PROGRESS', text }).catch(() => {}) }

/* ---- injected page functions (must be self-contained) ---- */
function pageMetrics() {
  const d = document.documentElement, b = document.body
  return {
    scrollHeight: Math.max(d.scrollHeight, b ? b.scrollHeight : 0, d.clientHeight),
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    dpr: window.devicePixelRatio || 1,
    title: document.title,
    url: location.href,
  }
}
function pageCollectElements(vw, pageH) {
  // Real DOM rects (document-absolute, normalized 0..1) so the server can anchor
  // attention zones to actual elements instead of the model guessing coordinates.
  const out = []
  const sx = window.scrollX || 0, sy = window.scrollY || 0
  const seen = new Set()
  const clamp01 = (v) => Math.max(0, Math.min(1, v))
  const vis = (el) => {
    const s = getComputedStyle(el)
    return !(s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity || '1') < 0.05)
  }
  // A `fixed` element (cookie banner, sticky bar) doesn't scroll: in the stitched
  // screenshot it appears once at its VIEWPORT position (captured in the first
  // slice, hidden after). So it must be mapped by the viewport-relative top,
  // NOT document-absolute (rect.top + scrollY) which would land it elsewhere.
  const isFixed = (el) => {
    let n = el, depth = 0
    while (n && n !== document.body && depth < 10) {
      if (getComputedStyle(n).position === 'fixed') return true
      n = n.parentElement; depth++
    }
    return false
  }
  const push = (el, type) => {
    if (out.length >= 40) return
    let r
    try { r = el.getBoundingClientRect() } catch { return }
    if (!r || r.width < 24 || r.height < 12) return
    const fixed = isFixed(el)
    const x = (r.left + (fixed ? 0 : sx)) / vw
    const y = (r.top + (fixed ? 0 : sy)) / pageH
    const nw = r.width / vw, nh = r.height / pageH
    if (y > 1.02 || y + nh < -0.02 || x > 1.02) return
    const key = type + '|' + Math.round(r.left) + '|' + Math.round(r.top + sy) + '|' + Math.round(r.width)
    if (seen.has(key)) return
    seen.add(key)
    let text = ''
    try { text = (el.innerText || el.value || el.getAttribute('alt') || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80) } catch (e) {}
    out.push({ type, text, bbox: [clamp01(x), clamp01(y), Math.min(1, nw), Math.min(1, nh)] })
  }
  const add = (sel, type, limit) => {
    let n = 0, nodes = []
    try { nodes = document.querySelectorAll(sel) } catch (e) { return }
    for (const el of nodes) { if (n >= limit) break; if (!vis(el)) continue; push(el, type); n++ }
  }
  add('h1,h2', 'heading', 8)
  add('h3', 'subheading', 6)
  add('button,[role=button],input[type=submit],input[type=button],a[class*="btn"],a[class*="button"],a[class*="cta"]', 'cta', 12)
  add('form', 'form', 4)
  add('img', 'image', 8)
  add('nav,header', 'nav', 3)
  return out.slice(0, 40)
}
function pagePrepare() {
  const w = window
  w.__foveo = { x: w.scrollX, y: w.scrollY, htmlOverflow: document.documentElement.style.overflow }
  const s = document.createElement('style')
  s.id = '__foveo_style'
  s.textContent = '::-webkit-scrollbar{display:none!important}html{scroll-behavior:auto!important}'
  document.documentElement.appendChild(s)
}
function pageHideSticky() {
  // Hide fixed/sticky elements so they aren't repeated in every stitched slice.
  const hidden = []
  const nodes = document.body ? document.body.querySelectorAll('*') : []
  for (const el of nodes) {
    const pos = getComputedStyle(el).position
    if (pos === 'fixed' || pos === 'sticky') {
      hidden.push([el, el.style.visibility])
      el.style.visibility = 'hidden'
    }
  }
  window.__foveo = window.__foveo || {}
  window.__foveo.hidden = hidden
}
function pageScrollTo(y) { window.scrollTo(0, y) }
function pageRestore() {
  const g = window.__foveo || {}
  ;(g.hidden || []).forEach(([el, v]) => { el.style.visibility = v })
  const s = document.getElementById('__foveo_style'); if (s) s.remove()
  document.documentElement.style.overflow = g.htmlOverflow || ''
  window.scrollTo(g.x || 0, g.y || 0)
}

async function runInTab(tabId, func, args = []) {
  const [res] = await chrome.scripting.executeScript({ target: { tabId }, func, args })
  return res?.result
}

async function bitmapFromDataUrl(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob()
  return createImageBitmap(blob)
}

function u8ToBase64(u8) {
  let s = ''
  const chunk = 0x8000
  for (let i = 0; i < u8.length; i += chunk) s += String.fromCharCode.apply(null, u8.subarray(i, i + chunk))
  return btoa(s)
}

async function captureFullPage(tab) {
  const tabId = tab.id
  const m = await runInTab(tabId, pageMetrics)
  const dpr = m.dpr
  const pageH = Math.min(m.scrollHeight, MAX_PAGE_HEIGHT)
  // Collect real element rects before we scroll/hide anything (natural layout).
  const elements = await runInTab(tabId, pageCollectElements, [m.innerWidth, pageH]).catch(() => [])
  const step = Math.max(200, m.innerHeight)
  let offsets = []
  for (let y = 0; y < pageH; y += step) offsets.push(Math.min(y, Math.max(0, pageH - m.innerHeight)))
  offsets = [...new Set(offsets)].slice(0, MAX_SLICES)

  await runInTab(tabId, pagePrepare)
  const slices = []
  try {
    for (let i = 0; i < offsets.length; i++) {
      await runInTab(tabId, pageScrollTo, [offsets[i]])
      if (i === 1) await runInTab(tabId, pageHideSticky) // keep sticky on 1st slice only
      await sleep(i === 0 ? 260 : CAPTURE_GAP_MS)
      progress(`Cattura ${i + 1}/${offsets.length}…`)
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 85 })
      slices.push({ y: offsets[i], bmp: await bitmapFromDataUrl(dataUrl) })
    }
  } finally {
    await runInTab(tabId, pageRestore).catch(() => {})
  }

  // stitch at device pixels
  const bw = slices[0].bmp.width
  const canvasW = bw
  const canvasH = Math.round(pageH * dpr)
  const stitch = new OffscreenCanvas(canvasW, canvasH)
  const sctx = stitch.getContext('2d')
  for (const s of slices) { sctx.drawImage(s.bmp, 0, Math.round(s.y * dpr)); s.bmp.close() }

  // Immagine di visualizzazione (JPEG ridotto). Il vincolo sull'altezza evita
  // di produrre immagini oltre il limite per lato accettato dall'analisi.
  const scale = Math.min(1, DISPLAY_MAX_W / canvasW, DISPLAY_MAX_H / canvasH)
  const outW = Math.max(1, Math.round(canvasW * scale))
  const outH = Math.max(1, Math.round(canvasH * scale))
  const disp = new OffscreenCanvas(outW, outH)
  disp.getContext('2d').drawImage(stitch, 0, 0, outW, outH)
  const dispBlob = await disp.convertToBlob({ type: 'image/jpeg', quality: 0.72 })
  const screenshot = await blobToDataUrl(dispBlob)

  // Immagine dedicata all'analisi, entro i limiti nativi del modello: nessun
  // lato oltre AI_MAX_SIDE e costo entro AI_MAX_TOKENS. Le proporzioni restano
  // invariate, quindi le bbox normalizzate 0-1 continuano a combaciare con lo
  // screenshot mostrato nel report.
  let aiScale = Math.min(
    1,
    AI_MAX_SIDE / Math.max(canvasW, canvasH),
    Math.sqrt((AI_MAX_TOKENS * AI_PATCH * AI_PATCH) / (canvasW * canvasH)),
  )
  let aiW = Math.max(1, Math.round(canvasW * aiScale))
  let aiH = Math.max(1, Math.round(canvasH * aiScale))
  // I token si contano per patch intere, quindi l'arrotondamento può sforare di
  // poco il budget: stringi finché non rientra (un paio di giri al massimo).
  for (let i = 0; i < 6 && visualTokens(aiW, aiH) > AI_MAX_TOKENS; i++) {
    aiScale *= Math.sqrt(AI_MAX_TOKENS / visualTokens(aiW, aiH)) * 0.99
    aiW = Math.max(1, Math.round(canvasW * aiScale))
    aiH = Math.max(1, Math.round(canvasH * aiScale))
  }
  const aiCanvas = new OffscreenCanvas(aiW, aiH)
  aiCanvas.getContext('2d').drawImage(stitch, 0, 0, aiW, aiH)
  const aiBlob = await aiCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 })
  const aiImage = await blobToDataUrl(aiBlob)

  // tiny RGB sample for saliency
  const sampleH = Math.max(1, Math.round(SAMPLE_W * canvasH / canvasW))
  const samp = new OffscreenCanvas(SAMPLE_W, sampleH)
  samp.getContext('2d').drawImage(stitch, 0, 0, SAMPLE_W, sampleH)
  const img = samp.getContext('2d').getImageData(0, 0, SAMPLE_W, sampleH).data
  const rgb = new Uint8Array(SAMPLE_W * sampleH * 3)
  for (let i = 0, j = 0; i < img.length; i += 4) { rgb[j++] = img[i]; rgb[j++] = img[i + 1]; rgb[j++] = img[i + 2] }

  return {
    meta: m,
    image: { width: outW, height: outH },
    fullSize: { width: canvasW, height: canvasH },
    screenshot,
    aiImage,
    aiSize: { width: aiW, height: aiH },
    sample: { w: SAMPLE_W, h: sampleH, b64: u8ToBase64(rgb) },
    elements: Array.isArray(elements) ? elements : [],
  }
}

/** Costo in "visual token" dell'immagine: una patch da 28x28px ciascuno. */
function visualTokens(w, h) {
  return Math.ceil(w / AI_PATCH) * Math.ceil(h / AI_PATCH)
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

async function analyze({ tabId, goal, note }) {
  const { apiBase, apiKey } = await getSettings()
  if (!apiKey) return { ok: false, error: 'API key mancante' }
  const tab = await chrome.tabs.get(tabId)

  const cap = await captureFullPage(tab)
  progress('Invio al motore di analisi…')

  const body = {
    url: cap.meta.url,
    title: cap.meta.title,
    goal: goal || null,
    note: note || null,
    viewport: { width: cap.meta.innerWidth, height: cap.meta.innerHeight, dpr: cap.meta.dpr },
    image: cap.image,
    fullSize: cap.fullSize,
    screenshot: cap.screenshot,
    aiImage: cap.aiImage,
    aiSize: cap.aiSize,
    sample: cap.sample,
    elements: cap.elements,
  }

  const resp = await fetch(`${apiBase}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })
  const text = await resp.text()
  let data = {}
  try { data = JSON.parse(text) } catch { /* non-json */ }
  if (!resp.ok) {
    return { ok: false, error: data.error || `HTTP ${resp.status}: ${text.slice(0, 140)}` }
  }
  return { ok: true, id: data.id, resultPath: data.resultPath || `/analyses/${data.id}` }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'ANALYZE') {
    analyze(msg).then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e.message || e) }))
    return true // async
  }
})
