import Link from 'next/link'
import { Flame, MousePointerClick, Palette, Target, Check } from 'lucide-react'

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="heat-dot h-8 w-8 rounded-xl" aria-hidden />
      <span className="font-display text-lg font-extrabold tracking-tight">Foveo</span>
    </div>
  )
}

const FEATURES = [
  { icon: Flame, title: 'Heatmap ibrida', body: 'Computer vision + AI stimano dove cade l’attenzione nei primi secondi. Modalità Heatmap, Focus e Originale.' },
  { icon: Target, title: 'Orientata alla conversione', body: 'Cosa vede l’utente per primo, se è allineato all’obiettivo, e cosa cambiare per convertire di più.' },
  { icon: Palette, title: 'Brand, CTA e copy', body: 'Palette colori, font, contrasto delle call-to-action, riscritture del copy e frizioni da rimuovere.' },
]

const STEPS = [
  'Installa l’estensione Chrome e incolla la tua API key.',
  'Apri una landing o scheda prodotto e premi "Analizza".',
  'Ricevi heatmap + report azionabile nella tua dashboard.',
]

const TIERS = [
  { name: 'Base', price: '19', tier: 'Standard', feats: ['Heatmap ibrida', 'Analisi AI (base)', '30 analisi / mese'] },
  { name: 'Premium', price: '49', tier: 'Avanzato', feats: ['Tutto di Base', 'Brand, CTA, copy e frizioni', 'Analisi AI premium', '150 analisi / mese'], featured: true },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Wordmark />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-muted hover:text-ink">Accedi</Link>
          <Link href="/signup" className="btn btn-primary">Inizia gratis</Link>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-10 md:pt-20">
        <p className="label mb-4">Attention heatmaps · AI conversion analysis</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-6xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
          Scopri dove cade l’attenzione. Converti di più.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Foveo cattura lo screenshot dell’intera pagina e genera una heatmap di attenzione
          più un’analisi AI su brand, CTA, copy e frizioni — orientata al risultato.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="btn btn-primary px-5 py-3 text-base">Prova gratis</Link>
          <Link href="#come-funziona" className="btn btn-ghost px-5 py-3 text-base">Come funziona</Link>
        </div>

        {/* hero visual */}
        <div className="card mt-14 overflow-hidden p-2 shadow-2xl">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-bg">
            <div className="absolute left-[38%] top-[18%] h-40 w-56 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgb(var(--hot)), transparent 70%)', opacity: .8 }} />
            <div className="absolute left-[12%] top-[52%] h-28 w-28 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgb(var(--warm)), transparent 70%)', opacity: .7 }} />
            <div className="relative grid h-full grid-rows-[auto_1fr_auto] gap-4 p-8">
              <div className="h-3 w-40 rounded bg-line" />
              <div className="space-y-3">
                <div className="h-6 w-2/3 rounded bg-line" />
                <div className="h-3 w-1/2 rounded bg-line" />
              </div>
              <div className="h-10 w-40 rounded-xl bg-brand" />
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <f.icon className="mb-3 text-brand" size={22} />
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="come-funziona" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-bold">Come funziona</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={i} className="card p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-display font-bold text-brand-fg">{i + 1}</div>
              <p className="text-sm text-ink">{s}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted"><MousePointerClick size={16} /> Nessuna cattura in background: solo quando premi tu il pulsante.</p>
      </section>

      {/* pricing */}
      <section id="prezzi" className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="text-center text-2xl font-bold">Prezzi semplici</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {TIERS.map((t) => (
            <div key={t.name} className={`card p-7 ${t.featured ? 'ring-2 ring-brand' : ''}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold">{t.name}</h3>
                <span className="label">{t.tier}</span>
              </div>
              <p className="mt-3"><span className="font-display text-4xl font-extrabold">€{t.price}</span><span className="text-muted">/mese</span></p>
              <ul className="mt-5 space-y-2.5">
                {t.feats.map((x) => (
                  <li key={x} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 text-brand" /> {x}</li>
                ))}
              </ul>
              <Link href="/signup" className={`btn mt-6 w-full ${t.featured ? 'btn-primary' : 'btn-ghost'}`}>Inizia</Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8 text-sm text-muted">
          <Wordmark />
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/login" className="hover:text-ink">Accedi</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
