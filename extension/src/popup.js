/* Foveo — popup controller */
const DEFAULT_BASE = 'https://foevo.app'
const $ = (id) => document.getElementById(id)

const els = {
  viewMain: $('view-main'), viewSettings: $('view-settings'),
  settingsBtn: $('settings-btn'), backBtn: $('back-btn'),
  apiBase: $('api-base'), email: $('email'),
  code: $('code'), codeStep: $('code-step'), changeEmail: $('change-email'),
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
async function openSettings() {
  const { apiBase, email } = await getSettings()
  els.apiBase.value = apiBase
  els.email.value = email
  resetOtp()
  if (els.signup) els.signup.href = `${apiBase}/signup`
  els.saved.hidden = true
  show('settings')
}
els.settingsBtn.addEventListener('click', openSettings)
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

/* Login in due passi, senza password: chiediamo un codice via email e lo
 * verifichiamo. L'app risponde con la API key del device. */
let otpStep = 'email'

function resetOtp() {
  otpStep = 'email'
  if (els.code) els.code.value = ''
  if (els.codeStep) els.codeStep.hidden = true
  els.saveBtn.textContent = 'Invia codice'
  els.email.disabled = false
}

function goToCodeStep() {
  otpStep = 'code'
  els.codeStep.hidden = false
  els.saveBtn.textContent = 'Accedi'
  els.email.disabled = true
  els.code.focus()
}

if (els.changeEmail) {
  els.changeEmail.addEventListener('click', (e) => { e.preventDefault(); resetOtp(); saveMsg('', false); els.email.focus() })
}

async function requestCode(apiBase, email) {
  const resp = await fetch(`${apiBase}/api/extension/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(data.error || `Errore ${resp.status}`)
  return data
}

async function verifyCode(apiBase, email, code) {
  const resp = await fetch(`${apiBase}/api/extension/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok || !data.key) throw new Error(data.error || `Errore ${resp.status}`)
  return data
}

els.saveBtn.addEventListener('click', async () => {
  const apiBase = (els.apiBase.value || DEFAULT_BASE).trim().replace(/\/+$/, '')
  const email = els.email.value.trim()
  if (!email) { saveMsg('Inserisci la tua email.', true); return }

  // Salva l'endpoint prima del permesso: concederlo può riavviare il contesto
  // dell'estensione e interrompere quello che viene dopo.
  await chrome.storage.sync.set({ apiBase })
  const granted = await ensureHostPermission(apiBase)
  if (!granted) { saveMsg('Concedi il permesso per il sito e premi di nuovo.', true); return }

  els.saveBtn.disabled = true
  try {
    if (otpStep === 'email') {
      saveMsg('Invio del codice…', false)
      await requestCode(apiBase, email)
      goToCodeStep()
      saveMsg('Ti abbiamo inviato un codice a 6 cifre. Controlla la posta.', false)
    } else {
      const code = (els.code.value || '').replace(/\D/g, '')
      if (code.length !== 6) { saveMsg('Inserisci il codice a 6 cifre.', true); return }
      saveMsg('Verifica in corso…', false)
      const data = await verifyCode(apiBase, email, code)
      await chrome.storage.sync.set({ apiBase, apiKey: data.key, email: data.email || email })
      resetOtp()
      saveMsg('Connesso \u2713', false)
      setTimeout(() => { show('main'); refreshLinks(); setError('') }, 700)
    }
  } catch (e) {
    saveMsg(String(e.message || e), true)
  } finally {
    els.saveBtn.disabled = false
  }
})

// Invio con Enter dal campo del codice
if (els.code) {
  els.code.addEventListener('keydown', (e) => { if (e.key === 'Enter') els.saveBtn.click() })
}

/* ---- analyze ---- */
els.analyzeBtn.addEventListener('click', async () => {
  setError('')
  const { apiBase, apiKey } = await getSettings()
  if (!apiKey) { setError('Accedi prima con il tuo account Foveo (⚙).'); await openSettings(); return }

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
