import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, isLocale, localeFromAcceptLanguage, type Locale } from './config'

/**
 * Lingua di una richiesta API.
 *
 * Ordine: header impostato dal middleware -> cookie di preferenza ->
 * Accept-Language -> italiano. L'header copre le chiamate dal browser; cookie e
 * Accept-Language coprono i client esterni (estensione Chrome, integrazioni via
 * API key) che passano dal middleware ma possono non avere una sessione.
 */
export function requestLocale(req?: Request): Locale {
  const get = req
    ? (name: string) => req.headers.get(name)
    : (name: string) => {
        try { return headers().get(name) } catch { return null }
      }

  const fromHeader = get(LOCALE_HEADER)
  if (isLocale(fromHeader)) return fromHeader

  const cookieHeader = get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`))
  if (match && isLocale(match[1])) return match[1]

  if (!req) {
    try {
      const fromCookie = cookies().get(LOCALE_COOKIE)?.value
      if (isLocale(fromCookie)) return fromCookie
    } catch { /* fuori da un contesto di richiesta */ }
  }

  return localeFromAcceptLanguage(get('accept-language')) ?? DEFAULT_LOCALE
}

/**
 * Messaggi che l'utente può leggere: errori delle API e testi delle email
 * transazionali. L'italiano definisce la struttura, l'inglese la deve
 * rispettare — se manca una chiave il typecheck fallisce.
 */
const it = {
  // --- autenticazione e permessi
  notAuthenticated: 'Non autenticato',
  notAuthorized: 'Non autorizzato',
  superadminOnly: 'Solo superadmin',
  invalidSession: 'Sessione non valida',
  invalidCredentials: 'Credenziali non valide',
  accountNotFound: 'Account non trovato',
  accountSuspended: 'Account sospeso. Contatta l’assistenza.',
  noUserWithEmail: 'Nessun utente con questa email',
  cannotDeleteSelf: 'Non puoi eliminare il tuo account',
  noActiveImpersonation: 'Nessuna impersonificazione attiva',

  // --- validazione generica
  invalidJson: 'Corpo della richiesta non valido',
  invalidSignature: 'Firma non valida',
  invalidParams: 'Parametri non validi',
  nothingToUpdate: 'Nessun dato da aggiornare',
  formExpired: 'Sessione del modulo scaduta. Ricarica la pagina e riprova.',

  // --- email e codici monouso
  emailRequired: 'Email richiesta',
  emailAndPasswordRequired: 'Email e password richieste',
  emailAndCodeRequired: 'Email e codice a 6 cifre richiesti',
  invalidEmail: 'Email non valida',
  enterValidEmail: 'Inserisci un indirizzo email valido.',
  enterValidEmailForReply: 'Inserisci un indirizzo email valido: ci serve per risponderti.',
  emailAlreadyUsed: 'Questa email è già usata da un altro account.',
  enterSixDigitCode: 'Inserisci il codice a 6 cifre',
  codeExpired: 'Codice scaduto: richiedine uno nuovo.',
  noActiveCode: 'Nessun codice attivo: richiedine uno nuovo.',
  tooManyAttempts: 'Troppi tentativi: richiedi un nuovo codice.',
  codeAlreadyRequested: 'Hai già richiesto un codice: attendi qualche secondo.',
  noPendingEmailChange: 'Nessuna richiesta attiva: ripeti il cambio email.',
  emailNotConfigured: 'Invio email non configurato',
  emailSendFailed: 'Invio email non riuscito',

  // --- assistenza
  sendFailed: 'Invio non riuscito. Riprova tra poco.',
  writeMoreDetail: 'Scrivi qualche riga in più su cosa succede.',
  tooManySubmissions: 'Troppi invii ravvicinati. Riprova tra qualche minuto.',

  // --- piani, quote, checkout
  noActivePlan: 'Nessun piano attivo: attiva un abbonamento su foevo.app per analizzare.',
  quotaExceeded: 'Quota mensile esaurita ({used}/{quota}).',
  planMissing: 'Piano mancante',
  planUnavailable: 'Piano non disponibile',
  basePackageUnavailable: 'Pacchetto Base non disponibile',
  checkoutNotConfigured: 'Checkout non configurato per questo piano',
  whopConfigMissing: 'Configurazione Whop mancante',
  noWhopSubscription: 'Nessun abbonamento Whop da annullare',
  invoiceNotFound: 'Fattura non trovata',

  // --- analisi
  incompletePayload: 'Payload incompleto: servono "screenshot" e "sample".',
  analysisNotFound: 'Analisi non trovata',
  noAiProvider: 'Nessun provider AI configurato.',
  analysisFailed: 'Errore analisi',
  apiKeyMissing: 'Chiave mancante. Usa: Authorization: Bearer fv_...',
  apiKeyInvalid: 'Chiave non valida',
  apiKeyRevoked: 'Chiave revocata',
  apiKeyExpired: 'Chiave scaduta',
  internalError: 'Errore interno',
  invalidEffort: 'Effort non valido',
  invalidPercent: 'Percentuale non valida (0–100)',
  imageTooLarge: 'Immagine troppo grande per l’analisi: riprova su una pagina meno lunga.',
  pageTooLongOldExtension:
    'Pagina troppo lunga per questa versione dell’estensione: aggiorna all’ultima versione dalla dashboard.',

  // --- affiliazione
  enterUsernameAndPassword: 'Inserisci username e password.',
  passwordTooShort: 'La password deve avere almeno 8 caratteri.',
  usernameTaken: 'Username già in uso.',
  usernameTakenPickAnother: 'Username già in uso: scegline un altro.',
  activationFailed: 'Attivazione non riuscita, riprova.',
  requestFailed: 'Richiesta non riuscita, riprova.',
  saveFailed: 'Salvataggio non riuscito.',
  invalidIban: 'IBAN non valido: controlla il formato.',
  enterAccountHolder: 'Inserisci l’intestatario del conto.',
  bankDetailsFirst: 'Prima inserisci le coordinate bancarie (IBAN e intestatario).',
  commissionNotFound: 'Commissione non trovata',
  alreadySettled: 'Già liquidata: recupero manuale.',
  payoutNotFound: 'Richiesta non trovata',
  payoutAlreadyProcessed: 'Richiesta già evasa',
  // --- validazione di dettaglio
  missingId: 'id mancante',
  missingUserId: 'userId richiesto',
  missingCommissionId: 'commissionId mancante',
  missingIdRequired: 'id richiesto',
  missingEmail: 'email richiesta',
  missingNameSlug: 'name e slug richiesti',
  userNotFound: 'Utente non trovato',
  wrongUsernameOrPassword: 'Username o password non corretti.',
  usernameFormat: 'Username: 3–32 caratteri, lettere minuscole, numeri, . _ -',
  usernameFormatLong: 'Username: 3–32 caratteri, solo lettere minuscole, numeri, . _ -',
  sameEmailAsCurrent: 'È già la tua email attuale.',
}

const en: typeof it = {
  notAuthenticated: 'Not authenticated',
  notAuthorized: 'Not authorized',
  superadminOnly: 'Superadmins only',
  invalidSession: 'Invalid session',
  invalidCredentials: 'Invalid credentials',
  accountNotFound: 'Account not found',
  accountSuspended: 'Account suspended. Please contact support.',
  noUserWithEmail: 'No user with this email',
  cannotDeleteSelf: 'You cannot delete your own account',
  noActiveImpersonation: 'No impersonation in progress',

  invalidJson: 'Invalid request body',
  invalidSignature: 'Invalid signature',
  invalidParams: 'Invalid parameters',
  nothingToUpdate: 'Nothing to update',
  formExpired: 'The form session expired. Reload the page and try again.',

  emailRequired: 'Email required',
  emailAndPasswordRequired: 'Email and password required',
  emailAndCodeRequired: 'Email and 6-digit code required',
  invalidEmail: 'Invalid email',
  enterValidEmail: 'Enter a valid email address.',
  enterValidEmailForReply: 'Enter a valid email address: we need it to reply to you.',
  emailAlreadyUsed: 'This email is already used by another account.',
  enterSixDigitCode: 'Enter the 6-digit code',
  codeExpired: 'The code expired: request a new one.',
  noActiveCode: 'No active code: request a new one.',
  tooManyAttempts: 'Too many attempts: request a new code.',
  codeAlreadyRequested: 'You already requested a code: wait a few seconds.',
  noPendingEmailChange: 'No pending request: start the email change again.',
  emailNotConfigured: 'Email sending is not configured',
  emailSendFailed: 'Could not send the email',

  sendFailed: 'Sending failed. Please try again shortly.',
  writeMoreDetail: 'Tell us a little more about what is happening.',
  tooManySubmissions: 'Too many submissions in a row. Try again in a few minutes.',

  noActivePlan: 'No active plan: start a subscription on foevo.app to run analyses.',
  quotaExceeded: 'Monthly quota used up ({used}/{quota}).',
  planMissing: 'Missing plan',
  planUnavailable: 'Plan unavailable',
  basePackageUnavailable: 'The Base package is unavailable',
  checkoutNotConfigured: 'Checkout is not configured for this plan',
  whopConfigMissing: 'Whop configuration missing',
  noWhopSubscription: 'No Whop subscription to cancel',
  invoiceNotFound: 'Invoice not found',

  incompletePayload: 'Incomplete payload: "screenshot" and "sample" are required.',
  analysisNotFound: 'Analysis not found',
  noAiProvider: 'No AI provider configured.',
  analysisFailed: 'Analysis failed',
  apiKeyMissing: 'Missing key. Use: Authorization: Bearer fv_...',
  apiKeyInvalid: 'Invalid key',
  apiKeyRevoked: 'Revoked key',
  apiKeyExpired: 'Expired key',
  internalError: 'Internal error',
  invalidEffort: 'Invalid effort',
  invalidPercent: 'Invalid percentage (0–100)',
  imageTooLarge: 'Image too large to analyse: try a shorter page.',
  pageTooLongOldExtension:
    'This page is too long for your extension version: update to the latest one from the dashboard.',

  enterUsernameAndPassword: 'Enter your username and password.',
  passwordTooShort: 'The password must be at least 8 characters long.',
  usernameTaken: 'That username is taken.',
  usernameTakenPickAnother: 'That username is taken: pick another one.',
  activationFailed: 'Activation failed, please try again.',
  requestFailed: 'The request failed, please try again.',
  saveFailed: 'Could not save.',
  invalidIban: 'Invalid IBAN: check the format.',
  enterAccountHolder: 'Enter the account holder’s name.',
  bankDetailsFirst: 'Add your bank details first (IBAN and account holder).',
  commissionNotFound: 'Commission not found',
  alreadySettled: 'Already settled: recover it manually.',
  payoutNotFound: 'Request not found',
  payoutAlreadyProcessed: 'Request already processed',
  missingId: 'missing id',
  missingUserId: 'userId required',
  missingCommissionId: 'commissionId missing',
  missingIdRequired: 'id required',
  missingEmail: 'email required',
  missingNameSlug: 'name and slug required',
  userNotFound: 'User not found',
  wrongUsernameOrPassword: 'Wrong username or password.',
  usernameFormat: 'Username: 3–32 characters, lowercase letters, digits, . _ -',
  usernameFormatLong: 'Username: 3–32 characters, only lowercase letters, digits, . _ -',
  sameEmailAsCurrent: 'That is already your current email.',
}

const MESSAGES: Record<Locale, typeof it> = { it, en }

export type ApiMessages = typeof it
export type ApiMessageKey = keyof ApiMessages

/** Catalogo dei messaggi nella lingua richiesta. */
export function messages(locale: Locale): ApiMessages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
}

/**
 * Messaggio risolto nella lingua della richiesta corrente, con i segnaposto
 * `{nome}` sostituiti: `m('quotaExceeded', { used, quota })`.
 *
 * Non serve passare la Request: la lingua si legge dagli header della richiesta
 * in corso. Passa `req` solo dove ce l'hai già a portata di mano.
 */
export function m(key: ApiMessageKey, vars?: Record<string, string | number>, req?: Request): string {
  const text = messages(requestLocale(req))[key]
  return vars ? text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : text
}
