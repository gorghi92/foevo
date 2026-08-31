import type { Metadata } from 'next'
import Link from 'next/link'
import { SupportForm } from './support-form'
import { issueFormToken } from '@/lib/form-token'
import { CHROME_STORE_URL } from '@/lib/links'

// Il token è legato al momento del render, quindi la pagina non va messa in cache.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Assistenza',
  description: 'Assistenza per Foevo e per l’estensione Chrome: risposte alle domande frequenti e modulo di contatto.',
}

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'L’estensione chiede un permesso o non completa l’accesso',
    a: <>Assicurati di avere la <b>versione 1.2.2 o successiva</b>: la trovi in basso nella card dell’estensione
       su <code>chrome://extensions</code>. Le versioni precedenti chiedevano un permesso a runtime che
       interrompeva l’accesso al primo tentativo. L’estensione è sul{' '}
       <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">Chrome Web Store</a>{' '}
       e si aggiorna da sola; per forzare l’aggiornamento vai su <code>chrome://extensions</code>, attiva la
       modalità sviluppatore e premi <b>Aggiorna</b>.</>,
  },
  {
    q: 'Non arriva il codice di accesso via email',
    a: <>Controlla la posta indesiderata. Puoi richiederne uno nuovo dopo circa 30 secondi e ogni codice
       resta valido 10 minuti. Se copi il codice dall’email, incolla pure: gli spazi vengono ignorati.</>,
  },
  {
    q: 'L’analisi dà errore su una pagina molto lunga',
    a: <>Aggiorna l’estensione all’ultima versione. Dalla 1.2.0 l’immagine inviata al modello viene
       ridimensionata entro i limiti supportati, quindi l’errore non si presenta più. Resta un limite di
       sicurezza sulla cattura oltre i 20.000 pixel di altezza.</>,
  },
  {
    q: 'Il pulsante Analizza dà errore 401',
    a: <>La sessione dell’estensione è scaduta. Apri le impostazioni dell’estensione (icona ingranaggio) e
       rifai l’accesso con il codice via email.</>,
  },
  {
    q: '“Apri una pagina web” quando premo Analizza',
    a: <>Sei su una pagina che Chrome non permette di catturare: <code>chrome://…</code>, un PDF o il Web
       Store. Apri una normale pagina http/https.</>,
  },
  {
    q: 'Come disdico l’abbonamento',
    a: <>Dalla sezione <b>Piano</b> del tuo account: l’abbonamento resta attivo fino alla scadenza del
       periodo già pagato e poi non viene rinnovato. Le fatture si scaricano dalla stessa pagina.</>,
  },
  {
    q: 'Che dati raccoglie l’estensione',
    a: <>Cattura lo screenshot solo della scheda attiva e solo quando premi Analizza. Il dettaglio completo
       è nella <Link href="/privacy" className="font-semibold text-brand">privacy policy</Link>.</>,
  },
]

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-semibold text-muted transition hover:text-ink">← Foevo</Link>

      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">Assistenza</h1>
      <p className="mt-2 text-muted">
        Prima le domande che riceviamo più spesso: quasi sempre la risposta è qui. Se non trovi quello che
        ti serve, scrivici col modulo in fondo.
      </p>

      <h2 className="mt-10 font-display text-xl font-extrabold">Domande frequenti</h2>
      <div className="mt-4 space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className="card p-4">
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <div className="mt-2 text-sm leading-relaxed text-muted">{f.a}</div>
          </details>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-extrabold">Scrivici</h2>
      <p className="mt-2 text-sm text-muted">
        Rispondiamo di norma entro un giorno lavorativo. Più dettagli ci dai — pagina, browser, messaggio
        d’errore — più veloce è la risposta.
      </p>
      <SupportForm token={issueFormToken(Date.now())} />

      <p className="mt-10 text-xs text-muted">
        Foevo · <Link href="/privacy" className="font-semibold text-brand">Privacy</Link>
      </p>
    </main>
  )
}
