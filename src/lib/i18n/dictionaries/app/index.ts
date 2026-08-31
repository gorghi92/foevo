/**
 * Dizionari dell'app autenticata, divisi per area.
 *
 * Ogni modulo esporta `it` e `en: typeof it`: le due lingue stanno una accanto
 * all'altra, così una chiave aggiunta solo in italiano rompe subito il
 * typecheck (regola bilingue del progetto).
 */
import * as shell from './shell'
import * as auth from './auth'
import * as dashboard from './dashboard'
import * as analyses from './analyses'
import * as admin from './admin'
import * as billing from './billing'
import * as profile from './profile'
import * as invita from './invita'
import * as affiliazione from './affiliazione'
import * as analytics from './analytics'

export const appIt = {
  shell: shell.it,
  auth: auth.it,
  dashboard: dashboard.it,
  analyses: analyses.it,
  admin: admin.it,
  billing: billing.it,
  profile: profile.it,
  invita: invita.it,
  affiliazione: affiliazione.it,
  analytics: analytics.it,
}

export const appEn: typeof appIt = {
  shell: shell.en,
  auth: auth.en,
  dashboard: dashboard.en,
  analyses: analyses.en,
  admin: admin.en,
  billing: billing.en,
  profile: profile.en,
  invita: invita.en,
  affiliazione: affiliazione.en,
  analytics: analytics.en,
}
