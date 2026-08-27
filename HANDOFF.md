# Foveo — HANDOFF (continua da qui)

> Documento operativo per completare il setup di **Foveo** in una nuova sessione
> Claude Code agganciata al repo **`gorghi92/foveo`**. Contiene tutto: contesto,
> mappa del codice, passi di setup, SQL della migrazione e lista delle env.
> Scritto in italiano; il codice/commenti sono in italiano+inglese.

## 0. Prompt da incollare alla nuova sessione

> "Leggi `HANDOFF.md` nella root. Il progetto Foveo è già scritto (Next.js 14 +
> Supabase + Tailwind + estensione Chrome). Aiutami a: (1) verificare che il
> codice sia nel repo, (2) validare build/typecheck, (3) eseguire la migrazione
> Supabase, (4) preparare le env per Vercel, (5) guidarmi al deploy. Procedi
> step by step e chiedimi i valori/segreti quando servono."

---

## 1. Cos'è Foveo

Piattaforma **standalone** (auth/DB/billing propri) + **estensione Chrome** che
cattura lo screenshot full-page di una landing/scheda prodotto e genera una
**heatmap di attenzione ibrida (computer-vision + AI)** e un'**analisi orientata
alla conversione** (brand, colori, CTA, copy, frizioni, punteggi).

- **base** → Qwen-VL (DashScope). **premium** → Claude (Anthropic). Con fallback.
- Il tier dipende dall'entitlement dell'utente (piani gestiti da **Whop**).

## 2. Stack

Next.js 14 (App Router) · Supabase (Auth + Postgres) · Tailwind CSS ·
Cloudflare R2 (storage screenshot, opzionale) · Whop (billing) · Anthropic + Qwen.

## 3. Mappa del codice (già presente nel repo/zip)

```
src/
  middleware.ts                       gate auth (redirect /login)
  app/
    layout.tsx  globals.css  page.tsx (landing)
    (auth)/{login,signup}/            email + Google (Supabase SSR)
    auth/{callback,signout}/          code exchange + logout
    (app)/                            area autenticata (sidebar)
      dashboard/{page,grid}           griglia analisi
      analyses/[id]/{page,report}     report + heatmap canvas
      settings/api-keys/{page,keys}   crea/revoca chiavi estensione
      billing/page                    piano + checkout Whop
      admin/{page,panel}              superadmin (pacchetti/diritti/stat)
    api/
      v1/analyze                      endpoint estensione (Bearer fv_…)
      v1/analyses/[id]                stato analisi
      keys                            crea chiave
      admin/{package,entitlement}     azioni superadmin (guardia isSuperadmin)
      webhooks/whop                   membership → entitlement (match via email)
    privacy/                          privacy policy pubblica
  lib/
    supabase/{client,server,middleware}.ts
    attention/{saliency,llm,engine,types}.ts   il MOTORE (framework-agnostic)
    r2.ts   superadmin.ts
  server/{api-key,store}.ts
  components/heatmap-canvas.tsx
supabase/migrations/0001_init.sql     schema completo (vedi Appendice B)
extension/                            estensione MV3 Foveo (endpoint configurabile)
```

## 4. STEP 1 — Assicurati che il codice sia nel repo

Se il repo `gorghi92/foveo` è **vuoto**, porta dentro il contenuto dello zip
`foveo.zip` (fornito dall'operatore), poi:

```bash
git add -A
git commit -m "chore: import Foveo"   # se non già committato
git branch -M main
git push -u origin main
```

Se il codice c'è già, salta questo step.

## 5. STEP 2 — Supabase (schema + chiavi)

Progetto sull'account **info@bentosadv.com**. Due modi per creare lo schema:

**A) SQL editor (semplice):** apri il progetto → SQL Editor → incolla il
contenuto di `supabase/migrations/0001_init.sql` (o l'**Appendice B**) → Run.

**B) Management API (da Claude):** con un **Supabase access token** (`sbp_…`) e
il **project ref**:
```bash
curl -X POST "https://api.supabase.com/v1/projects/<REF>/database/query" \
  -H "Authorization: Bearer sbp_XXX" -H "Content-Type: application/json" \
  -d @<(jq -Rs '{query:.}' supabase/migrations/0001_init.sql)
```
Recupera poi le chiavi API:
```bash
curl -s "https://api.supabase.com/v1/projects/<REF>/api-keys" -H "Authorization: Bearer sbp_XXX"
```
→ ti servono **URL del progetto**, **anon (public)** e **service_role** key.
(In alternativa: Project Settings → API, dove trovi URL + anon + service_role.)

