-- Programma di affiliazione.
--
-- Gli affiliati hanno credenziali proprie (username + password) e sessioni
-- nostre, separate dall'auth Supabase del resto dell'app. Tutte le tabelle
-- hanno RLS abilitata SENZA policy: vi si accede solo dal server con la service
-- key, mai dai client (gli affiliati non hanno una sessione Supabase).

create extension if not exists pgcrypto;

-- ---------- affiliati ----------
-- user_id valorizzato solo quando l'affiliato è anche un utente Foevo
-- (percorso "Consiglia a un amico"); null per gli affiliati indipendenti.
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text not null unique,          -- già normalizzato minuscolo dal server
  email text not null,
  full_name text,
  password_hash text not null,            -- scrypt: "salt:hash" esadecimale
  code text not null unique,              -- codice del link referral, mai due uguali
  commission_override_bps int,            -- override % (basis points); null = default per piano
  status text not null default 'active',  -- 'active' | 'suspended'
  clicks int not null default 0,          -- contatore click sul link referral
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_affiliates_user on public.affiliates(user_id) where user_id is not null;
alter table public.affiliates enable row level security;

-- ---------- coordinate bancarie (sezione dedicata, dati sensibili) ----------
create table if not exists public.affiliate_bank (
  affiliate_id uuid primary key references public.affiliates(id) on delete cascade,
  holder text,
  iban text,
  bank_name text,
  country text,
  updated_at timestamptz not null default now()
);
alter table public.affiliate_bank enable row level security;

-- ---------- sessioni affiliato (token nostro, revocabile) ----------
-- Nel cookie il valore grezzo; qui solo lo sha256.
create table if not exists public.affiliate_sessions (
  token_hash text primary key,
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists idx_affiliate_sessions_aff on public.affiliate_sessions(affiliate_id);
alter table public.affiliate_sessions enable row level security;

-- ---------- attribuzione: quale affiliato ha portato quale utente ----------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  referred_email text,
  landing_at timestamptz not null default now(),
  converted_at timestamptz,
  status text not null default 'clicked',  -- 'clicked' | 'converted'
  created_at timestamptz not null default now()
);
-- Un utente è attribuito ad al massimo un affiliato.
create unique index if not exists idx_referrals_user on public.referrals(referred_user_id) where referred_user_id is not null;
create index if not exists idx_referrals_email on public.referrals(lower(referred_email));
create index if not exists idx_referrals_aff on public.referrals(affiliate_id);
alter table public.referrals enable row level security;

-- ---------- commissioni: una riga per pagamento commissionabile ----------
-- Idempotente sul whop_payment_id: lo stesso pagamento non genera due righe.
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  whop_payment_id text unique,
  base_amount_cents int not null,   -- importo del pagamento da cui è calcolata
  rate_bps int not null,            -- percentuale applicata (basis points)
  amount_cents int not null,        -- commissione
  plan_slug text,
  month_index int not null,         -- 1..12 (mese della finestra di 12)
  status text not null default 'available',  -- 'available' | 'paid' | 'reversed'
  payout_request_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_commissions_aff on public.commissions(affiliate_id, status);
create index if not exists idx_commissions_payout on public.commissions(payout_request_id);
alter table public.commissions enable row level security;

-- ---------- richieste di pagamento (bonifico) ----------
-- Le coordinate sono "congelate" al momento della richiesta.
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  amount_cents int not null,
  status text not null default 'requested',  -- 'requested' | 'paid' | 'rejected'
  holder_snapshot text,
  iban_snapshot text,
  note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists idx_payout_aff on public.payout_requests(affiliate_id, status);
alter table public.payout_requests enable row level security;
