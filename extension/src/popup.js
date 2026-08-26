/* Foveo — popup controller */
const DEFAULT_BASE = 'https://foveo.app'
const $ = (id) => document.getElementById(id)

const els = {
  viewMain: $('view-main'), viewSettings: $('view-settings'),
  settingsBtn: $('settings-btn'), backBtn: $('back-btn'),
  apiBase: $('api-base'), apiKey: $('api-key'), saveBtn: $('save-settings'),
  saved: $('settings-saved'), getKey: $('get-key-link'),
  goal: $('goal'), note: $('note'), analyzeBtn: $('analyze-btn'),
  status: $('status'), statusText: $('status-text'), error: $('error'),
  tierHint: $('tier-hint'), acct: $('acct'), dashLink: $('dashboard-link'),
}

async function getSettings() {
  const s = await chrome.storage.sync.get(['apiBase', 'apiKey'])
  return { apiBase: (s.apiBase || DEFAULT_BASE).replace(/\/+$/, ''), apiKey: s.apiKey || '' }
}

function show(view) {
  els.viewMain.hidden = view !== 'main'
  els.viewSettings.hidden = view !== 'settings'
}

function setStatus(text) {
  if (text) { els.statusText.textContent = text; els.status.hidden = false }
  else els.status.hidden = true
}
function setError(msg) {
  els.error.textContent = msg || ''
  els.error.hidden = !msg
}
function busy(on) {
  els.analyzeBtn.disabled = on
  els.analyzeBtn.textContent = on ? 'Analisi in corso…' : 'Analizza questa pagina'
}

async function refreshLinks() {
  const { apiBase, apiKey } = await getSettings()
  els.getKey.href = `${apiBase}/settings/api-keys`
  els.dashLink.href = `${apiBase}/dashboard`
  els.tierHint.textContent = apiKey
    ? 'Il tier (base Qwen / premium Claude) dipende dal tuo piano Foveo.'
    : '⚠ Nessuna API key: apri le impostazioni (⚙) per configurarla.'
  els.acct.textContent = apiKey ? apiKey.slice(0, 10) + '…' : 'non connesso'
}

/* ---- settings view ---- */
els.settingsBtn.addEventListener('click', async () => {
  const { apiBase, apiKey } = await getSettings()
  els.apiBase.value = apiBase
  els.apiKey.value = apiKey
  els.getKey.href = `${apiBase}/settings/api-keys`
  els.saved.hidden = true
  show('settings')
})
els.backBtn.addEventListener('click', () => { show('main'); refreshLinks() })
// The extension ships with no default host permission, so the endpoint the user
// configures is granted at runtime (friendlier Web Store review).
async function ensureHostPermission(apiBase) {
  let origin
  try { origin = new URL(apiBase).origin + '/*' } catch { return true }
  if (!/^https:\/\//.test(origin)) return true // http (dev) can't be requested; use the unpacked build
  try {
    if (await chrome.permissions.contains({ origins: [origin] })) return true
    return await chrome.permissions.request({ origins: [origin] })
  } catch { return false }
}

els.saveBtn.addEventListener('click', async () => {
  const apiBase = (els.apiBase.value || DEFAULT_BASE).trim().replace(/\/+$/, '')
  const apiKey = els.apiKey.value.trim()
  const granted = await ensureHostPermission(apiBase)
  await chrome.storage.sync.set({ apiBase, apiKey })
  if (!granted) {
    els.saved.textContent = '⚠ Endpoint salvato, ma senza permesso host l\'analisi fallirà. Ri-salva per concederlo.'
    els.saved.style.color = 'var(--danger)'
    els.saved.hidden = false
    return
  }
  els.saved.textContent = 'Salvato ✓'
  els.saved.style.color = ''
  els.saved.hidden = false
  setTimeout(() => { show('main'); refreshLinks(); setError('') }, 700)
})

/* ---- analyze ---- */
els.analyzeBtn.addEventListener('click', async () => {
  setError('')
  const { apiBase, apiKey } = await getSettings()
  if (!apiKey) { setError('Configura prima la API key (⚙).'); show('settings'); return }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !/^https?:/.test(tab.url || '')) {
    setError('Apri una pagina web (http/https) da analizzare.'); return
  }

  busy(true); setStatus('Cattura della pagina…')
  try {
    const res = await chrome.runtime.sendMessage({
      type: 'ANALYZE',
      tabId: tab.id,
      goal: els.goal.value,
      note: els.note.value.trim(),
    })
    if (!res || !res.ok) throw new Error(res?.error || 'Errore sconosciuto')
    setStatus('Fatto! Apro il report…')
    await chrome.tabs.create({ url: `${apiBase}${res.resultPath}` })
    window.close()
  } catch (e) {
    setError(String(e.message || e))
  } finally {
    busy(false); setStatus(null)
  }
})

// live progress from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'PROGRESS') setStatus(msg.text)
})

refreshLinks()