**Auth Google (opzionale ma consigliato):** Supabase → Authentication →
Providers → **Google** → incolla Client ID/Secret (da Google Cloud Console) →
in **URL Configuration** metti Site URL = dominio prod e Redirect =
`${APP_URL}/auth/callback`. Per il locale aggiungi anche `http://localhost:3000/auth/callback`.

## 6. STEP 3 — Variabili d'ambiente

Copia `.env.example` → `.env.local` (locale) e imposta le stesse su Vercel.
**Obbligatorie** per far girare: le 3 Supabase + almeno **una** AI key.
Elenco completo nell'**Appendice A**. Le principali:

| Variabile | Obbligatoria | Note |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | sì | dominio (locale: `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | sì | URL progetto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sì | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | sì | service_role (server-only) |
| `ANTHROPIC_API_KEY` | una delle due | tier premium (Claude) |
| `DASHSCOPE_API_KEY` | una delle due | tier base (Qwen) |
| `SUPERADMIN_EMAILS` | consigliata | email superadmin, separate da virgola |
| `R2_*` | no | storage screenshot (senza, resta inline data-URL) |
| `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`, `WHOP_CHECKOUT_BASE` | no | billing |

## 7. STEP 4 — Validazione locale

```bash
npm install
npm run typecheck   # NB: il codice non è mai stato buildato in origine — atteso qui il primo check
npm run build
npm run dev         # http://localhost:3000
```
Se `typecheck`/`build` segnala errori, correggili (sono i primi che emergono su
un progetto nuovo: import, tipi impliciti). Il codice segue i pattern standard
Next 14 + `@supabase/ssr`.

## 8. STEP 5 — Deploy su Vercel

1. Vercel → **Add New Project** → importa `gorghi92/foveo`.
2. Framework: Next.js (auto). Aggiungi tutte le env (STEP 3).
3. Deploy. Imposta `NEXT_PUBLIC_APP_URL` = dominio Vercel/custom.
4. Torna su Supabase → Auth → URL Configuration: aggiorna Site/Redirect al dominio prod.

## 9. STEP 6 — Whop (billing)

1. Crea un'app/piani su Whop; prendi i `plan_id`.
2. In **/admin** (come superadmin) crea i pacchetti e imposta `whop_plan_id`;
   imposta l'env `WHOP_CHECKOUT_BASE` (es. `https://whop.com/checkout`).
3. Configura il **webhook Whop** verso `https://<dominio>/api/webhooks/whop` e
   metti il secret in `WHOP_WEBHOOK_SECRET`.
4. Il webhook associa la membership all'utente **via email** e aggiorna
   `entitlements` su `membership.went_valid/invalid/cancelled`.

## 10. STEP 7 — Estensione Chrome

- `extension/`: MV3 già brandizzata Foveo. In **Impostazioni ⚙** imposta
  l'endpoint = dominio Foveo e incolla una **API key** da `/settings/api-keys`.
- Nessun host permission di default: l'endpoint https configurato è concesso a
  runtime. Packaging/submit: vedi `extension/store/listing.md`.
- Una copia zip è servita da `/extension/foveo-attention.zip`.

## 11. Limitazioni note (MVP) e prossimi step

- L'analisi gira **sincrona** in `/api/v1/analyze` (`maxDuration=60`). Per
  chiamate premium lente / piani serverless piccoli, spostare `runEngine` dietro
  una coda/worker e usare lo stato `processing`.
- Il layer CV è saliency contrasto/colore (non un modello eye-tracking
  addestrato); il peso semantico viene dalle zone LLM. Un modello saliency
  addestrato (DeepGaze/TranSalNet) è innestabile come drop-in di `computeSaliency`.

## 12. Sicurezza

Usa token **fine-grained** e a **scadenza breve**; **revocali** a setup finito.
Non committare mai `.env*` (già in `.gitignore`). Il `SUPABASE_SERVICE_ROLE_KEY`
è solo server-side (mai esporlo nel client).

---

## Appendice A — `.env.example` (completo)

```dotenv
# ---- Foveo environment ----
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ---- Supabase ----
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
POSTGRES_URL_NON_POOLING=

# ---- AI providers ----
ANTHROPIC_API_KEY=
ATTENTION_CLAUDE_MODEL=claude-opus-5
DASHSCOPE_API_KEY=
ATTENTION_QWEN_MODEL=qwen-vl-max
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1

# Analisi gratis/mese senza entitlement

# ---- Storage: Cloudflare R2 (opzionale) ----
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=foveo-media
R2_ENDPOINT=
R2_PUBLIC_BASE=

# ---- Billing: Whop ----
WHOP_API_KEY=
WHOP_WEBHOOK_SECRET=
WHOP_CHECKOUT_BASE=

# ---- Superadmin (email separate da virgola) ----
SUPERADMIN_EMAILS=info@akmehub.com
```

## Appendice B — Migrazione SQL (`supabase/migrations/0001_init.sql`)

> Se il file è già nel repo, usa quello. Riprodotto qui per comodità.

```sql
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text, created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_self') then
    create policy profiles_self on public.profiles for select using (id = auth.uid()); end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_upd') then
    create policy profiles_upd on public.profiles for update using (id = auth.uid()); end if;
end $$;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing; return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- api_keys
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text, key_hash text not null unique, prefix text not null,
  scopes text[] not null default '{analyze:write}',
  revoked_at timestamptz, expires_at timestamptz, last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_api_keys_user on public.api_keys(user_id);
alter table public.api_keys enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='api_keys' and policyname='api_keys_self') then
    create policy api_keys_self on public.api_keys for all using (user_id = auth.uid()) with check (user_id = auth.uid()); end if;
end $$;

-- packages
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, tier text not null default 'base',
  monthly_quota int not null default 0, unlimited boolean not null default false,
  whop_plan_id text, price_monthly int not null default 0,
  features jsonb not null default '[]'::jsonb, active boolean not null default true,
  order_index int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.packages enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='packages' and policyname='packages_read') then
    create policy packages_read on public.packages for select using (true); end if;
end $$;
insert into public.packages (name, slug, tier, monthly_quota, price_monthly, features, order_index) values
  ('Base', 'base', 'base', 30, 1900, '["Heatmap ibrida","Analisi AI (Qwen)","30 analisi/mese"]'::jsonb, 1),
  ('Premium', 'premium', 'premium', 150, 4900, '["Heatmap ibrida","Analisi AI premium (Claude)","Brand, CTA, copy e frizioni","150 analisi/mese"]'::jsonb, 2)
on conflict (slug) do nothing;

-- entitlements
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  tier text not null default 'base', monthly_quota int not null default 0,
  unlimited boolean not null default false, status text not null default 'active',
  source text not null default 'manual', whop_membership_id text, current_period_end timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_entitlements_whop on public.entitlements(whop_membership_id);
alter table public.entitlements enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='entitlements' and policyname='entitlements_self') then
    create policy entitlements_self on public.entitlements for select using (user_id = auth.uid()); end if;
end $$;

-- analyses
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text, title text, goal text, note text, page_type text,
  status text not null default 'processing', tier text, provider text, model text,
  screenshot_url text, width int, height int, full_width int, full_height int,
  heatmap jsonb, result jsonb,
  score_conversion int, score_attention int, score_clarity int, score_cta int,
  error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_analyses_user_created on public.analyses(user_id, created_at desc);
alter table public.analyses enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='analyses' and policyname='analyses_self') then
    create policy analyses_self on public.analyses for all using (user_id = auth.uid()) with check (user_id = auth.uid()); end if;
end $$;
```

---

Fine handoff. Con questo, una nuova sessione Claude su `gorghi92/foveo` ha tutto
il necessario per portare Foveo online.
