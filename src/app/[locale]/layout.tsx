import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n'

/** Le due lingue del sito pubblico sono note in anticipo. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/**
 * Valida il segmento di lingua: qualsiasi altro valore (es. `/qualcosa`) non è
 * una lingua e deve dare 404, non una pagina in italiano con URL sbagliato.
 */
export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  return <>{children}</>
}
