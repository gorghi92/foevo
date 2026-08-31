/* Foevo — testi bilingui dell'estensione.
 *
 * L'italiano definisce la struttura, l'inglese la deve rispettare: se aggiungi
 * una chiave, aggiungila in entrambe le lingue (regola bilingue del progetto).
 *
 * La lingua è quella salvata dall'utente; alla prima apertura si deduce da
 * quella dell'interfaccia di Chrome.
 */

export const LOCALES = ['it', 'en']
export const DEFAULT_LOCALE = 'it'

const MESSAGES = {
  it: {
    headerSub: 'Heatmap & analisi AI',
    settings: 'Impostazioni',

    goalLabel: 'Obiettivo della pagina',
    optional: '(opzionale)',
    goalAuto: 'Rileva automaticamente',
    goalLead: 'Generare lead / iscrizioni',
    goalSale: 'Vendita diretta / checkout',
    goalProduct: 'Scheda prodotto e-commerce',
    goalBooking: 'Prenotazione / appuntamento',
    goalSignup: 'Registrazione / trial',

    noteLabel: 'Contesto',
    notePlaceholder: 'es. audience freddo da Meta Ads',

    analyze: 'Analizza questa pagina',
    analyzing: 'Analisi in corso…',
    capturing: 'Cattura in corso…',
    capturingPage: 'Cattura della pagina…',
    captureSlice: 'Cattura {i}/{n}…',
    sendingToEngine: 'Invio al motore di analisi…',
    done: 'Fatto! Apro il report…',

    tierHintConnected: 'La profondità dell’analisi dipende dal tuo piano Foevo.',
    tierHintDisconnected: '⚠ Accedi con il tuo account Foevo dalle impostazioni (⚙).',
    connected: 'connesso',
    disconnected: 'non connesso',
    myAnalyses: 'Le mie analisi →',

    emailLabel: 'Email Foevo',
    emailPlaceholder: 'tu@esempio.com',
    codeLabel: 'Codice ricevuto via email',
    changeEmail: 'Usa un’altra email',
    noAccount: 'Non hai un account? Registrati →',
    sendCode: 'Invia codice',
    signIn: 'Accedi',
    back: 'Indietro',
    connectedCheck: 'Connesso ✓',

    enterEmail: 'Inserisci la tua email.',
    missingPermission: 'Permesso mancante per foevo.app: reinstalla l’estensione.',
    sendingCode: 'Invio del codice…',
    codeSent: 'Ti abbiamo inviato un codice a 6 cifre. Controlla la posta.',
    enterSixDigits: 'Inserisci il codice a 6 cifre.',
    verifying: 'Verifica in corso…',

    signInFirst: 'Accedi prima con il tuo account Foevo (⚙).',
    openWebPage: 'Apri una pagina web (http/https) da analizzare.',
    unknownError: 'Errore sconosciuto',
    httpError: 'Errore {status}',
    missingApiKey: 'API key mancante',

    language: 'Lingua',
  },

  en: {
    headerSub: 'Heatmap & AI analysis',
    settings: 'Settings',

    goalLabel: 'Page goal',
    optional: '(optional)',
    goalAuto: 'Detect automatically',
    goalLead: 'Generate leads / sign-ups',
    goalSale: 'Direct sale / checkout',
    goalProduct: 'E-commerce product page',
    goalBooking: 'Booking / appointment',
    goalSignup: 'Registration / trial',

    noteLabel: 'Context',
    notePlaceholder: 'e.g. cold audience from Meta Ads',

    analyze: 'Analyse this page',
    analyzing: 'Analysing…',
    capturing: 'Capturing…',
    capturingPage: 'Capturing the page…',
    captureSlice: 'Capture {i}/{n}…',
    sendingToEngine: 'Sending to the analysis engine…',
    done: 'Done! Opening the report…',

    tierHintConnected: 'How deep the analysis goes depends on your Foevo plan.',
    tierHintDisconnected: '⚠ Sign in with your Foevo account from settings (⚙).',
    connected: 'connected',
    disconnected: 'not connected',
    myAnalyses: 'My analyses →',

    emailLabel: 'Foevo email',
    emailPlaceholder: 'you@example.com',
    codeLabel: 'Code received by email',
    changeEmail: 'Use another email',
    noAccount: 'No account yet? Sign up →',
    sendCode: 'Send code',
    signIn: 'Sign in',
    back: 'Back',
    connectedCheck: 'Connected ✓',

    enterEmail: 'Enter your email.',
    missingPermission: 'Missing permission for foevo.app: reinstall the extension.',
    sendingCode: 'Sending the code…',
    codeSent: 'We sent you a 6-digit code. Check your inbox.',
    enterSixDigits: 'Enter the 6-digit code.',
    verifying: 'Verifying…',

    signInFirst: 'Sign in with your Foevo account first (⚙).',
    openWebPage: 'Open a web page (http/https) to analyse.',
    unknownError: 'Unknown error',
    httpError: 'Error {status}',
    missingApiKey: 'Missing API key',

    language: 'Language',
  },
}

const isLocale = (v) => LOCALES.includes(v)

/**
 * Lingua da usare: preferenza salvata, altrimenti quella dell'interfaccia di
 * Chrome, altrimenti italiano.
 */
export async function getLocale() {
  try {
    const s = await chrome.storage.sync.get(['locale'])
    if (isLocale(s.locale)) return s.locale
  } catch { /* storage non disponibile */ }
  try {
    const ui = (chrome.i18n?.getUILanguage?.() || '').split('-')[0]
    if (isLocale(ui)) return ui
  } catch { /* i18n non disponibile */ }
  return DEFAULT_LOCALE
}

export async function setLocale(locale) {
  if (!isLocale(locale)) return
  await chrome.storage.sync.set({ locale })
}

/** Traduttore per una lingua già risolta: `tr('captureSlice', { i, n })`. */
export function translator(locale) {
  const dict = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE]
  return (key, vars) => {
    const text = dict[key] ?? key
    return vars ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : text
  }
}
