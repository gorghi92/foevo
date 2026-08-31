/** Testi dell'area Analytics (statistiche del sito pubblico + heatmap). */
export const it = {
  header: {
    title: 'Analytics',
    subtitle: 'Visite al sito, sorgenti e comportamento sulla landing — con heatmap dei click.',
  },

  nav: {
    overview: 'Panoramica',
    heatmap: 'Heatmap',
  },

  /** Suffisso dei selettori di periodo: 7g / 30g / 90g. */
  daysSuffix: 'g',

  overview: {
    liveOne: 'visitatore',
    liveMany: 'visitatori',
    liveNow: 'in questo momento',

    emptyBefore:
      'Nessun dato ancora in questa finestra. Il tracker raccoglie le visite non appena il sito riceve traffico — apri',
    emptyAfter: 'e ricarica tra qualche minuto.',

    kpiVisitors: 'Visitatori unici',
    kpiSessions: 'Sessioni',
    kpiPageviews: 'Pagine viste',
    kpiAvgDuration: 'Durata media',
    kpiAvgDurationSub: '{n} pagine/sessione',

    bounceRate: 'Frequenza di rimbalzo',
    bounceHint: 'sessioni con una sola pagina',
    pagesPerSession: 'Pagine per sessione',
    pageviewsPerVisitor: 'Pagine viste / visitatore',

    trendTitle: 'Andamento · ultimi {n} giorni',
    trendPageviews: '{date}: {n} pagine viste',
    trendVisitors: '{date}: {n} visitatori',
    legendVisitors: 'visitatori',
    legendPageviews: 'pagine viste',
    today: 'oggi',

    topPagesTitle: 'Pagine più viste',
    colPage: 'Pagina',
    colViews: 'Viste',
    colVisitors: 'Visitatori',
    colTime: 'Tempo',

    sourcesTitle: 'Sorgenti di traffico',
    tagCampaign: 'campagna',
    tagReferral: 'referral',

    devicesTitle: 'Dispositivi',
    browsersTitle: 'Browser',
    countriesTitle: 'Paesi',

    recentTitle: 'Attività recente',
    recentEmpty: 'Nessuna visita recente.',
    ago: '{v} fa',

    footerNote:
      'Analytics first-party: dati raccolti e conservati solo sui nostri sistemi, nessun servizio terzo, nessun IP salvato. Per la heatmap dei click e la profondità di scroll di una pagina apri la scheda [Heatmap](/analytics/heatmap).',
  },

  heatmap: {
    pageLabel: 'Pagina',
    noPages: 'Nessuna pagina tracciata ancora.',
    periodLabel: 'Periodo',
    deviceLabel: 'Device',
    deviceAll: 'Tutti',
    deviceDesktop: 'Desktop',
    deviceMobile: 'Mobile',

    statClicks: 'Click registrati',
    statPageviews: 'Pagine viste',
    statScrollSamples: 'Campioni di scroll',
    pickPage: 'Seleziona una pagina per vedere la heatmap.',

    showPage: 'Mostra la pagina',
    intensity: 'Intensità',
    radius: 'Raggio',
    clicksCount: '{n} click',
    previewFailed:
      'Anteprima della pagina non caricabile qui: la heatmap è comunque disegnata sulla proporzione della pagina.',
    previewTitle: 'Anteprima pagina',
    measureTitle: 'misura',
    noClicks: 'Nessun click registrato su questa pagina',

    scrollTitle: 'Profondità di scroll',
    scrollSub: 'Percentuale di visite che ha raggiunto ogni fascia di profondità della pagina.',
    scrollEmpty: 'Ancora nessun dato di scroll per questa pagina.',
  },
}

export const en: typeof it = {
  header: {
    title: 'Analytics',
    subtitle: 'Site visits, traffic sources and on-page behaviour — with click heatmaps.',
  },

  nav: {
    overview: 'Overview',
    heatmap: 'Heatmap',
  },

  /** Suffisso dei selettori di periodo: 7d / 30d / 90d. */
  daysSuffix: 'd',

  overview: {
    liveOne: 'visitor',
    liveMany: 'visitors',
    liveNow: 'right now',

    emptyBefore:
      'No data in this window yet. The tracker starts collecting visits as soon as the site gets traffic — open',
    emptyAfter: 'and reload in a few minutes.',

    kpiVisitors: 'Unique visitors',
    kpiSessions: 'Sessions',
    kpiPageviews: 'Pageviews',
    kpiAvgDuration: 'Avg. session duration',
    kpiAvgDurationSub: '{n} pages/session',

    bounceRate: 'Bounce rate',
    bounceHint: 'single-page sessions',
    pagesPerSession: 'Pages per session',
    pageviewsPerVisitor: 'Pageviews / visitor',

    trendTitle: 'Trend · last {n} days',
    trendPageviews: '{date}: {n} pageviews',
    trendVisitors: '{date}: {n} visitors',
    legendVisitors: 'visitors',
    legendPageviews: 'pageviews',
    today: 'today',

    topPagesTitle: 'Top pages',
    colPage: 'Page',
    colViews: 'Views',
    colVisitors: 'Visitors',
    colTime: 'Time',

    sourcesTitle: 'Traffic sources',
    tagCampaign: 'campaign',
    tagReferral: 'referral',

    devicesTitle: 'Devices',
    browsersTitle: 'Browsers',
    countriesTitle: 'Countries',

    recentTitle: 'Recent activity',
    recentEmpty: 'No recent visits.',
    ago: '{v} ago',

    footerNote:
      'First-party analytics: data is collected and stored on our own systems only — no third-party service, no IP addresses kept. For click heatmaps and scroll depth on a single page, open the [Heatmap](/analytics/heatmap) tab.',
  },

  heatmap: {
    pageLabel: 'Page',
    noPages: 'No pages tracked yet.',
    periodLabel: 'Period',
    deviceLabel: 'Device',
    deviceAll: 'All',
    deviceDesktop: 'Desktop',
    deviceMobile: 'Mobile',

    statClicks: 'Clicks recorded',
    statPageviews: 'Pageviews',
    statScrollSamples: 'Scroll samples',
    pickPage: 'Select a page to see its heatmap.',

    showPage: 'Show the page',
    intensity: 'Intensity',
    radius: 'Radius',
    clicksCount: '{n} clicks',
    previewFailed:
      'The page preview cannot load here: the heatmap is still drawn on the page’s proportions.',
    previewTitle: 'Page preview',
    measureTitle: 'measurement',
    noClicks: 'No clicks recorded on this page',

    scrollTitle: 'Scroll depth',
    scrollSub: 'Share of visits that reached each depth band of the page.',
    scrollEmpty: 'No scroll data for this page yet.',
  },
}
