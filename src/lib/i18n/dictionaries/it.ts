/**
 * Dizionario italiano — è la fonte di verità della STRUTTURA.
 * Il tipo `Dictionary` deriva da qui: ogni chiave aggiunta qui va aggiunta
 * anche in `en.ts`, altrimenti il typecheck fallisce (regola bilingue).
 *
 * Nel testo si possono usare: **grassetto**, *corsivo* e \n per andare a capo
 * (resi dal componente <Rich>).
 */
export const it = {
  common: {
    login: 'Accedi',
    signup: 'Registrati',
    startNow: 'Inizia ora',
    back: 'Indietro',
    loading: 'Caricamento…',
    language: 'Lingua',
  },

  home: {
    meta: {
      title: 'Foevo — Scopri dove guardano i tuoi clienti, e perché non comprano',
      description:
        'Foevo analizza una tua pagina e restituisce la mappa dell’attenzione più un piano d’azione su brand, CTA, copy e frizioni. Report in circa un minuto, senza script da installare.',
    },
    nav: { how: 'Come funziona', inPractice: 'In pratica', pricing: 'Prezzi', faq: 'Domande' },

    hero: {
      badge: 'Estensione Chrome · report in circa un minuto',
      titleA: 'Scopri dove guardano i tuoi clienti.',
      titleB: 'E perché non comprano.',
      sub: 'Foevo analizza una tua pagina e ti restituisce la mappa dell’attenzione più un piano d’azione su brand, CTA, copy e frizioni. Senza aspettare settimane di traffico.',
      ctaPrimary: 'Inizia ora — da €19/mese',
      ctaSecondary: 'Guarda come funziona',
      note: 'Disdici quando vuoi, con un click · IVA calcolata al checkout',
      demoNote: 'Esempio di output. Passa da **Heatmap** a **Zone** per vedere le due letture.',
    },

    facts: [
      { k: '~60 sec', v: 'dalla cattura al report completo' },
      { k: '2 motori', v: 'visivo e semantico, combinati' },
      { k: '6 dimensioni', v: 'attenzione, brand, CTA, copy, frizioni, obiettivo' },
      { k: '0 script', v: 'niente da installare sul tuo sito' },
    ],

    problem: {
      eyebrow: 'Il problema',
      title: 'Il traffico costa.\nIndovinare costa di più.',
      body: 'Porti visite su una pagina e non convertono. Apri l’analytics e scopri *quanti* se ne vanno, non *perché*. Così si finisce a cambiare cose a caso, sperando che la prossima sia quella giusta.',
      symptoms: [
        'Hai cambiato il colore del bottone. Poi l’headline. Poi il prezzo. A sensazione.',
        'Per un A/B test statisticamente valido servono migliaia di visite: non le hai, o non puoi aspettare tre settimane.',
        'Le heatmap classiche partono dopo: prima devi portarci traffico — e pagarlo.',
        'Chiedi un parere in giro: cinque persone, cinque opinioni, zero criteri.',
      ],
    },

    engine: {
      eyebrow: 'Il meccanismo',
      title: 'Attention Scan',
      body: 'Due motori leggono la stessa pagina da due punti di vista diversi: uno guarda come un occhio, l’altro capisce come un cliente. I risultati vengono fusi e ancorati agli elementi reali della pagina.',
      items: [
        {
          title: 'Motore visivo',
          body: 'Un modello di salienza legge contrasto, densità, posizione, forme e gerarchia — la stessa base dei modelli predittivi di eye-tracking. Stima dove cade lo sguardo nei primi secondi, prima che l’utente legga qualsiasi cosa.',
        },
        {
          title: 'Motore semantico',
          body: 'Un modello multimodale guarda la pagina come la guarderebbe un cliente: cosa promette, quanto è chiara la CTA, cosa distrae, cosa manca per fidarsi. Non conta i pixel: capisce il messaggio.',
        },
        {
          title: 'Ancoraggio al DOM',
          body: 'Le zone di attenzione vengono agganciate agli elementi reali della pagina — quell’headline, quel bottone, quel banner. Niente riquadri approssimativi: ogni raccomandazione punta a un elemento che esiste.',
        },
      ],
      notIsTitle: 'Cosa Foevo non è',
      notIsBody:
        'Non è eye-tracking su utenti reali: è una **stima predittiva**. E non sostituisce un A/B test — ti dice **cosa testare per primo**, oggi, invece di aspettare settimane di dati per scoprire da dove cominciare. Preferiamo dirtelo qui, piuttosto che fartelo scoprire dopo.',
    },

    benefits: {
      eyebrow: 'Cosa ottieni',
      title: 'Non un grafico da guardare. Una lista di cose da fare.',
      items: [
        { t: 'Sai cosa testare per primo', b: 'Le raccomandazioni arrivano ordinate per impatto stimato. Parti dalla prima, non da quella che ti ispira di più.' },
        { t: 'Trovi le frizioni che non vedi più', b: 'Cookie banner che coprono l’hero, moduli lunghi, elementi che rubano attenzione alla CTA. Cose che chi ha costruito la pagina smette di notare.' },
        { t: 'Ricevi il copy riscritto', b: 'Headline e testi chiave riformulati sul beneficio, non solo “questo non va bene”.' },
        { t: 'Verifichi brand e gerarchia', b: 'Palette, font, contrasto della CTA e coerenza visiva, valutati rispetto all’obiettivo della pagina.' },
        { t: 'Hai un punteggio confrontabile', b: 'Un numero di conversione con la motivazione dietro: rianalizzi dopo le modifiche e vedi se sei migliorato.' },
        { t: 'Condividi con cliente o team', b: 'Con Premium generi un link pubblico brandizzato: il cliente apre e vede il report, senza account.' },
      ],
    },

    steps: {
      eyebrow: 'In pratica',
      title: 'Tre passi, un report',
      items: [
        { t: 'Installi l’estensione', b: 'Un click dal Chrome Web Store. Poi accedi con la tua email e sei operativo.' },
        { t: 'Apri una pagina e premi Analizza', b: 'Foevo cattura l’intera pagina — solo quando lo decidi tu — e la manda ai due motori.' },
        { t: 'Leggi il report e intervieni', b: 'Heatmap, zone, punteggio e azioni prioritizzate nella tua dashboard. In circa un minuto.' },
      ],
      checks: ['Nessuno script sul tuo sito', 'Cattura solo su tuo comando', 'Funziona anche in staging'],
    },

    audience: {
      eyebrow: 'Per chi è',
      forTitle: 'Foevo è per te se…',
      forItems: [
        'Vendi online e il traffico ti costa: ogni punto di conversione è margine.',
        'Non hai il volume di visite per fare A/B test seri, o non puoi aspettare settimane.',
        'Gestisci pagine per clienti e ti serve un’analisi difendibile, non un’opinione.',
        'Hai appena messo online una pagina e vuoi sapere cosa non va prima di spingerci ads.',
      ],
      notTitle: 'Non fa per te se…',
      notItems: [
        'Cerchi il tracciamento del comportamento reale degli utenti: per quello servono Hotjar o Clarity, e servono settimane di traffico.',
        'Vuoi che qualcuno rifaccia la pagina al posto tuo: Foevo ti dice cosa cambiare, le modifiche le fai tu.',
      ],
      note: 'Preferiamo perdere un cliente sbagliato che deluderne uno giusto.',
    },

    pricing: {
      eyebrow: 'Prezzi',
      title: 'Due piani, nessuna sorpresa',
      sub: 'Prezzi IVA esclusa: l’imposta del tuo Paese viene calcolata al checkout.',
      featuredBadge: 'Il più scelto da chi lavora coi clienti',
      perMonth: '+ IVA / mese',
      plans: [
        {
          name: 'Base',
          per: 'Per chi ha un sito e vuole tenerlo in ordine',
          price: '19',
          note: 'circa €0,63 ad analisi',
          cta: 'Attiva Base',
          feats: [
            '30 analisi al mese',
            'Heatmap ibrida e modalità Focus',
            'Zone di attenzione sugli elementi',
            'Punteggio di conversione con motivazione',
            'Storico delle analisi',
          ],
        },
        {
          name: 'Premium',
          per: 'Per chi lavora sulle pagine dei clienti',
          price: '49',
          note: 'circa €0,33 ad analisi',
          cta: 'Attiva Premium',
          feats: [
            '150 analisi al mese',
            'Tutto quello che c’è in Base',
            'Analisi AI premium, più profonda',
            'Brand, CTA, copy e frizioni',
            'Link pubblico brandizzato da condividere',
          ],
        },
      ],
      noLockTitle: 'Nessun vincolo',
      noLockBody:
        'Puoi **disdire in qualsiasi momento dal tuo account, con un click**: l’abbonamento resta attivo fino alla data di rinnovo e poi si ferma. Nessuna penale, nessuna email da scrivere, nessuno che prova a trattenerti al telefono.',
    },

    faq: {
      eyebrow: 'Domande',
      title: 'Le cose che ci chiedono prima',
      items: [
        {
          q: 'Quanto è attendibile? È eye-tracking vero?',
          a: 'No, ed è giusto dirlo chiaramente: Foevo produce una stima predittiva, non un tracciamento di occhi reali. Il motore visivo si basa sui modelli di salienza usati nell’eye-tracking predittivo, quello semantico valuta il messaggio. Serve a dirti cosa guardare e cosa testare per primo, oggi — non a sostituire un test su utenti reali.',
        },
        {
          q: 'Che differenza c’è con Hotjar o Microsoft Clarity?',
          a: 'Sono strumenti complementari, non alternativi. Quelli registrano cosa fanno gli utenti veri: per averne dati servono traffico e tempo. Foevo lavora prima, sulla pagina così com’è: la analizza subito, anche a traffico zero, e ti dà le ipotesi da verificare. Molti la usano proprio per decidere cosa mandare in test.',
        },
        {
          q: 'Devo installare qualcosa sul mio sito?',
          a: 'No. Foevo vive nell’estensione Chrome: nessuno script da mettere nel sito, nessun tag manager, nessun impatto sulle prestazioni. Funziona anche su pagine in staging o protette da password, perché analizza quello che vedi tu nel browser.',
        },
        {
          q: 'Come installo l’estensione?',
          a: 'La aggiungi dal Chrome Web Store con un click, poi accedi con la tua email dalle impostazioni dell’estensione. Nessuna modalità sviluppatore, nessuno zip da caricare: sei operativo in un minuto.',
        },
        {
          q: 'Foevo cattura le mie pagine in background?',
          a: 'Mai. Lo screenshot viene fatto solo quando premi tu il pulsante Analizza, sulla scheda che hai aperto. Nessuna raccolta automatica, nessun monitoraggio in sottofondo.',
        },
        {
          q: 'Su quali pagine funziona?',
          a: 'Su qualsiasi pagina che apri nel browser: landing, home, schede prodotto, checkout, pagine di iscrizione. E-commerce, SaaS, servizi, portfolio.',
        },
        {
          q: 'Posso disdire quando voglio?',
          a: 'Sì, dal tuo account, con un click. L’abbonamento resta attivo fino alla data di rinnovo e poi non viene rinnovato. Nessuna telefonata, nessuna email da scrivere.',
        },
        {
          q: 'Perché i prezzi sono IVA esclusa?',
          a: 'Perché l’imposta dipende dal tuo Paese e viene calcolata al checkout dal nostro gestore dei pagamenti. Vedi l’importo esatto prima di confermare, senza sorprese in fattura.',
        },
      ],
    },

    finalCta: {
      titleA: 'La tua pagina ha già un problema.',
      titleB: 'Tanto vale sapere quale.',
      sub: 'Analizzala e leggi cosa cambieresti per primo. Ci vuole un minuto, e sai già da dove ripartire.',
      cta: 'Inizia ora',
      note: 'Da €19/mese + IVA · disdici quando vuoi',
    },

    footer: {
      tagline: 'Attention heatmaps & analisi AI di conversione.',
      affiliates: 'Diventa un affiliato',
      support: 'Assistenza',
      privacy: 'Privacy',
      nameStory:
        '**Il nome.** La *fovea* è la fossetta al centro della retina dove la vista è più nitida: il punto in cui l’occhio mette a fuoco l’attenzione. Sulla retina, però, ogni immagine arriva capovolta — è il cervello a rimetterla dritta. Anche **Foevo** ha due lettere scambiate di posto: un piccolo promemoria che quello che credi si veda non è mai esattamente quello che si vede.',
    },
  },
}

export type Dictionary = typeof it
