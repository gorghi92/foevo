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
    dateLocale: 'it-IT',
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
      ctaPrimary: 'Inizia ora — da €5/mese',
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
      title: 'Tre piani, nessuna sorpresa',
      sub: 'Prezzi IVA esclusa: l’imposta del tuo Paese viene calcolata al checkout.',
      featuredBadge: 'Il più scelto da chi lavora coi clienti',
      perMonth: '+ IVA / mese',
      plans: [
        {
          slug: 'starter',
          name: 'Starter',
          per: 'Per iniziare dalle pagine che contano',
          price: '5',
          note: '€1 ad analisi',
          cta: 'Attiva Starter',
          feats: [
            '5 analisi al mese',
            'Heatmap ibrida e modalità Focus',
            'Zone di attenzione sugli elementi',
            'Punteggio di conversione con motivazione',
            'Storico delle analisi',
          ],
        },
        {
          slug: 'base',
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
          slug: 'premium',
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
      note: 'Da €5/mese + IVA · disdici quando vuoi',
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

  privacy: {
    meta: { title: 'Privacy', description: 'Privacy policy di Foevo e dell’estensione Chrome Foevo.' },
    title: 'Privacy Policy',
    updated: 'Foevo · aggiornata 2026-08-26',
    intro:
      'Foevo cattura uno screenshot di una pagina che **scegli esplicitamente di analizzare** e lo usa per generare una heatmap di attenzione e un’analisi orientata alla conversione.',
    access: {
      h: 'Cosa accede l’estensione',
      items: [
        '**Screenshot della scheda attiva**, solo quando premi “Analizza” (permesso `activeTab`, per-click).',
        '**URL e titolo** della pagina, per etichettare l’analisi.',
        'Eventuali **obiettivo e note** che digiti.',
      ],
    },
    device: {
      h: 'Dati salvati sul dispositivo',
      p: 'Endpoint e credenziali di sessione sono salvati in `chrome.storage` e lasciano il browser solo come header `Authorization` verso l’endpoint Foevo che hai configurato.',
    },
    where: {
      h: 'Dove vanno i dati',
      items: [
        'Screenshot e metadati sono inviati in HTTPS al tuo account Foevo.',
        'Per produrre l’analisi, lo screenshot è elaborato da un **provider AI di terze parti**. Screenshot e risultato restano nel tuo account.',
      ],
    },
    never: {
      h: 'Cosa NON facciamo',
      items: [
        'Nessun tracking o SDK pubblicitari.',
        'Nessuna vendita dei dati a terzi oltre al provider AI necessario.',
        'Nessuna cattura senza un tuo click.',
      ],
    },
    contact: {
      h: 'Cancellazione & contatti',
      p: 'Elimina analisi dalla dashboard in qualsiasi momento. Per richieste: [info@akmehub.com](mailto:info@akmehub.com).',
    },
  },

  support: {
    meta: {
      title: 'Assistenza',
      description: 'Assistenza per Foevo e per l’estensione Chrome: risposte alle domande frequenti e modulo di contatto.',
    },
    backHome: '← Foevo',
    title: 'Assistenza',
    sub: 'Prima le domande che riceviamo più spesso: quasi sempre la risposta è qui. Se non trovi quello che ti serve, scrivici col modulo in fondo.',
    faqTitle: 'Domande frequenti',
    faq: [
      {
        q: 'L’estensione chiede un permesso o non completa l’accesso',
        a: 'Assicurati di avere la **versione 1.2.2 o successiva**: la trovi in basso nella card dell’estensione su `chrome://extensions`. Le versioni precedenti chiedevano un permesso a runtime che interrompeva l’accesso al primo tentativo. L’estensione è sul [Chrome Web Store](STORE_URL) e si aggiorna da sola; per forzare l’aggiornamento vai su `chrome://extensions`, attiva la modalità sviluppatore e premi **Aggiorna**.',
      },
      {
        q: 'Non arriva il codice di accesso via email',
        a: 'Controlla la posta indesiderata. Puoi richiederne uno nuovo dopo circa 30 secondi e ogni codice resta valido 10 minuti. Se copi il codice dall’email, incolla pure: gli spazi vengono ignorati.',
      },
      {
        q: 'L’analisi dà errore su una pagina molto lunga',
        a: 'Aggiorna l’estensione all’ultima versione. Dalla 1.2.0 l’immagine inviata al modello viene ridimensionata entro i limiti supportati, quindi l’errore non si presenta più. Resta un limite di sicurezza sulla cattura oltre i 20.000 pixel di altezza.',
      },
      {
        q: 'Il pulsante Analizza dà errore 401',
        a: 'La sessione dell’estensione è scaduta. Apri le impostazioni dell’estensione (icona ingranaggio) e rifai l’accesso con il codice via email.',
      },
      {
        q: '“Apri una pagina web” quando premo Analizza',
        a: 'Sei su una pagina che Chrome non permette di catturare: `chrome://…`, un PDF o il Web Store. Apri una normale pagina http/https.',
      },
      {
        q: 'Come disdico l’abbonamento',
        a: 'Dalla sezione **Piano** del tuo account: l’abbonamento resta attivo fino alla scadenza del periodo già pagato e poi non viene rinnovato. Le fatture si scaricano dalla stessa pagina.',
      },
      {
        q: 'Che dati raccoglie l’estensione',
        a: 'Cattura lo screenshot solo della scheda attiva e solo quando premi Analizza. Il dettaglio completo è nella [privacy policy](PRIVACY_URL).',
      },
    ],
    formTitle: 'Scrivici',
    formSub: 'Rispondiamo di norma entro un giorno lavorativo. Più dettagli ci dai — pagina, browser, messaggio d’errore — più veloce è la risposta.',
    form: {
      topics: ['Estensione Chrome', 'Analisi e report', 'Account e accesso', 'Pagamenti e fatture', 'Altro'],
      name: 'Nome',
      email: 'Email',
      topic: 'Argomento',
      message: 'Messaggio',
      messagePlaceholder: 'Cosa stavi facendo, cosa ti aspettavi e cosa è successo. Se c’è un messaggio d’errore, incollalo qui.',
      submit: 'Invia messaggio',
      submitting: 'Invio…',
      genericError: 'Invio non riuscito. Riprova tra poco.',
      sentTitle: 'Messaggio inviato.',
      sentBody: 'Ti rispondiamo all’indirizzo che hai indicato, di solito entro un giorno lavorativo.',
      privacyNote: 'Usiamo il tuo indirizzo solo per risponderti. Vedi la [privacy policy](PRIVACY_URL).',
    },
    footerPrivacy: 'Privacy',
  },

  review: {
    meta: {
      title: 'Reviewer guide',
      description: 'Istruzioni di test passo passo per il revisore del Chrome Web Store.',
    },
    kicker: 'Chrome Web Store',
    title: 'Guida di test per il revisore',
    intro:
      'Foevo trasforma una pagina che scegli tu in una heatmap di attenzione più un’analisi di conversione. L’accesso usa un codice via email invece di una password: questi passi mostrano come leggere quel codice da una casella pubblica, senza bisogno di condividere password.',
    card: {
      account: 'Account di test',
      password: 'Password',
      passwordValue: 'nessuna — codice via email',
      inbox: 'Casella dei codici',
      inboxValue: 'mailinator.com (pubblica)',
    },
    steps: [
      {
        t: 'Fissa l’estensione',
        d: 'Dopo l’installazione, clicca l’icona a forma di puzzle nella barra di Chrome e fissa **Foevo**, così la sua icona resta visibile.',
      },
      {
        t: 'Apri la schermata di accesso',
        d: 'Clicca l’icona Foevo per aprire il popup, poi clicca l’icona a **ingranaggio (impostazioni)** in alto a destra nel popup.',
      },
      {
        t: 'Inserisci l’email di test',
        d: 'Nel campo email scrivi **ACCOUNT** e clicca **“Invia codice”**. L’accesso usa un codice via email monouso: non c’è password.',
      },
      {
        t: 'Leggi il codice dalla casella pubblica',
        d: 'Il codice a 6 cifre arriva in una casella pubblica che puoi aprire senza alcun accesso: [apri la casella →](INBOX_URL). Apri il messaggio “Foevo” più recente e copia il codice. Vale 10 minuti; se è scaduto, clicca di nuovo “Invia codice”.',
      },
      {
        t: 'Completa l’accesso',
        d: 'Incolla le 6 cifre nel popup e clicca **“Accedi”**. L’account di test ha un piano a pagamento attivo, quindi l’analisi è abilitata.',
      },
      {
        t: 'Esegui un’analisi',
        d: 'Apri una normale pagina **https** (una landing o una scheda prodotto vanno benissimo — non una pagina `chrome://`, un PDF o il Web Store). Clicca **“Analizza questa pagina”**. Dopo circa un minuto si apre in una nuova scheda un report con heatmap di attenzione e analisi di conversione.',
      },
    ],
    permissions:
      '**Permessi.** L’estensione cattura uno screenshot della sola scheda attiva e solo quando clicchi “Analizza”, e parla soltanto con `foevo.app` — il proprio servizio — per restituire il report. Non modifica le pagine, non inietta contenuti e non legge la cronologia. Dettaglio completo: [privacy policy](PRIVACY_URL).',
  },

  checkout: {
    failedTitle: 'Pagamento non completato',
    failedBody: 'Il pagamento è stato annullato o non è andato a buon fine. Puoi riprovare quando vuoi.',
    retry: 'Riprova',
    activeTitle: 'Piano attivo 🎉',
    activeBody: 'Il pagamento è confermato e il tuo piano **PLAN** è attivo. Buon lavoro con Foevo!',
    toDashboard: 'Vai alla dashboard',
    receivedTitle: 'Pagamento ricevuto',
    receivedBody: 'Grazie! Stiamo attivando il tuo piano.',
    activating: 'Stiamo confermando il pagamento con Whop… questa pagina si aggiorna da sola.',
    activatingSlow: 'L’attivazione sta impiegando più del previsto. Aggiorna tra poco: il piano si attiva appena Whop conferma il pagamento.',
    claimRedirect: 'Ti stiamo portando nella dashboard…',
    confirmedTitle: 'Pagamento confermato',
    confirmedBody: 'Accedi con la stessa email del pagamento per entrare: il piano è già attivo.',
    signIn: 'Accedi a Foevo',
    claiming: 'Stiamo attivando il tuo account e il tuo piano… ci vuole qualche secondo.',
    claimingSlow: 'La conferma sta impiegando più del previsto. Puoi accedere tra poco con la tua email.',
    login: 'Accedi',
  },

  affiliates: {
    layout: { brandSuffix: '· Affiliati', backToSite: 'Torna al sito →' },

    become: {
      meta: {
        title: 'Diventa un affiliato Foevo — guadagna consigliando Foevo',
        description:
          'Promuovi Foevo con il tuo link personale e guadagna una commissione ricorrente su ogni cliente che porti, per i primi 12 mesi. Pagamenti via bonifico.',
      },
      badge: 'Programma affiliazione',
      titleA: 'Consiglia Foevo.',
      titleB: 'Guadagna {rate} per {months} mesi.',
      titleUpTo: 'fino al ',
      titleThe: 'il ',
      sub: 'Ogni cliente che si abbona dal tuo link ti fa guadagnare una commissione ricorrente, su ogni suo rinnovo, per il primo anno. Iscrizione gratuita, nessun vincolo.',
      ctaRegister: 'Diventa affiliato',
      ctaLogin: 'Ho già un account',
      metricCommission: 'Commissione, per {months} mesi',
      metricThreshold: 'Soglia minima di pagamento',
      metricPayout: 'Bonifico',
      metricPayoutLabel: 'istantaneo, come ti paghiamo',
      pointsTitle: 'Come funziona il guadagno',
      points: [
        {
          title: 'Guadagno ricorrente',
          body: 'Non prendi la commissione una volta sola: la incassi su ogni rinnovo del cliente, per i primi {months} mesi del suo abbonamento.',
        },
        {
          title: 'Un link solo tuo',
          body: 'Ricevi un link personale unico. Chiunque si abbona passando da lì viene attribuito a te, in automatico.',
        },
        {
          title: 'Paghiamo con bonifico istantaneo',
          body: 'Richiedi il pagamento quando vuoi, dai {min} € di saldo disponibile. Inserisci l’IBAN e ricevi il bonifico istantaneo.',
        },
        {
          title: 'Tutto tracciato',
          body: 'Click, clienti portati, commissioni maturate e disponibili: li vedi in tempo reale dal tuo pannello.',
        },
      ],
      ratesTitle: 'Quanto guadagni, per piano',
      ratesSub: 'Su ogni pagamento del cliente, per i primi {months} mesi.',
      planBase: 'Piani Starter e Base',
      planPremium: 'Piano Premium',
      rateCaption: 'di commissione, per {months} mesi',
      stepsTitle: 'In 4 passi',
      steps: [
        'Ti registri e ricevi il tuo link personale.',
        'Condividi il link dove vuoi: social, newsletter, community, DM.',
        'Chi si abbona dal tuo link ti fa guadagnare il {rate} per {months} mesi.',
        'Al raggiungimento dei {min} € richiedi il bonifico.',
      ],
      alreadyCustomer:
        'Sei già cliente Foevo? Puoi diventare affiliato anche dal tuo account, nella sezione **“Invita e guadagna”**.',
      finalCta: 'Crea il mio account affiliato',
    },

    auth: {
      loginTitle: 'Accedi',
      loginSub: 'Area affiliati Foevo.',
      registerTitle: 'Diventa affiliato',
      registerSub: 'Promuovi Foevo e guadagna una commissione su ogni cliente che porti.',
      username: 'Username',
      password: 'Password',
      fullName: 'Nome e cognome',
      email: 'Email',
      emailHint: 'La usiamo per avvisarti sui pagamenti. Non è pubblica.',
      usernameHint: '3–32 caratteri: lettere minuscole, numeri, . _ -',
      passwordHint: 'Almeno 8 caratteri.',
      wait: 'Attendi…',
      login: 'Accedi',
      register: 'Crea account affiliato',
      loginError: 'Accesso non riuscito.',
      registerError: 'Registrazione non riuscita.',
      noAccount: 'Non sei ancora affiliato?',
      goRegister: 'Registrati',
      hasAccount: 'Hai già un account?',
      goLogin: 'Accedi',
    },

    dashboard: {
      greeting: 'Ciao',
      sub: 'Il tuo pannello affiliato Foevo.',
      logout: 'Esci',
      linkTitle: 'Il tuo link',
      linkSub: 'Condividilo ovunque. Ogni cliente che si abbona da questo link ti fa guadagnare.',
      copy: 'Copia',
      copied: 'Copiato',
      statClicks: 'Click sul link',
      statCustomers: 'Clienti portati',
      statEarned: 'Guadagno totale',
      statAvailable: 'Disponibile',
      payoutTitle: 'Richiedi il pagamento',
      payoutAvailable: 'Disponibile',
      payoutPending: 'in lavorazione',
      payoutMin: 'minimo',
      payoutMethod: 'pagamento via bonifico.',
      payoutCta: 'Richiedi pagamento',
      payoutSending: 'Invio…',
      payoutError: 'Richiesta non riuscita.',
      payoutNeedsIban: 'Inserisci prima l’IBAN qui sotto.',
      bankTitle: 'Coordinate bancarie',
      bankSub: 'Dove riceverai i bonifici. Visibili solo a te e all’amministrazione.',
      bankHolder: 'Intestatario',
      bankHolderPlaceholder: 'Nome e cognome dell’intestatario',
      bankIban: 'IBAN',
      bankName: 'Banca (opzionale)',
      bankCountry: 'Paese',
      bankSave: 'Salva coordinate',
      bankSaving: 'Salvo…',
      bankSaved: 'Coordinate salvate.',
      bankError: 'Errore',
      commissionsTitle: 'Commissioni',
      colDate: 'Data',
      colPlan: 'Piano',
      colMonth: 'Mese',
      colBase: 'Base',
      colRate: '%',
      colCommission: 'Commissione',
      colStatus: 'Stato',
      commissionsEmpty: 'Ancora nessuna commissione. Condividi il tuo link per iniziare.',
      payoutsTitle: 'Richieste di pagamento',
      colRequested: 'Richiesta',
      colAmount: 'Importo',
      colProcessed: 'Evasa',
      status: {
        available: 'Disponibile',
        paid: 'Pagata',
        reversed: 'Stornata',
        requested: 'In lavorazione',
        rejected: 'Rifiutata',
      },
    },
  },

  report: {
    meta: {
      titlePrefix: 'Foevo · analisi di',
      fallbackTarget: 'una pagina',
      description: 'Heatmap di attenzione e analisi AI di conversione — Foevo.',
    },
    tagline: '· Heatmap di attenzione & analisi AI di conversione',
    ctaHeader: 'Analizza la tua pagina →',
    untitled: 'Analisi',
    priorityCallout: '⚡ Azioni prioritarie',
    allRecommendations: 'Tutte le raccomandazioni ↓',
    gaugeConversion: 'Conversione',
    gaugeAttention: 'Attenzione',
    gaugeClarity: 'Chiarezza',
    gaugeCta: 'CTA',
    viewHeat: 'Heatmap',
    viewFocus: 'Focus',
    viewClean: 'Originale',
    hideZones: 'Nascondi zone',
    showZones: 'Mostra zone',
    noScreenshot: 'Screenshot non disponibile.',
    summary: 'Sintesi',
    zonesTitle: 'Zone di attenzione',
    zonesSub: '· ordinate per impatto',
    brand: 'Brand',
    fonts: 'Font:',
    tone: 'Tono:',
    ctaTitle: 'Call to action',
    contrast: 'Contrasto',
    visibility: 'Visibilità',
    copyTitle: 'Copy',
    copyClarity: '· chiarezza',
    headline: 'Headline:',
    copyIssues: 'Problemi',
    copyRewrites: 'Riscritture',
    recommendations: 'Raccomandazioni',
    frictions: 'Frizioni alla conversione',
    footerTitle: 'Vuoi la stessa analisi sulle tue pagine?',
    footerBody: 'Foevo genera una heatmap di attenzione ibrida (computer-vision + AI) e un’analisi orientata alla conversione, direttamente dal browser.',
    footerCta: 'Prova Foevo da €5/mese',
    generatedWith: 'Report generato con',
  },
}

export type Dictionary = typeof it
