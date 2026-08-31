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

### Dove stanno i testi

| Ambito | File |
|---|---|
| Sito pubblico | `src/lib/i18n/dictionaries/{it,en}.ts` |
| App autenticata | `src/lib/i18n/dictionaries/app/<area>.ts` (un modulo per area, `it` + `en: typeof it`) |
| Messaggi delle API | `src/lib/i18n/api.ts` |
| Email transazionali | `src/lib/email.ts` (`COPY_IT` / `COPY_EN`) |
| Prompt AI | `src/lib/attention/types.ts` e `implementation-prompt.ts` |
| Estensione Chrome | `extension/src/i18n.js` (+ `extension/_locales/` per la scheda dello store) |

L'inglese è sempre dichiarato come `typeof it`: **una chiave mancante rompe il
typecheck**, quindi la regola bilingue è verificata dal compilatore, non a occhio.

### Come si risolve la lingua

- **Sito pubblico**: dal segmento `[locale]` dell'URL. L'italiano vive senza prefisso
  (`/supporto`), l'inglese sotto `/en` (`/en/supporto`). Nessun redirect automatico
  per lingua: l'URL è la fonte di verità.
- **App autenticata**: nessun prefisso. `getServerLocale()` legge l'header impostato
  dal middleware → cookie `foevo_locale` → `Accept-Language` → italiano.
- **API**: `requestLocale()` / `m('chiave')` da `@/lib/i18n/api`.
- **Client component**: non possono leggere la lingua da soli — ricevono i testi come
  prop dal genitore server, tipizzati con `Dictionary['app'][...]`.
- **Report AI**: seguono la lingua dell'utente. L'estensione manda `lang` nel corpo di
  `/api/v1/analyze`; i valori enum (`alta|media|bassa`) restano in italiano perché sono
  dati salvati in JSONB, non testo — l'interfaccia accetta comunque anche `high|medium|low`.

### Frasi con markup o link

Usa `<Rich text={...} />` (`@/lib/i18n/rich`): rende `**grassetto**`, `*corsivo*`,
`` `codice` ``, `[etichetta](/percorso)` e `\n`. Serve a tenere le frasi **intere** e
quindi traducibili, invece di spezzarle in frammenti di JSX attorno al markup.

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
