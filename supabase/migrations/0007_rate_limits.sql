-- Rate limiting condiviso fra le istanze serverless.
--
-- Su Vercel ogni richiesta può finire su un'istanza diversa, quindi un contatore
-- in memoria non protegge da nulla: il conteggio deve stare nel database ed
-- essere atomico. Finestra fissa: tutti gli hit dello stesso intervallo
-- condividono una riga, e l'incremento avviene dentro l'INSERT ... ON CONFLICT,
-- quindi due richieste parallele non possono leggere lo stesso valore.
--
-- La chiave non contiene mai un IP in chiaro: chi chiama passa già un hash.

create table if not exists public.rate_limits (
  bucket       text        not null,
  key          text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (bucket, key, window_start)
);

-- Nessuna policy: la tabella è raggiungibile solo dalla service key, che
-- bypassa RLS. Con RLS attiva e zero policy, anon e authenticated non vedono
-- nulla nemmeno se l'endpoint PostgREST venisse chiamato direttamente.
alter table public.rate_limits enable row level security;

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

create or replace function public.rl_hit(
  p_bucket text,
  p_key text,
  p_window_seconds integer,
  p_limit integer
) returns table (allowed boolean, used integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  v_count integer;
begin
  if p_window_seconds is null or p_window_seconds < 1 then
    p_window_seconds := 60;
  end if;

  v_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (bucket, key, window_start, count)
  values (p_bucket, p_key, v_start, 1)
  on conflict (bucket, key, window_start)
    do update set count = public.rate_limits.count + 1
  returning public.rate_limits.count into v_count;

  -- Pulizia probabilistica: tiene la tabella piccola senza dover schedulare un
  -- job, e costa quasi nulla perché scatta una volta ogni duecento chiamate.
  if random() < 0.005 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return query
    select v_count <= p_limit,
           v_count,
           v_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.rl_hit(text, text, integer, integer) from public;
revoke all on function public.rl_hit(text, text, integer, integer) from anon, authenticated;
grant execute on function public.rl_hit(text, text, integer, integer) to service_role;

-- Incremento atomico dei tentativi di un codice OTP.
--
-- Prima il conteggio si faceva leggendo `attempts` e riscrivendolo dal codice
-- applicativo: richieste parallele leggevano tutte lo stesso valore, quindi il
-- tetto di 5 tentativi si aggirava sparando N richieste insieme. Qui
-- l'incremento e la lettura avvengono in una sola istruzione.
create or replace function public.otp_attempt(p_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts integer;
begin
  update public.extension_otp
     set attempts = attempts + 1
   where id = p_id
   returning attempts into v_attempts;
  return coalesce(v_attempts, 0);
end;
$$;

revoke all on function public.otp_attempt(uuid) from public;
revoke all on function public.otp_attempt(uuid) from anon, authenticated;
grant execute on function public.otp_attempt(uuid) to service_role;
