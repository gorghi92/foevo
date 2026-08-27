# Installare l'estensione Foveo su Chrome (non ufficiale)

L'estensione **non è ancora sul Chrome Web Store**, quindi si installa in
"modalità sviluppatore" caricando la cartella. Bastano 5 minuti, una volta sola.
Funziona su Chrome, Edge, Brave e altri browser basati su Chromium.

---

## 1. Scarica l'estensione

Hai due modi:

- **A) Dallo zip:** scarica `https://foevo.app/extension/foveo-attention.zip`
  e **estrailo** (tasto destro → *Estrai tutto*). Ottieni una cartella con dentro
  `manifest.json`, `src/`, `icons/`.
- **B) Dal repo:** usa la cartella `extension/` del progetto.

> ⚠️ Chrome **non** installa lo `.zip` direttamente né con un doppio clic: va
> prima **estratto**. Devi selezionare la cartella, non il file zip.

## 2. Apri la pagina estensioni

Nella barra indirizzi vai su:

```
chrome://extensions
```

## 3. Attiva la Modalità sviluppatore

In alto a destra, attiva l'interruttore **"Modalità sviluppatore"**.

## 4. Carica l'estensione

Clicca **"Carica estensione non pacchettizzata"** (*Load unpacked*) e seleziona
la **cartella** estratta al punto 1 (quella che contiene `manifest.json`).

Comparirà la scheda "Foveo" con la sua icona. Fissala alla barra col simbolo del
puzzle 🧩 → pin.

## 5. Collega il tuo account (API key)

1. Accedi a **https://foevo.app** con il tuo account.
2. Vai su **Impostazioni → API keys** (`/settings/api-keys`) e crea una chiave:
   copiala subito (viene mostrata **una sola volta**). Inizia con `fv_`.
3. Apri il popup dell'estensione → icona **⚙ (Impostazioni)** e imposta:
   - **Endpoint piattaforma**: `https://foevo.app`
   - **API key**: incolla la chiave `fv_…`
4. Premi **Salva**. Chrome chiederà **una volta** il permesso per il sito
   `foevo.app`: accetta (serve a inviare lo screenshot al motore di analisi).

## 6. Analizza una pagina

1. Apri una qualsiasi landing / scheda prodotto (una pagina `http`/`https`
   normale — non funziona su `chrome://` o sullo store).
2. Clicca l'icona Foveo → (opzionale) scegli obiettivo e contesto →
   **"Analizza questa pagina"**.
3. L'estensione cattura lo screenshot full-page e apre il **report** con heatmap
   e analisi AI sulla piattaforma.

---

## Perché serve sia l'estensione sia una API key?

- L'**estensione** vive nel browser perché è l'unico posto da cui si può
  catturare davvero lo screenshot dell'intera pagina (scroll + ricomposizione).
- Il **cervello** (heatmap CV + analisi AI) gira sul **server** di Foveo, non nel
  browser: lì stanno le chiavi dei modelli, il tuo piano e lo storico analisi.
- La **API key** è il ponte tra i due: dice al server "questa cattura è del tuo
  account", senza doverti far rifare il login dentro l'estensione. Così il report
  finisce nella tua dashboard e rispetta quota e tier del tuo piano.

È una configurazione **una tantum**: creata la chiave e salvata nell'estensione,
non ci pensi più.

---

## Problemi comuni

| Sintomo | Causa / Soluzione |
|---|---|
| *"Il manifest non è leggibile"* o non carica | Hai selezionato lo **zip** o la cartella sbagliata. Estrai lo zip e seleziona la cartella che contiene `manifest.json`. |
| Il pulsante Analizza dà errore 401 | API key mancante/errata: dev'essere quella `fv_…` creata in `/settings/api-keys`. |
| Errore di rete / host | Riapri ⚙ Impostazioni e premi di nuovo **Salva** per riconcedere il permesso al sito. |
| "Apri una pagina web" | Sei su `chrome://…`, PDF o Web Store: apri una normale pagina http/https. |
| Pagina molto lunga tagliata | Limite di sicurezza: oltre ~20.000px la cattura viene troncata. |

## Aggiornare l'estensione

Sostituisci la cartella con la versione nuova e, in `chrome://extensions`, premi
l'icona **↻ (ricarica)** sulla scheda Foveo.
