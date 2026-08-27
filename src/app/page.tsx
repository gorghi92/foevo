import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight, Check, X, Eye, Brain, Crosshair, Target, Type, Ban,
  Palette, Share2, Chrome, MousePointerClick, Gauge, ShieldCheck, Zap,
} from 'lucide-react'
import { AttentionDemo } from '@/components/landing/attention-demo'

export const metadata: Metadata = {
  title: 'Foveo — Scopri dove guardano i tuoi clienti, e perché non comprano',
  description:
    'Foveo analizza una tua pagina e restituisce la mappa dell’attenzione più un piano d’azione su brand, CTA, copy e frizioni. Report in circa un minuto, senza script da installare.',
}

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="heat-dot h-8 w-8 rounded-xl" aria-hidden />
      <span className="font-display text-lg font-extrabold tracking-tight">Foveo</span>
    </div>
  )
}

function Section({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  )
}

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`mb-3 flex items-center gap-2.5 ${center ? 'justify-center' : ''}`}>
      <span className="heat-rule h-[3px] w-7 rounded-full" aria-hidden />
      <span className="label text-brand">{children}</span>
    </div>
  )
}

const SINTOMI = [
  'Hai cambiato il colore del bottone. Poi l’headline. Poi il prezzo. A sensazione.',
  'Per un A/B test statisticamente valido servono migliaia di visite: non le hai, o non puoi aspettare tre settimane.',
  'Le heatmap classiche partono dopo: prima devi portarci traffico — e pagarlo.',
  'Chiedi un parere in giro: cinque persone, cinque opinioni, zero criteri.',
]

const MOTORI = [
  {
    icon: Eye,
    n: '01',
    title: 'Motore visivo',
    body: 'Un modello di salienza legge contrasto, densità, posizione, forme e gerarchia — la stessa base dei modelli predittivi di eye-tracking. Stima dove cade lo sguardo nei primi secondi, prima che l’utente legga qualsiasi cosa.',
  },
  {
    icon: Brain,
    n: '02',
    title: 'Motore semantico',
    body: 'Un modello multimodale guarda la pagina come la guarderebbe un cliente: cosa promette, quanto è chiara la CTA, cosa distrae, cosa manca per fidarsi. Non conta i pixel: capisce il messaggio.',
  },
  {
    icon: Crosshair,
    n: '03',
    title: 'Ancoraggio al DOM',
    body: 'Le zone di attenzione vengono agganciate agli elementi reali della pagina — quell’headline, quel bottone, quel banner. Niente riquadri approssimativi: ogni raccomandazione punta a un elemento che esiste.',
  },
]

const BENEFICI = [
  { icon: Target, t: 'Sai cosa testare per primo', b: 'Le raccomandazioni arrivano ordinate per impatto stimato. Parti dalla prima, non da quella che ti ispira di più.' },
  { icon: Ban, t: 'Trovi le frizioni che non vedi più', b: 'Cookie banner che coprono l’hero, moduli lunghi, elementi che rubano attenzione alla CTA. Cose che chi ha costruito la pagina smette di notare.' },
  { icon: Type, t: 'Ricevi il copy riscritto', b: 'Headline e testi chiave riformulati sul beneficio, non solo “questo non va bene”.' },
  { icon: Palette, t: 'Verifichi brand e gerarchia', b: 'Palette, font, contrasto della CTA e coerenza visiva, valutati rispetto all’obiettivo della pagina.' },
  { icon: Gauge, t: 'Hai un punteggio confrontabile', b: 'Un numero di conversione con la motivazione dietro: rianalizzi dopo le modifiche e vedi se sei migliorato.' },
  { icon: Share2, t: 'Condividi con cliente o team', b: 'Con Premium generi un link pubblico brandizzato: il cliente apre e vede il report, senza account.' },
]

