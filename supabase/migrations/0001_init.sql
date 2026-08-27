-- Foveo initial schema. Apply via Supabase SQL editor or `supabase db push`.
-- Per-user model (no organizations): everything keyed by auth.users.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_self') then
    create policy profiles_self on public.profiles for select using (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_upd') then
    create policy profiles_upd on public.profiles for update using (id = auth.uid());
  end if;
end $$;

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- api_keys ----------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  key_hash text not null unique,
  prefix text not null,
  scopes text[] not null default '{analyze:write}',
  revoked_at timestamptz,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_api_keys_user on public.api_keys(user_id);
alter table public.api_keys enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='api_keys' and policyname='api_keys_self') then
    create policy api_keys_self on public.api_keys for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- ---------- packages (catalog, superadmin-managed) ----------
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tier text not null default 'base',           -- base | premium
  monthly_quota int not null default 0,
  unlimited boolean not null default false,
  whop_plan_id text,
  price_monthly int not null default 0,          -- cents
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.packages enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='packages' and policyname='packages_read') then
    create policy packages_read on public.packages for select using (true);
  end if;
end $$;
insert into public.packages (name, slug, tier, monthly_quota, price_monthly, features, order_index) values
  ('Base', 'base', 'base', 30, 1900, '["Heatmap ibrida","Analisi AI","30 analisi/mese"]'::jsonb, 1),
  ('Premium', 'premium', 'premium', 150, 4900, '["Heatmap ibrida","Analisi AI premium","Brand, CTA, copy e frizioni","150 analisi/mese"]'::jsonb, 2)
on conflict (slug) do nothing;

-- ---------- entitlements (per user) ----------
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  tier text not null default 'base',
  monthly_quota int not null default 0,
  unlimited boolean not null default false,
  status text not null default 'active',         -- active | past_due | canceled
  source text not null default 'manual',         -- whop | manual | trial
  whop_membership_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_entitlements_whop on public.entitlements(whop_membership_id);
alter table public.entitlements enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='entitlements' and policyname='entitlements_self') then
    create policy entitlements_self on public.entitlements for select using (user_id = auth.uid());
  end if;
end $$;

-- ---------- analyses ----------
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text,
  title text,
  goal text,
  note text,
  page_type text,
  status text not null default 'processing',      -- processing | done | error
  tier text,
  provider text,
  model text,
  screenshot_url text,
  width int, height int, full_width int, full_height int,
  heatmap jsonb,
  result jsonb,
  score_conversion int, score_attention int, score_clarity int, score_cta int,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_analyses_user_created on public.analyses(user_id, created_at desc);
alter table public.analyses enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='analyses' and policyname='analyses_self') then
    create policy analyses_self on public.analyses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
