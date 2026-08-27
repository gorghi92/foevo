import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy', description: 'Privacy policy for Foevo and the Foevo Chrome extension.' }

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted">Foevo · aggiornata 2026-08-26</p>

      <p className="mt-6">Foevo cattura uno screenshot di una pagina che <b>scegli esplicitamente di analizzare</b> e lo usa per generare una heatmap di attenzione e un’analisi orientata alla conversione.</p>

      <h2 className="mt-8 text-xl font-bold">Cosa accede l’estensione</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li><b>Screenshot della scheda attiva</b>, solo quando premi “Analizza” (permesso <code>activeTab</code>, per-click).</li>
        <li><b>URL e titolo</b> della pagina, per etichettare l’analisi.</li>
        <li>Eventuali <b>obiettivo e note</b> che digiti.</li>
      </ul>

      <h2 className="mt-8 text-xl font-bold">Dati salvati sul dispositivo</h2>
      <p className="mt-2 text-muted">Endpoint e credenziali di sessione sono salvati in <code>chrome.storage</code> e lasciano il browser solo come header <code>Authorization</code> verso l’endpoint Foevo che hai configurato.</p>

      <h2 className="mt-8 text-xl font-bold">Dove vanno i dati</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Screenshot e metadati sono inviati in HTTPS al tuo account Foevo.</li>
        <li>Per produrre l’analisi, lo screenshot è elaborato da un <b>provider AI di terze parti</b>. Screenshot e risultato restano nel tuo account.</li>
      </ul>

      <h2 className="mt-8 text-xl font-bold">Cosa NON facciamo</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Nessun tracking o SDK pubblicitari.</li>
        <li>Nessuna vendita dei dati a terzi oltre al provider AI necessario.</li>
        <li>Nessuna cattura senza un tuo click.</li>
      </ul>

      <h2 className="mt-8 text-xl font-bold">Cancellazione &amp; contatti</h2>
      <p className="mt-2 text-muted">Elimina analisi dalla dashboard in qualsiasi momento. Per richieste: <a className="text-brand" href="mailto:info@akmehub.com">info@akmehub.com</a>.</p>
    </main>
  )
}
