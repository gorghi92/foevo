-- Storico pagamenti (popolato dai webhook Whop) per: pagina ricavi superadmin,
-- storico utente e generazione fatture PDF.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  amount_cents int not null default 0,      -- importo lordo pagato (incl. tasse) come riportato da Whop
  currency text not null default 'EUR',
  status text not null default 'paid',       -- paid | refunded | failed
  whop_payment_id text unique,
  whop_membership_id text,
  plan text,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_user on public.payments(user_id, created_at desc);
alter table public.payments enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='payments' and policyname='payments_self') then
    create policy payments_self on public.payments for select using (user_id = auth.uid());
  end if;
end $$;