const STEPS = [
  { n: 1, icon: Chrome, t: 'Installi l’estensione', b: 'Due minuti, con la guida passo-passo. Poi accedi con la tua email e sei operativo.' },
  { n: 2, icon: MousePointerClick, t: 'Apri una pagina e premi Analizza', b: 'Foveo cattura l’intera pagina — solo quando lo decidi tu — e la manda ai due motori.' },
  { n: 3, icon: Gauge, t: 'Leggi il report e intervieni', b: 'Heatmap, zone, punteggio e azioni prioritizzate nella tua dashboard. In circa un minuto.' },
]

const PIANI = [
  {
    nome: 'Base',
    prezzo: '19',
    per: 'Per chi ha un sito e vuole tenerlo in ordine',
    feats: [
      '30 analisi al mese',
      'Heatmap ibrida e modalità Focus',
      'Zone di attenzione sugli elementi',
      'Punteggio di conversione con motivazione',
      'Storico delle analisi',
    ],
    cta: 'Attiva Base',
    href: '/signup?plan=base',
    nota: 'circa €0,63 ad analisi',
    featured: false,
  },
  {
    nome: 'Premium',
    prezzo: '49',
    per: 'Per chi lavora sulle pagine dei clienti',
    feats: [
      '150 analisi al mese',
      'Tutto quello che c’è in Base',
      'Analisi AI premium, più profonda',
      'Brand, CTA, copy e frizioni',
      'Link pubblico brandizzato da condividere',
    ],
    cta: 'Attiva Premium',
    href: '/signup?plan=premium',
    featured: true,
    nota: 'circa €0,33 ad analisi',
  },
]

const PER_CHI = [
  'Vendi online e il traffico ti costa: ogni punto di conversione è margine.',
  'Non hai il volume di visite per fare A/B test seri, o non puoi aspettare settimane.',
  'Gestisci pagine per clienti e ti serve un’analisi difendibile, non un’opinione.',
  'Hai appena messo online una pagina e vuoi sapere cosa non va prima di spingerci ads.',
]

const NON_PER_CHI = [
  'Cerchi il tracciamento del comportamento reale degli utenti: per quello servono Hotjar o Clarity, e servono settimane di traffico.',
  'Vuoi che qualcuno rifaccia la pagina al posto tuo: Foveo ti dice cosa cambiare, le modifiche le fai tu.',
]

