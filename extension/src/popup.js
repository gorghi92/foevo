/* Foveo — popup controller */
const DEFAULT_BASE = 'https://foevo.app'
const $ = (id) => document.getElementById(id)

const els = {
  viewMain: $('view-main'), viewSettings: $('view-settings'),
  settingsBtn: $('settings-btn'), backBtn: $('back-btn'),
  email: $('email'),
  code: $('code'), codeStep: $('code-step'), changeEmail: $('change-email'),
  saveBtn: $('save-settings'), saved: $('settings-saved'), signup: $('signup-link'),
  goal: $('goal'), note: $('note'), analyzeBtn: $('analyze-btn'),
  status: $('status'), statusText: $('status-text'), error: $('error'),
  tierHint: $('tier-hint'), acct: $('acct'), dashLink: $('dashboard-link'),
}

async function getSettings() {
  const s = await chrome.storage.sync.get(['apiKey', 'email'])
  // Endpoint fisso: è l'unico host dichiarato nel manifest.
  return { apiBase: DEFAULT_BASE, apiKey: s.apiKey || '', email: s.email || '' }
}

// Ripulisce l'endpoint personalizzato salvato dalle versioni precedenti.
chrome.storage.sync.remove('apiBase').catch(() => {})

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
  els.email.value = email
  resetOtp()
  if (els.signup) els.signup.href = `${apiBase}/signup`
  els.saved.hidden = true
  show('settings')
}
els.settingsBtn.addEventListener('click', openSettings)
els.backBtn.addEventListener('click', () => { show('main'); refreshLinks() })

/* L'host di Foveo è dichiarato in "host_permissions" nel manifest, quindi il
 * permesso c'è già: non chiediamo nulla a runtime. Concedere un permesso, in
 * MV3, riavvia il contesto del popup e interrompe l'operazione in corso — era
 * il motivo per cui il primo tentativo di login sembrava non fare nulla. */
async function ensureHostPermission(apiBase) {
  try {
    const origin = new URL(apiBase).origin + '/*'
    return await chrome.permissions.contains({ origins: [origin] })
  } catch { return true }
}

function saveMsg(text, error) {
  els.saved.textContent = text
  els.saved.style.color = error ? 'var(--danger)' : ''
  els.saved.hidden = false
}

/* Login in due passi, senza password: chiediamo un codice via email e lo
 * verifichiamo. L'app risponde con la API key del device. */
let otpStep = 'email'
let running = false

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
  const { apiBase } = await getSettings()
  const email = els.email.value.trim()
  if (!email) { saveMsg('Inserisci la tua email.', true); return }

  const granted = await ensureHostPermission(apiBase)
  if (!granted) { saveMsg('Permesso mancante per foevo.app: reinstalla l\u2019estensione.', true); return }

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
      await chrome.storage.sync.set({ apiKey: data.key, email: data.email || email })
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

// Campo codice: accetta solo cifre e tollera l'incolla con spazi o separatori.
if (els.code) {
  els.code.addEventListener('input', () => {
    const clean = (els.code.value || '').replace(/\D/g, '').slice(0, 6)
    if (els.code.value !== clean) els.code.value = clean
  })
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

  running = true
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
    running = false
    busy(false); setStatus(null)
  }
})

/* Avanzamento dal background: lo mostriamo solo se l'analisi è stata avviata da
 * questo popup. Altrimenti, riaprendo il popup, si vedrebbe "Cattura in corso"
 * per un'analisi che l'utente non ha lanciato in questa sessione. */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'PROGRESS' && running) setStatus(msg.text)
})

refreshLinks()
