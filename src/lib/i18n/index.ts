import { it, type Dictionary } from './dictionaries/it'
import { en } from './dictionaries/en'
import { DEFAULT_LOCALE, type Locale } from './config'

const DICTIONARIES: Record<Locale, Dictionary> = { it, en }

/** Dizionario per la lingua richiesta (fallback all'italiano). */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}

export type { Dictionary }
export * from './config'
