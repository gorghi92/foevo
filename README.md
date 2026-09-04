# Foevo

Attention heatmaps + AI conversion analysis for landing pages and product pages.
A **standalone platform** (its own auth, database, billing) plus a **Chrome extension**.

- **Extension** captures a full-page screenshot of the page you choose.
- **Engine** (zero native image deps): computer-vision saliency + an LLM
  (Claude premium / Qwen base) produce a heatmap grid and a structured CRO report.
- **App** stores analyses per user and renders the interactive report.

## Stack

Next.js 14 (App Router) · Supabase (Auth + Postgres) · Tailwind CSS ·
Cloudflare R2 (screenshot storage, optional) · Whop (billing) · Anthropic + Qwen (AI).

## Structure

```
src/
  app/
    page.tsx                    landing
    (auth)/login|signup         email + Google auth
    auth/callback|signout       OAuth / session
    (app)/                      authenticated area (sidebar layout)
      dashboard/                analyses grid
      analyses/[id]/            report (heatmap + scores + brand/CTA/copy/reco)
      settings/api-keys/        create/revoke extension keys
      billing/                  plan + Whop checkout
      admin/                    superadmin (packages, entitlements, stats)
    api/
      v1/analyze                extension endpoint (Bearer fv_… key)
      v1/analyses/[id]          status
      keys                      create key
      admin/{package,entitlement}
      webhooks/whop             membership → entitlement
    privacy/                    public privacy policy
  lib/
    supabase/{client,server,middleware}.ts
    attention/{saliency,llm,engine,types}.ts   the engine (framework-agnostic)
    r2.ts  superadmin.ts
  server/{api-key,store}.ts
  components/heatmap-canvas.tsx
supabase/migrations/0001_init.sql
extension/                      MV3 Chrome extension (Foevo-branded)
```

## Setup

1. `npm install`
2. Create a **Supabase** project. In the SQL editor run `supabase/migrations/0001_init.sql`.
   Enable **Google** provider in Auth (add the OAuth client) if you want social login,
   and set the Site URL / redirect to `${NEXT_PUBLIC_APP_URL}/auth/callback`.
3. `cp .env.example .env.local` and fill it in (Supabase keys, at least one AI key,
   optionally R2 + Whop, and `SUPERADMIN_EMAILS`).
4. `npm run dev` → http://localhost:3000

## Deploy (Vercel)

- Import the repo, set the env vars, deploy. `NEXT_PUBLIC_APP_URL` = your domain.
- Update Supabase Auth redirect URLs to the production domain.
- Point the **Whop** webhook at `https://<domain>/api/webhooks/whop`.

## Billing (Whop)

- In `/admin`, create packages and set each `whop_plan_id`; set `WHOP_CHECKOUT_BASE`.
- On `membership.went_valid/invalid/cancelled`, the webhook matches the Whop
  member by **email** to a Foevo user and updates their entitlement (tier + quota).
- Users without an active entitlement cannot analyse: there is no free trial.

## Extension

`extension/` is a Foevo-branded MV3 extension. Set its endpoint (Settings ⚙) to your
Foevo domain and paste an API key from `/settings/api-keys`. It ships with no default
host permission — the configured https endpoint is granted at runtime. Package per
`extension/store/listing.md`. A build copy is served at `/extension/foevo-attention.zip`.

## Known limitations (MVP)

- Analysis runs **synchronously** inside `/api/v1/analyze` (`maxDuration = 60`).
  For heavy premium calls, move `runEngine` to a queue/worker and mark rows `processing`.
- The heatmap's CV layer is contrast/colour saliency, not an eye-tracking-trained
  model; the semantic weight comes from the LLM zones. A trained saliency model
  (DeepGaze/TranSalNet) can replace `computeSaliency` without touching the pipeline.
- The build hasn't been run in the authoring environment (no deps installed there);
  validate with `npm run build` / `npm run typecheck` in CI on first push.
