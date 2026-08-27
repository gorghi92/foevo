import Link from 'next/link'
import {
  Flame, MousePointerClick, Palette, Target, Check, Type, Ban,
  Share2, Chrome, Gauge, ScanEye, ArrowRight, Sparkles,
} from 'lucide-react'

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="heat-dot h-8 w-8 rounded-xl" aria-hidden />
      <span className="font-display text-lg font-extrabold tracking-tight">Foveo</span>
    </div>
  )
}

const FEATURES = [
  { icon: Flame, title: 'Heatmap di attenzione', body: 'Computer vision + AI stimano dove cade lo sguardo nei primi secondi. Visualizzazioni Heatmap, Focus e Originale.' },
  { icon: ScanEye, title: 'Zone ancorate al DOM', body: 'Le aree di interesse sono delimitate sugli elementi reali della pagina — non riquadri “a caso”.' },
  { icon: Target, title: 'Orientata alla conversione', body: 'Cosa vede l’utente per primo, se è allineato all’obiettivo e cosa cambiare per convertire di più.' },
  { icon: Palette, title: 'Brand & CTA', body: 'Palette, font, gerarchia visiva e contrasto delle call-to-action, con suggerimenti puntuali.' },
  { icon: Type, title: 'Copy e messaggio', body: 'Riscritture di headline e testi chiave per chiarezza, valore percepito e tono coerente.' },
  { icon: Ban, title: 'Frizioni da rimuovere', body: 'Cookie banner che coprono l’hero, moduli lunghi, distrazioni: cosa toglie punti alla conversione.' },
]

const STEPS = [
  { n: 1, icon: Chrome, title: 'Installa & accedi', body: 'Aggiungi l’estensione Chrome e accedi con la tua email — nessuna API key da gestire.' },
  { n: 2, icon: MousePointerClick, title: 'Analizza una pagina', body: 'Apri una landing o scheda prodotto e premi “Analizza”. La cattura avviene solo quando lo decidi tu.' },
  { n: 3, icon: Gauge, title: 'Leggi il report', body: 'Ricevi heatmap, punteggio di conversione e azioni concrete nella tua dashboard.' },
]

const REPORT = [
  'Punteggio di conversione con motivazione',
  'Heatmap + modalità Focus sulle aree calde',
  'Zone di attenzione delimitate sugli elementi',
  'Raccomandazioni prioritizzate e azionabili',
  'Analisi di brand, CTA, copy e frizioni',
  'Richiamo in cima alla pagina con CTA e ancore',
]

const TIERS = [
  { name: 'Base', price: '19', tier: 'Standard', feats: ['Heatmap ibrida + modalità Focus', 'Analisi AI di base', 'Punteggio di conversione', '30 analisi / mese'] },
  { name: 'Premium', price: '49', tier: 'Avanzato', feats: ['Tutto di Base', 'Brand, CTA, copy e frizioni', 'Analisi AI premium', 'Link pubblico brandizzato', '150 analisi / mese'], featured: true },
]

