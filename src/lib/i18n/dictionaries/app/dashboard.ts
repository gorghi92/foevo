/** Testi della dashboard dell'app autenticata (elenco analisi e onboarding). */
export const it = {
  eyebrow: 'Area di lavoro',
  title: 'Le mie analisi',
  // Il sottotitolo si compone a pezzi uniti da " · ": piano, consumo del mese e
  // punteggio medio, quest'ultimo solo quando c'è almeno un'analisi conclusa.
  subtitle: {
    noPlan: 'Nessun piano attivo',
    plan: 'Piano **{tier}**',
    usage: '{used} di {quota} analisi questo mese',
    usageUnlimited: '{used} analisi questo mese',
    avgScore: 'punteggio medio **{avg}**',
  },
  addToChrome: 'Aggiungi a Chrome',
  // Le icone restano nel codice e si accoppiano per indice.
  onboarding: [
    {
      title: 'Installa l’estensione',
      body: 'Aggiungila da Chrome Web Store con un click. Poi accedi con la tua email dalle impostazioni (⚙).',
    },
    {
      title: 'Apri una pagina e premi Analizza',
      body: 'Landing, home o scheda prodotto: la cattura parte solo quando lo decidi tu.',
    },
    {
      title: 'Leggi il report',
      body: 'Heatmap, zone e azioni prioritizzate compaiono qui, pronte da mettere in pratica.',
    },
  ],
  footer: 'Le analisi si generano dall’estensione Chrome · [gestisci il piano](/billing)',
  grid: {
    emptyTitle: 'Nessuna analisi, per ora',
    emptyBody: 'Apri una pagina nel browser e premi Analizza dall’estensione: heatmap, punteggio e raccomandazioni compariranno qui.',
    search: 'Cerca per titolo o indirizzo…',
    counter: '{shown} di {total}',
    untitled: 'Senza titolo',
    scoreLabel: 'Punteggio di conversione',
    deleteAction: 'Elimina analisi',
    deleteConfirm: 'Eliminare questa analisi? L’azione è definitiva.',
    noMatch: 'Nessuna analisi corrisponde a “{query}”.',
    statusProcessing: 'In corso',
    statusError: 'Errore',
    // Età dell'analisi in forma breve; oltre la settimana si passa alla data.
    ago: {
      now: 'ora',
      minutes: '{n} min fa',
      hours: '{n} h fa',
      days: '{n} g fa',
    },
  },
}

export const en: typeof it = {
  eyebrow: 'Workspace',
  title: 'My analyses',
  subtitle: {
    noPlan: 'No active plan',
    plan: '**{tier}** plan',
    usage: '{used} of {quota} analyses this month',
    usageUnlimited: '{used} analyses this month',
    avgScore: 'average score **{avg}**',
  },
  addToChrome: 'Add to Chrome',
  onboarding: [
    {
      title: 'Install the extension',
      body: 'Add it from the Chrome Web Store in one click. Then sign in with your email from the settings (⚙).',
    },
    {
      title: 'Open a page and hit Analyse',
      body: 'Landing page, homepage or product page: the capture only starts when you say so.',
    },
    {
      title: 'Read the report',
      body: 'Heatmap, zones and prioritised actions show up here, ready to act on.',
    },
  ],
  footer: 'Analyses are created from the Chrome extension · [manage your plan](/billing)',
  grid: {
    emptyTitle: 'No analyses yet',
    emptyBody: 'Open a page in your browser and hit Analyse from the extension: heatmap, score and recommendations will show up here.',
    search: 'Search by title or address…',
    counter: '{shown} of {total}',
    untitled: 'Untitled',
    scoreLabel: 'Conversion score',
    deleteAction: 'Delete analysis',
    deleteConfirm: 'Delete this analysis? This cannot be undone.',
    noMatch: 'No analysis matches “{query}”.',
    statusProcessing: 'In progress',
    statusError: 'Error',
    ago: {
      now: 'now',
      minutes: '{n} min ago',
      hours: '{n} h ago',
      days: '{n} d ago',
    },
  },
}
