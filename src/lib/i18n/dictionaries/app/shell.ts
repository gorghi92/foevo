/**
 * Testi della shell dell'app autenticata: sidebar, navigazione, misuratore di
 * consumo e banner di impersonificazione.
 */
export const it = {
  logout: 'Esci',

  /** Etichetta del piano attivo sotto l'email nella sidebar. */
  plan: {
    premium: 'Piano Premium',
    base: 'Piano Base',
  },

  nav: {
    analyses: 'Analisi',
    billing: 'Piano',
    profile: 'Profilo',
    invite: 'Invita e guadagna',
    superadmin: 'Superadmin',
    analytics: 'Analytics',
    affiliate: 'Affiliazione',
    adminSection: 'Amministrazione',
  },

  usage: {
    title: 'Analisi questo mese',
    // /billing è un percorso dell'app autenticata: non va prefissato per lingua.
    nearLimit: 'Stai per esaurire la quota. [Passa a Premium](/billing)',
  },

  impersonation: {
    actingAs: 'Stai operando come',
    note: '(impersonificazione superadmin)',
    stopping: 'Ripristino…',
    stop: 'Torna al mio account',
    error: 'Errore',
  },
}

export const en: typeof it = {
  logout: 'Sign out',

  plan: {
    premium: 'Premium plan',
    base: 'Base plan',
  },

  nav: {
    analyses: 'Analyses',
    billing: 'Plan',
    profile: 'Profile',
    invite: 'Refer and earn',
    superadmin: 'Superadmin',
    analytics: 'Analytics',
    affiliate: 'Affiliates',
    adminSection: 'Administration',
  },

  usage: {
    title: 'Analyses this month',
    nearLimit: 'You’re close to your monthly limit. [Upgrade to Premium](/billing)',
  },

  impersonation: {
    actingAs: 'You’re working as',
    note: '(superadmin impersonation)',
    stopping: 'Restoring…',
    stop: 'Back to my account',
    error: 'Something went wrong',
  },
}
