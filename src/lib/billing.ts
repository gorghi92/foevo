import { isSuperadmin } from './superadmin'

/**
 * Account che NON devono contare come clienti paganti / abbonamenti attivi:
 * superadmin, account di test e l'account che serve solo alla review di Google.
 * Consumano risorse (quindi restano nelle statistiche di consumo), ma non sono ricavi.
 *
 * La lista di default è sovrascrivibile con la env NON_BILLABLE_EMAILS
 * (elenco separato da virgole). I superadmin sono sempre esclusi.
 */
const NON_BILLABLE = (
  process.env.NON_BILLABLE_EMAILS ||
  'info@akmehub.com,foevo-review@mailinator.com,gorghi92@hotmail.it'
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

/** true se l'email va conteggiata come cliente pagante reale. */
export function isBillable(email?: string | null): boolean {
  if (!email) return true // email sconosciuta → conteggia (scelta conservativa)
  const e = email.toLowerCase()
  if (isSuperadmin(e)) return false
  return !NON_BILLABLE.includes(e)
}
