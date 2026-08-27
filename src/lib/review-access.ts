import { getSettings } from './settings'

/**
 * Accesso temporaneo per la revisione dello store.
 *
 * Il revisore del Chrome Web Store non può ricevere il codice OTP, che arriva
 * su una casella email. Questo permette a UN SOLO indirizzo, per un periodo
 * definito, di usare un codice fisso al posto di quello inviato per email.
 *
 * Tre vincoli lo tengono stretto, ed è il terzo quello che conta:
 *  - vale solo per l'email indicata in REVIEW_EMAIL;
 *  - vale solo per l'estensione, non per l'accesso al sito;
 *  - **scade da sé** a REVIEW_UNTIL. Non dipende dal ricordarsi di toglierlo:
 *    passata quella data smette di funzionare anche se resta configurato.
 */
export interface ReviewCheck { allowed: boolean; reason: string }

export async function checkReviewAccess(email: string, code: string): Promise<ReviewCheck> {
  const s = await getSettings()
  const revEmail = (s.REVIEW_EMAIL || '').trim().toLowerCase()
  const revCode = (s.REVIEW_CODE || '').trim()
  const until = (s.REVIEW_UNTIL || '').trim()

  if (!revEmail || !revCode || !until) return { allowed: false, reason: 'non configurato' }
  if (email.trim().toLowerCase() !== revEmail) return { allowed: false, reason: 'email diversa' }

  const t = Date.parse(until)
  if (!Number.isFinite(t)) return { allowed: false, reason: 'scadenza non valida' }
  if (Date.now() > t) return { allowed: false, reason: 'scaduto' }

  if (code.trim() !== revCode) return { allowed: false, reason: 'codice errato' }
  return { allowed: true, reason: 'ok' }
}
