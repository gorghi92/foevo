/* Foveo — popup controller */
const DEFAULT_BASE = 'https://foevo.vercel.app'
const $ = (id) => document.getElementById(id)

const els = {
  viewMain: $('view-main'), viewSettings: $('view-settings'),
  settingsBtn: $('settings-btn'), backBtn: $('back-btn'),
  apiBase: $('api-base'), email: $('email'), password: $('password'),
  saveBtn: $('save-settings'), saved: $('settings-saved'), signup: $('signup-link'),
  goal: $('goal'), note: $('note'), analyzeBtn: $('analyze-btn'),
  status: $('status'), statusText: $('status-text'), error: $('error'),
  tierHint: $('tier-hint'), acct: $('acct'), dashLink: $('dashboard-link'),
}

async function getSettings() {
  const s = await chrome.storage.sync.get(['apiBase', 'apiKey', 'email'])
  return { apiBase: (s.apiBase || DEFAULT_BASE).replace(/\/+$/, ''), apiKey: s.apiKey || '', email: s.email || '' }
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
  const { apiBase, apiKey, email } = await getSettings()
  els.dashLink.href = `${apiBase}/dashboard`
  if (els.signup) els.signup.href = `${apiBase}/signup`
  els.tierHint.textContent = apiKey
    ? 'La profondità dell\'analisi dipende dal tuo piano Foveo.'
    : '⚠ Accedi con il tuo account Foveo dalle impostazioni (⚙).'
  els.acct.textContent = apiKey ? (email || 'connesso') : 'non connesso'
}

/* ---- settings / login view ---- */
els.settingsBtn.addEventListener('click', async () => {
  const { apiBase, email } = await getSettings()
  els.apiBase.value = apiBase
  els.email.value = email
  els.password.value = ''
  if (els.signup) els.signup.href = `${apiBase}/signup`
  els.saved.hidden = true
  show('settings')
})
els.backBtn.addEventListener('click', () => { show('main'); refreshLinks() })

// No default host permission: the configured endpoint is granted at runtime.
async function ensureHostPermission(apiBase) {
  let origin
  try { origin = new URL(apiBase).origin + '/*' } catch { return true }
  if (!/^https:\/\//.test(origin)) return true // http (dev) can't be requested; use the unpacked build
  try {
    if (await chrome.permissions.contains({ origins: [origin] })) return true
    return await chrome.permissions.request({ origins: [origin] })
  } catch { return false }
}

function saveMsg(text, error) {
  els.saved.textContent = text
  els.saved.style.color = error ? 'var(--danger)' : ''
  els.saved.hidden = false
}

/* Login: manda le credenziali all'app, che le valida su Supabase e restituisce
 * una API key per il device (l'utente non gestisce chiavi a mano). */
els.saveBtn.addEventListener('click', async () => {
  const apiBase = (els.apiBase.value || DEFAULT_BASE).trim().replace(/\/+$/, '')
  const email = els.email.value.trim()
  const password = els.password.value
  if (!email || !password) { saveMsg('Inserisci email e password.', true); return }

  // Persist the endpoint first — granting a host permission can restart the
  // extension context and abort what runs after the prompt.
  await chrome.storage.sync.set({ apiBase })
  const granted = await ensureHostPermission(apiBase)
  if (!granted) { saveMsg('Concedi il permesso per il sito e premi di nuovo Accedi.', true); return }

  saveMsg('Accesso in corso…', false)
  els.saveBtn.disabled = true
  try {
    const resp = await fetch(`${apiBase}/api/extension/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok || !data.key) throw new Error(data.error || `Errore ${resp.status}`)
    await chrome.storage.sync.set({ apiBase, apiKey: data.key, email: data.email || email })
    saveMsg('Connesso ✓', false)
    setTimeout(() => { show('main'); refreshLinks(); setError('') }, 700)
  } catch (e) {
    saveMsg(String(e.message || e), true)
  } finally {
    els.saveBtn.disabled = false
  }
})

/* ---- analyze ---- */
els.analyzeBtn.addEventListener('click', async () => {
  setError('')
  const { apiBase, apiKey } = await getSettings()
  if (!apiKey) { setError('Accedi prima con il tuo account Foveo (⚙).'); show('settings'); return }

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
