# Chrome Web Store — listing & submission kit

Everything a reviewer/submitter needs for **Foevo**. Copy the fields
into the Web Store Developer Dashboard.

## Identity

- **Name:** Foevo — Heatmap & AI Page Analysis
- **Category:** Productivity (alt: Developer Tools)
- **Default language:** Italian (add English translation optionally)
- **Homepage:** https://foevo.app
- **Privacy policy URL:** https://foevo.app/privacy  ← required, must be live
- **Support email:** info@akmehub.com

## Short description (≤132 chars)

> Heatmap di attenzione + analisi AI su qualsiasi landing o scheda prodotto, orientata alla conversione. Uno screenshot, un click.

## Detailed description

> **Scopri dove cade davvero l'attenzione sulle tue pagine — e come aumentare le conversioni.**
>
> Foevo cattura uno screenshot dell'intera pagina che stai guardando (landing, scheda prodotto, checkout) e genera in pochi secondi:
>
> • **Heatmap di attenzione** ibrida (computer vision + AI) con modalità Heatmap, Focus e Originale.
> • **Analisi orientata alla conversione**: cosa attira lo sguardo per primo, se è allineato all'obiettivo, e cosa cambiare.
> • **Brand & CTA**: palette colori, font, colore e contrasto delle call-to-action.
> • **Copy & frizioni**: chiarezza dell'headline, riscritture più persuasive, ostacoli alla conversione.
> • **Punteggi** di conversione, chiarezza, CTA e allineamento dell'attenzione.
>
> Come funziona: installa l'estensione, incolla la tua API key Foevo, apri una pagina e premi "Analizza". Il report compare nella tua dashboard Foevo.
>
> Richiede un account Foevo con un piano attivo (i piani sono gestiti su Whop). L'estensione non fa nulla senza la tua azione esplicita: cattura solo quando premi il pulsante.

## Single purpose (required statement)

> The extension's single purpose is to capture a full-page screenshot of the tab
> the user chooses and send it to the user's Foevo account to generate an
> attention heatmap and conversion analysis of that page.

## Permission justifications

| Permission | Why it's needed |
|---|---|
| `activeTab` | Capture a screenshot of, and read the URL/title of, the tab **only when the user clicks the button**. No background access. |
| `scripting` | Scroll the active tab and hide sticky/fixed elements so the full page can be stitched into one screenshot. Runs only during a user-initiated analysis. |
| `storage` | Store the user's platform endpoint and API key locally (`chrome.storage`). |
| `host_permissions: https://foevo.app/*` | Upload the screenshot to the default Foevo platform endpoint. |
| `optional_host_permissions: https://*/*` | Requested **at runtime only** if the user configures a self-hosted Foevo endpoint on another domain. Not requested on install. |

## Data-use disclosures (Privacy practices tab)

- **What user data is collected:** "Website content" (screenshots of pages the
  user explicitly analyzes; page URL/title). "Authentication information" (the
  user's API key, stored locally).
- **How it's used:** solely to provide the item's single purpose (generate the
  requested analysis). Sent to the user's configured Foevo endpoint; the
  screenshot is processed by an AI provider (Anthropic/Qwen) to produce the
  analysis.
- **Certifications (check all that apply):**
  - ☑ I do not sell or transfer user data to third parties outside the approved use cases.
  - ☑ I do not use or transfer user data for purposes unrelated to the item's single purpose.
  - ☑ I do not use or transfer user data to determine creditworthiness or for lending.

## Screenshots / assets (upload in dashboard)

Chrome requires at least 1 screenshot at **1280×800** or **640×400** (PNG/JPEG).
Suggested set (capture from a real run against a demo landing):

1. **Popup** — the "Analizza questa pagina" popup with goal selector.
2. **Heatmap result** — `/attention/[id]` in Heatmap mode with zones visible.
3. **Focus mode** — same page in Focus mode (dark mask revealing hot areas).
4. **Analysis panel** — scores + brand palette + CTA/copy recommendations.
5. *(optional)* **Dashboard list** — `/attention` grid of past analyses.

Optional store graphics: small promo tile 440×280, marquee 1400×560 — reuse the
brand violet + heatmap-dot motif from `icons/`.

## Submission checklist

1. `node scripts/gen-icons.mjs` (icons committed already).
2. Verify `manifest.json` version is bumped for each upload (store rejects
   duplicate versions).
3. Build the release zip (see extension `README.md` → Packaging).
4. Confirm **https://foevo.app/privacy** returns 200 (deploy first).
5. Create the item in the Web Store Developer Dashboard, upload the zip.
6. Fill Identity + descriptions + privacy URL + permission justifications +
   Privacy practices from this file.
7. Upload screenshots. Submit for review.
