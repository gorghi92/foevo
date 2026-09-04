-- Avvisi per il superadmin: eventi che meritano attenzione manuale, in primis i
-- rimborsi/dispute Whop su pagamenti che hanno già generato una commissione.
-- RLS abilitata senza policy: accesso solo dal server con la service key.
create table if not exists public.admin_alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                     -- es. 'refund'
  severity text not null default 'warning', -- 'info' | 'warning' | 'critical'
  title text not null,
  body text,
  affiliate_id uuid references public.affiliates(id) on delete set null,
  commission_id uuid references public.commissions(id) on delete set null,
  whop_payment_id text,
  amount_cents int,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_alerts_unread on public.admin_alerts(read, created_at desc);
-- Idempotenza: un rimborso ripetuto (retry webhook) non crea due avvisi.
create unique index if not exists idx_admin_alerts_dedup on public.admin_alerts(kind, whop_payment_id) where whop_payment_id is not null;
alter table public.admin_alerts enable row level security;
