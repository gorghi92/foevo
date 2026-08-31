import { it as siteIt } from './dictionaries/it'
import { en as siteEn } from './dictionaries/en'
import { appIt, appEn } from './dictionaries/app'
import { DEFAULT_LOCALE, type Locale } from './config'

/**
 * Dizionario completo: sito pubblico + app autenticata (sotto `app`).
 * L'italiano definisce la struttura, l'inglese deve combaciare: se una chiave
 * manca il typecheck fallisce, e la regola bilingue resta verificata dal compilatore.
 */
const it = { ...siteIt, app: appIt }
const en: typeof it = { ...siteEn, app: appEn }

const DICTIONARIES: Record<Locale, typeof it> = { it, en }

/** Dizionario per la lingua richiesta (fallback all'italiano). */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}

export type Dictionary = typeof it
export * from './config'
