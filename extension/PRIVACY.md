# Privacy Policy — Foveo (Chrome extension)

_Last updated: 2026-08-26_

Foveo captures a screenshot of a web page **you explicitly choose to
analyze** and sends it to the Foveo platform to generate an attention heatmap
and a conversion-oriented analysis. This policy explains exactly what is handled.

## What the extension accesses

- **A screenshot of the active tab** — only when you click **"Analizza questa
  pagina"**. The extension never captures pages in the background and never
  captures a tab you did not act on. It uses the `activeTab` permission, granted
  per-click.
- **The active page's URL and title** — sent with the screenshot so the analysis
  and your history are labelled.
- **The optional "goal" and "note"** you type in the popup.

## What is stored on your device

- Your **platform endpoint** and **API key** are stored in `chrome.storage`
  (your browser profile). They never leave your browser except as the
  `Authorization` header of requests to the endpoint you configured.

## Where data is sent

- The screenshot and page metadata are sent over HTTPS to the **endpoint you
  configure** (default `https://foveo.app`) using your API key.
- On that platform, to produce the analysis, the screenshot is processed by an
  **AI provider** (Anthropic Claude for the premium tier, or Alibaba Qwen for the
  base tier). The screenshot and the resulting analysis are stored in **your own
  account** on the platform so you can revisit them.

## What is NOT done

- No analytics, tracking, or advertising SDKs.
- No selling or sharing of your data with third parties beyond the AI provider
  strictly needed to generate the analysis you requested.
- No capture without an explicit click.

## Data retention & deletion

- Screenshots and analyses live in your platform account; delete them from the
  dashboard (`/attention`) at any time.
- Remove the stored API key by clearing the extension's settings or uninstalling
  the extension.

## Contact

Questions or deletion requests: **info@akmehub.com**.
