# Foevo — memoria di progetto

Attention heatmap + analisi AI di conversione. Next.js 14 (App Router) · Supabase ·
Tailwind · estensione Chrome MV3 · pagamenti Whop · deploy su Vercel.

---

## ⚠️ REGOLA FISSA: tutto bilingue (italiano + inglese)

**Ogni aggiunta o modifica — frontend e backend — deve essere disponibile anche in
lingua inglese.** Non si considera completa una feature che esiste solo in italiano.

Vale per:
- **Frontend pubblico**: landing, `/affiliati`, `/privacy`, `/supporto`, `/review`,
  checkout, pagine di condivisione.
- **App autenticata**: dashboard, `/admin`, `/analytics`, `/affiliazione`, `/billing`,
  `/profile`, `/invita`, report delle analisi.
- **Backend**: messaggi delle API, errori restituiti al client, email transazionali,
  testi generati dall'AI (prompt e output devono seguire la lingua dell'utente),
  contenuti dell'estensione Chrome.

Regole pratiche:
- Nessuna stringa hard-coded nei componenti: passa dai dizionari i18n.
- Quando aggiungi una chiave, aggiungila **in entrambe** le lingue nello stesso commit.
- L'italiano resta la lingua di default; l'inglese è la seconda lingua di prima classe.
- Anche i nuovi errori/validazioni lato server vanno tradotti.

---

## Convenzioni

- **Lingua del codice**: commenti e messaggi di commit in italiano; nomi di variabili,
  funzioni e file in inglese.
- **Commit**: descrittivi, corpo che spiega il *perché*. Sempre `typecheck` + `build`
  puliti prima di pushare.
- **Branch di lavoro**: `claude/supabase-setup-czxb0a` (PR #1). Sviluppa e pusha lì.
- **Segreti**: mai nel repo. Stanno nelle env di Vercel e in `app_settings` su Supabase.
- **UI**: riusa i pattern esistenti (`card`, KPI, barre SVG inline) e i token di tema
  (`brand`, `bg`, `panel`, `line`, `muted`, `ink`) — niente librerie di grafici nuove.

## Infrastruttura

- **Supabase** (progetto Foevo, ref `dhgrxekzqpznovbrtmdx`, us-east-2): migrazioni in
  `supabase/migrations/`, applicabili via Management API con un PAT.
- **Vercel** (progetto `foevo`): i push sul branch creano *preview*; la produzione
  (`foevo.app`) va promossa con un redeploy `target: production`.
- **Analytics first-party**: tracker in `src/components/analytics/tracker.tsx`, tabella
  `analytics_events`. Traccia **solo il frontend pubblico** — il gruppo `(app)` è escluso
  (vedi `APP_PREFIXES`).
- **Conteggi paganti**: gli account interni/test/review sono esclusi via
  `src/lib/billing.ts` (`isBillable`), ma restano nelle statistiche di consumo.
