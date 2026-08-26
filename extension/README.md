# Foveo — Chrome Extension

MV3 extension that captures a full-page screenshot of the active tab and sends it
to the Foveo platform, which returns an **attention heatmap** + an **AI
conversion analysis** (brand, colors, CTAs, copy, frictions, recommendations).

## Install (dev / unpacked)

> End-user, non-technical guide in Italian: see **`INSTALLAZIONE.md`**.

1. Open `chrome://extensions`, enable **Developer mode** (top-right toggle).
2. **Load unpacked** → select this `extension/` folder (the one containing
   `manifest.json`). A `.zip` cannot be loaded directly — extract it first.
3. Open the popup → ⚙ Settings → set:
   - **Endpoint**: your platform origin (default `https://foevo.vercel.app`)
   - **API key**: create one in the dashboard at `/settings/api-keys` (starts with `fv_`,
     scope `analyze:write`).
4. Open any landing/product page → click **Analizza questa pagina**.

## How it works

- The background worker scrolls the page and stitches `captureVisibleTab` slices
  into one tall image (sticky/fixed elements are hidden after the first slice to
  avoid repeats).
- It produces two things: a downscaled JPEG for display, and a tiny raw-RGB
  sample (192px wide) used server-side to compute a computer-vision saliency map.
- `POST /api/v1/analyze` (Bearer API key) runs the hybrid engine
  (CV saliency + LLM semantic zones) and returns `{ id, resultPath }`.
- The extension opens the result page on the platform.

## Limits / notes

- Pages taller than 20000px are capped; max 24 stitched slices.
- `chrome://` and other privileged pages cannot be captured.
- Tier (base = Qwen, premium = Claude) is resolved server-side from the user's
  Whop entitlement — the extension sends the same payload regardless.

## Permissions (minimized for Web Store review)

- `activeTab` + `scripting` — capture/scroll only the tab the user clicks on.
- `storage` — store endpoint + API key locally.
- No default `host_permissions`: the extension ships with none.
- `optional_host_permissions: https://*/*` — the configured https endpoint is
  granted **at runtime** when you press **Salva** in Settings (Chrome shows a
  one-time permission prompt for that origin). A local `http://` dev endpoint
  isn't requestable at runtime — use the unpacked build for that.

## Packaging / publishing to the Chrome Web Store

No build step — plain MV3 + vanilla JS. Build a clean release zip (excludes dev
files `scripts/` and `store/`):

```sh
cd apps/extension
zip -r -q foveo-attention-$(node -p "require('./manifest.json').version").zip \
  manifest.json src icons PRIVACY.md
```

Then follow `store/listing.md` for the Developer Dashboard fields, privacy URL,
permission justifications, data disclosures, and screenshot spec. Bump
`manifest.json` `version` before every upload (the store rejects duplicates).
A convenience copy is served at `/extension/foveo-attention.zip`.