const FAQ = [
  {
    q: 'Quanto è attendibile? È eye-tracking vero?',
    a: 'No, ed è giusto dirlo chiaramente: Foveo produce una stima predittiva, non un tracciamento di occhi reali. Il motore visivo si basa sui modelli di salienza usati nell’eye-tracking predittivo, quello semantico valuta il messaggio. Serve a dirti cosa guardare e cosa testare per primo, oggi — non a sostituire un test su utenti reali.',
  },
  {
    q: 'Che differenza c’è con Hotjar o Microsoft Clarity?',
    a: 'Sono strumenti complementari, non alternativi. Quelli registrano cosa fanno gli utenti veri: per averne dati servono traffico e tempo. Foveo lavora prima, sulla pagina così com’è: la analizza subito, anche a traffico zero, e ti dà le ipotesi da verificare. Molti la usano proprio per decidere cosa mandare in test.',
  },
  {
    q: 'Devo installare qualcosa sul mio sito?',
    a: 'No. Foveo vive nell’estensione Chrome: nessuno script da mettere nel sito, nessun tag manager, nessun impatto sulle prestazioni. Funziona anche su pagine in staging o protette da password, perché analizza quello che vedi tu nel browser.',
  },
  {
    q: 'Come installo l’estensione?',
    a: 'L’estensione non è ancora sul Chrome Web Store: la scarichi dalla tua dashboard e la carichi in Chrome in modalità sviluppatore, seguendo la guida. Sono due minuti, e la guida è passo-passo.',
  },
  {
    q: 'Foveo cattura le mie pagine in background?',
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
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <Link href="#come" className="hover:text-ink">Come funziona</Link>
            <Link href="#report" className="hover:text-ink">In pratica</Link>
            <Link href="#prezzi" className="hover:text-ink">Prezzi</Link>
            <Link href="#faq" className="hover:text-ink">Domande</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-muted hover:text-ink sm:block">Accedi</Link>
            <Link href="#prezzi" className="btn btn-primary">Inizia ora</Link>
          </div>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        {/* alone multi-colore con lo spettro del logo */}
        <div className="heat-aurora animate-heat-drift pointer-events-none absolute inset-x-0 -top-40 h-[820px]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 px-3.5 py-1.5 text-xs font-semibold text-muted backdrop-blur">
              <Zap size={13} className="text-brand" /> Estensione Chrome · report in circa un minuto
            </span>

            <h1 className="mt-6 text-[2.7rem] font-extrabold leading-[1.02] tracking-tight md:text-[4.1rem]">
              Scopri dove guardano<br className="hidden sm:block" /> i tuoi clienti.{' '}
              <span className="heat-text">E perché non comprano.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
              Foveo analizza una tua pagina e ti restituisce la mappa dell’attenzione più un piano
              d’azione su brand, CTA, copy e frizioni. Senza aspettare settimane di traffico.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="#prezzi" className="btn btn-primary px-7 py-4 text-base shadow-lg shadow-brand/20">
                Inizia ora — da €19/mese <ArrowRight size={17} />
              </Link>
              <Link href="#come" className="btn btn-ghost px-6 py-4 text-base">Guarda come funziona</Link>
            </div>

            <p className="mt-4 text-sm text-muted">
              Disdici quando vuoi, con un click · IVA calcolata al checkout
            </p>
          </div>

          {/* demo prodotto, protagonista */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div
              className="pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[2.5rem] blur-3xl"
              style={{
                background:
                  'radial-gradient(45% 60% at 20% 30%, rgb(var(--dot)/.18), transparent 70%), radial-gradient(50% 60% at 80% 25%, rgb(var(--warm)/.24), transparent 70%), radial-gradient(60% 70% at 50% 90%, rgb(var(--hot)/.22), transparent 70%)',
              }}
              aria-hidden
            />
            <div className="heat-frame relative rounded-2xl">
              <AttentionDemo />
            </div>
            <p className="mt-4 text-center text-xs text-muted">
              Esempio di output. Passa da <b className="text-ink">Heatmap</b> a <b className="text-ink">Zone</b> per vedere le due letture.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- STRISCIA FATTI ---------------- */}
      <section className="border-y border-line bg-panel">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-7 px-6 py-9 md:grid-cols-4">
          {[
            { k: '~60 sec', v: 'dalla cattura al report completo' },
            { k: '2 motori', v: 'visivo e semantico, combinati' },
            { k: '6 dimensioni', v: 'attenzione, brand, CTA, copy, frizioni, obiettivo' },
            { k: '0 script', v: 'niente da installare sul tuo sito' },
          ].map((s) => (
            <div key={s.k}>
              <div className="heat-text font-display text-2xl font-extrabold">{s.k}</div>
              <div className="mt-1 text-sm leading-snug text-muted">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- PROBLEMA ---------------- */}
      <Section className="py-20 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Il problema</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">
              Il traffico costa.<br />Indovinare costa di più.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Porti visite su una pagina e non convertono. Apri l’analytics e scopri
              <i> quanti</i> se ne vanno, non <i>perché</i>. Così si finisce a cambiare cose a caso,
              sperando che la prossima sia quella giusta.
            </p>
          </div>
          <ul className="space-y-3 self-center">
            {SINTOMI.map((s) => (
              <li key={s} className="card flex items-start gap-3 p-4">
                <X size={17} className="mt-0.5 shrink-0 text-hot" />
                <span className="text-[15px] leading-relaxed text-ink">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------------- MECCANISMO ---------------- */}
      <section id="come" className="relative overflow-hidden border-y border-line bg-panel py-20 md:py-24">
        <div
          className="pointer-events-none absolute -right-32 top-0 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--dot)/.10), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Eyebrow>Il meccanismo</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">
              <span className="heat-text">Attention Scan</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Due motori leggono la stessa pagina da due punti di vista diversi: uno guarda come un occhio,
              l’altro capisce come un cliente. I risultati vengono fusi e ancorati agli elementi reali della pagina.
            </p>
          </div>

          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {MOTORI.map((m) => (
              <div key={m.n} className="card p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-xl bg-brand-soft p-2.5 text-brand"><m.icon size={20} /></span>
                  <span className="heat-text font-display text-lg font-extrabold opacity-40">{m.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{m.body}</p>
              </div>
            ))}
          </div>

          {/* onestà: cosa non è */}
          <div className="heat-frame mt-6 rounded-2xl">
            <div className="card border-transparent bg-brand-soft/50 p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <h3 className="font-bold">Cosa Foveo non è</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                    Non è eye-tracking su utenti reali: è una <b className="text-ink">stima predittiva</b>.
                    E non sostituisce un A/B test — ti dice <b className="text-ink">cosa testare per primo</b>, oggi,
                    invece di aspettare settimane di dati per scoprire da dove cominciare. Preferiamo dirtelo qui,
                    piuttosto che fartelo scoprire dopo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- BENEFICI ---------------- */}
      <Section className="py-20 md:py-24">
        <div className="max-w-2xl">
          <Eyebrow>Cosa ottieni</Eyebrow>
          <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">
            Non un grafico da guardare. Una lista di cose da fare.
          </h2>
        </div>
        <div className="mt-11 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BENEFICI.map((b) => (
            <div key={b.t} className="card p-6 transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md">
              <span className="inline-flex rounded-xl bg-brand-soft p-2.5 text-brand"><b.icon size={20} /></span>
              <h3 className="mt-4 text-[17px] font-bold leading-snug">{b.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- IN PRATICA ---------------- */}
      <section id="report" className="border-y border-line bg-panel py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Eyebrow>In pratica</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">Tre passi, un report</h2>
          </div>

          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6">
                <div className="flex items-center gap-3">
                  <span className="heat-dot flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-extrabold text-white">
                    {s.n}
                  </span>
                  <s.icon size={18} className="text-brand" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.b}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-brand" /> Nessuno script sul tuo sito</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-brand" /> Cattura solo su tuo comando</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-brand" /> Funziona anche in staging</span>
          </div>
        </div>
      </section>

      {/* ---------------- PER CHI ---------------- */}
      <Section className="py-20 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>Per chi è</Eyebrow>
            <h2 className="text-2xl font-extrabold leading-tight md:text-[2rem]">Foveo è per te se…</h2>
            <ul className="mt-6 space-y-3">
              {PER_CHI.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed">
                  <Check size={18} className="mt-0.5 shrink-0 text-brand" /> <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card bg-bg p-7">
            <h2 className="text-2xl font-extrabold leading-tight">Non fa per te se…</h2>
            <ul className="mt-6 space-y-3">
              {NON_PER_CHI.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted">
                  <X size={18} className="mt-0.5 shrink-0 text-muted" /> <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">
              Preferiamo perdere un cliente sbagliato che deluderne uno giusto.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------------- PREZZI ---------------- */}
      <section id="prezzi" className="relative overflow-hidden border-y border-line bg-panel py-20 md:py-24">
        <div
          className="pointer-events-none absolute -left-40 bottom-0 h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--warm)/.14), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow center>Prezzi</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">Due piani, nessuna sorpresa</h2>
            <p className="mt-4 text-lg text-muted">
              Prezzi IVA esclusa: l’imposta del tuo Paese viene calcolata al checkout.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-5 md:grid-cols-2">
            {PIANI.map((p) =>
              p.featured ? (
                <div key={p.nome} className="heat-frame rounded-2xl md:-mt-3 md:mb-3">
                  <PlanCard p={p} />
                </div>
              ) : (
                <PlanCard key={p.nome} p={p} />
              ),
            )}
          </div>

          {/* rimozione del rischio */}
          <div className="card mx-auto mt-8 flex max-w-3xl items-start gap-4 p-6">
            <ShieldCheck size={22} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <h3 className="font-bold">Nessun vincolo</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                Puoi <b className="text-ink">disdire in qualsiasi momento dal tuo account, con un click</b>:
                l’abbonamento resta attivo fino alla data di rinnovo e poi si ferma. Nessuna penale,
                nessuna email da scrivere, nessuno che prova a trattenerti al telefono.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <Section id="faq" className="py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <Eyebrow center>Domande</Eyebrow>
            <h2 className="text-3xl font-extrabold md:text-[2.6rem]">Le cose che ci chiedono prima</h2>
          </div>
          <div className="mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
            {FAQ.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 font-semibold hover:bg-bg">
                  <span>{f.q}</span>
                  <span className="mt-0.5 shrink-0 text-xl leading-none text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------- CTA FINALE ---------------- */}
      <Section className="pb-20 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-panel p-10 text-center md:p-16">
          <div className="heat-aurora animate-heat-drift pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.8rem]">
              La tua pagina ha già un problema.<br className="hidden sm:block" />{' '}
              <span className="heat-text">Tanto vale sapere quale.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
              Analizzala e leggi cosa cambieresti per primo. Ci vuole un minuto, e sai già da dove ripartire.
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="#prezzi" className="btn btn-primary px-8 py-4 text-base shadow-lg shadow-brand/20">
                Inizia ora <ArrowRight size={18} />
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Da €19/mese + IVA · disdici quando vuoi</p>
          </div>
        </div>
      </Section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-line">
        <div className="heat-rule h-[3px] w-full opacity-70" aria-hidden />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-9 text-sm text-muted">
          <div>
            <Wordmark />
            <p className="mt-2 text-xs">Attention heatmaps &amp; analisi AI di conversione.</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="#come" className="hover:text-ink">Come funziona</Link>
            <Link href="#prezzi" className="hover:text-ink">Prezzi</Link>
            <Link href="#faq" className="hover:text-ink">Domande</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/login" className="hover:text-ink">Accedi</Link>
          </div>
        </div>

        {/* origine del nome */}
        <div className="mx-auto max-w-6xl px-6 pb-9">
          <p className="max-w-2xl border-t border-line pt-5 text-xs leading-relaxed text-muted">
            <b className="text-ink">Il nome.</b> La <i>fovea</i> è la piccola cavità al centro della
            retina dove la vista è più nitida: il punto esatto su cui cade lo sguardo, mentre tutto
            il resto resta periferia. In latino <i>foveo</i> significa anche «tenere caldo» — da lì
            le mappe di calore.
          </p>
        </div>
      </footer>
    </div>
  )
}

function PlanCard({ p }: { p: (typeof PIANI)[number] }) {
  return (
    <div className={`card relative flex h-full flex-col p-7 ${p.featured ? 'border-transparent' : ''}`}>
      {p.featured && (
        <span className="heat-dot absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white">
          Il più scelto da chi lavora coi clienti
        </span>
      )}
      <h3 className="text-xl font-bold">{p.nome}</h3>
      <p className="mt-1 text-sm text-muted">{p.per}</p>
      <p className="mt-5">
        <span className="font-display text-4xl font-extrabold">€{p.prezzo}</span>
        <span className="text-muted"> + IVA / mese</span>
      </p>
      <p className="mt-1 text-xs text-muted">{p.nota}</p>
      <ul className="mt-6 space-y-2.5">
        {p.feats.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm leading-relaxed">
            <Check size={16} className="mt-0.5 shrink-0 text-brand" /> {f}
          </li>
        ))}
      </ul>
      <Link
        href={p.href}
        className={`btn mt-7 w-full py-3 ${p.featured ? 'btn-primary' : 'btn-ghost'}`}
      >
        {p.cta}
      </Link>
    </div>
  )
}
