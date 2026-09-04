-- Messaggi inviati dalla pagina /supporto.
-- Serve a due cose: conservare il messaggio anche se l'invio email fallisce, e
-- applicare un limite di frequenza che regga su serverless (il contatore in
-- memoria si azzera a ogni istanza fredda, quindi da solo non protegge).
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ip_hash text,            -- sha256 dell'IP: basta a limitare, non identifica
  email text not null,
  name text,
  topic text,
  message text not null,
  delivered boolean not null default false
);

create index if not exists idx_support_requests_ip_time
  on public.support_requests (ip_hash, created_at desc);
create index if not exists idx_support_requests_time
  on public.support_requests (created_at desc);

-- Nessuna policy: si accede solo dal server con la service key.
alter table public.support_requests enable row level security;
