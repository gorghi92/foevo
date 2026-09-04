-- Public sharing: un'analisi può essere resa pubblica e condivisa via link
-- brandizzato con un token non indovinabile. La pagina pubblica legge via
-- service client (bypass RLS) SOLO le righe con public = true.

alter table public.analyses
  add column if not exists public boolean not null default false,
  add column if not exists share_token text unique;

create index if not exists idx_analyses_share on public.analyses(share_token);