const FAQ = [
  { q: 'Serve una API key?', a: 'No. Accedi con la tua email dall’estensione e sei operativo. Alla parte AI pensiamo noi.' },
  { q: 'Foveo cattura le pagine in background?', a: 'Mai. Lo screenshot dell’intera pagina viene fatto solo quando premi tu il pulsante “Analizza”.' },
  { q: 'Su quali pagine funziona?', a: 'Su qualsiasi landing, home o scheda prodotto pubblica che apri nel browser: e-commerce, SaaS, servizi.' },
  { q: 'Posso condividere un’analisi?', a: 'Sì, con il piano Premium generi un link pubblico brandizzato Foveo da inviare al cliente o al team.' },
  { q: 'Come vengono gestite le tasse?', a: 'I prezzi sono IVA esclusa: l’imposta del tuo Paese viene calcolata e applicata da Whop al checkout.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <Link href="#funzionalita" className="hover:text-ink">Funzionalità</Link>
            <Link href="#come-funziona" className="hover:text-ink">Come funziona</Link>
            <Link href="#report" className="hover:text-ink">Report</Link>
            <Link href="#prezzi" className="hover:text-ink">Prezzi</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-muted hover:text-ink">Accedi</Link>
            <Link href="/signup" className="btn btn-primary">Inizia gratis</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgb(var(--hot)/.18), transparent 70%)' }} />
        <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgb(var(--warm)/.16), transparent 70%)' }} />
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-14 md:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            <Sparkles size={14} /> Attention heatmaps · analisi AI di conversione
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-6xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
            Scopri dove cade l’attenzione. <span className="text-brand">Converti di più.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Foveo cattura l’intera pagina e genera una heatmap di attenzione più un’analisi AI su
            brand, CTA, copy e frizioni — con azioni concrete, orientate al risultato.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary px-5 py-3 text-base">Prova gratis <ArrowRight size={17} /></Link>
            <Link href="#come-funziona" className="btn btn-ghost px-5 py-3 text-base">Come funziona</Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-brand" /> Nessuna API key</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-brand" /> Cattura solo on-demand</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-brand" /> Report in pochi secondi</span>
          </div>

          {/* hero visual */}
          <div className="card mt-14 overflow-hidden p-2 shadow-xl">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-bg">
              <div className="absolute left-[38%] top-[16%] h-44 w-60 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgb(var(--hot)), transparent 70%)', opacity: .8 }} />
              <div className="absolute left-[12%] top-[54%] h-28 w-28 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgb(var(--warm)), transparent 70%)', opacity: .7 }} />
              <div className="absolute right-[16%] top-[60%] h-24 w-24 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgb(var(--hot)), transparent 70%)', opacity: .5 }} />
              <div className="relative grid h-full grid-rows-[auto_1fr_auto] gap-4 p-8">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-40 rounded bg-line" />
                  <div className="h-6 w-16 rounded-full bg-brand-soft" />
                </div>
                <div className="space-y-3">
                  <div className="h-6 w-2/3 rounded bg-line" />
                  <div className="h-3 w-1/2 rounded bg-line" />
                  <div className="h-3 w-2/5 rounded bg-line" />
                </div>
                <div className="h-10 w-40 rounded-xl bg-brand" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* stat strip */}
      <section className="border-y border-line bg-panel">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
          {[
            { k: '3 sec', v: 'la finestra in cui si decide la prima impressione' },
            { k: '2 motori', v: 'computer vision + AI combinati' },
            { k: '6 dimensioni', v: 'attenzione, brand, CTA, copy, frizioni, obiettivo' },
            { k: '0 setup', v: 'accedi e analizzi, senza chiavi da gestire' },
          ].map((s) => (
            <div key={s.k}>
              <div className="font-display text-2xl font-extrabold text-ink">{s.k}</div>
              <div className="mt-1 text-sm text-muted">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="funzionalita" className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold">Un’analisi completa, non solo una heatmap</h2>
          <p className="mt-3 text-muted">Foveo unisce la mappa dell’attenzione a un giudizio AI sui fattori che spostano davvero la conversione.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition hover:border-brand/60 hover:shadow-sm">
              <span className="inline-flex rounded-xl bg-brand-soft p-2.5 text-brand"><f.icon size={20} /></span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="come-funziona" className="bg-panel">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold">Come funziona</h2>
            <p className="mt-3 text-muted">Dalla pagina al report azionabile in tre passi.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-display font-bold text-brand-fg">{s.n}</div>
                  <s.icon size={18} className="text-brand" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted"><MousePointerClick size={16} className="text-brand" /> Nessuna cattura in background: solo quando premi tu il pulsante.</p>
        </div>
      </section>

      {/* what's in the report */}
      <section id="report" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold">Cosa trovi nel report</h2>
            <p className="mt-3 text-muted">Ogni analisi è pensata per essere letta in un minuto e messa in pratica subito.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {REPORT.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm">
                  <Check size={17} className="mt-0.5 shrink-0 text-brand" /> <span>{r}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">Crea la prima analisi</Link>
              <Link href="#prezzi" className="btn btn-ghost">Vedi i prezzi</Link>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="text-sm font-semibold">Report di conversione</div>
              <span className="flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand"><Gauge size={13} /> 72 / 100</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgb(var(--hot)/.15)' }}><Share2 size={15} className="text-brand" /></span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Il cookie banner copre l’hero</div>
                  <div className="text-xs text-muted">Sposta o riduci il banner: nasconde la value proposition.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgb(var(--warm)/.18)' }}><Target size={15} className="text-brand" /></span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">CTA poco contrastata</div>
                  <div className="text-xs text-muted">Aumenta il contrasto del pulsante principale.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft"><Type size={15} className="text-brand" /></span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Headline generica</div>
                  <div className="text-xs text-muted">Riscrittura suggerita orientata al beneficio.</div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-muted">Esempio illustrativo dell’output.</p>
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="prezzi" className="bg-panel">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-center text-3xl font-extrabold">Prezzi semplici</h2>
          <p className="mt-3 text-center text-muted">Scegli il piano e inizia subito. Prezzi IVA esclusa — l’imposta è calcolata al checkout.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {TIERS.map((t) => (
              <div key={t.name} className={`card p-7 ${t.featured ? 'relative ring-2 ring-brand' : ''}`}>
                {t.featured && <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-fg">Consigliato</span>}
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-bold">{t.name}</h3>
                  <span className="label">{t.tier}</span>
                </div>
                <p className="mt-3"><span className="font-display text-4xl font-extrabold">€{t.price}</span><span className="text-muted"> + IVA / mese</span></p>
                <ul className="mt-5 space-y-2.5">
                  {t.feats.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-brand" /> {x}</li>
                  ))}
                </ul>
                <Link href={`/signup?plan=${t.name.toLowerCase()}`} className={`btn mt-6 w-full ${t.featured ? 'btn-primary' : 'btn-ghost'}`}>Inizia</Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Vuoi solo fare una prova? <Link href="/signup?plan=test" className="font-semibold text-brand">Attiva il piano Test a 1€</Link>
          </p>
        </div>
      </section>

      {/* faq */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center text-3xl font-extrabold">Domande frequenti</h2>
        <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-panel">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {f.q}
                <span className="ml-4 text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-brand-soft p-10 text-center md:p-14">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgb(var(--hot)/.25), transparent 70%)' }} />
          <h2 className="relative text-3xl font-extrabold md:text-4xl">Smetti di indovinare. Guarda dove cade l’attenzione.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted">Analizza la tua prima pagina in pochi secondi e ottieni azioni concrete per convertire di più.</p>
          <div className="relative mt-7 flex justify-center">
            <Link href="/signup" className="btn btn-primary px-6 py-3 text-base">Inizia gratis <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8 text-sm text-muted">
          <Wordmark />
          <div className="flex gap-5">
            <Link href="#prezzi" className="hover:text-ink">Prezzi</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/login" className="hover:text-ink">Accedi</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
