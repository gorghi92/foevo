-- Analytics first-party del sito (pageview, sorgenti, device, click per heatmap,
-- profondità di scroll). Tutto raccolto lato nostro, senza servizi terzi.
-- Una sola tabella "wide": una riga per evento. Nessun dato personale:
-- visitor_id/session_id sono id casuali generati dal browser, l'IP non è salvato.

create table if not exists public.analytics_events (
  id           bigint generated always as identity primary key,
  visitor_id   text not null,             -- id persistente casuale (localStorage)
  session_id   text not null,             -- id di sessione casuale (sessionStorage, ~30 min)
  kind         text not null,             -- pageview | click | scroll | ping
  path         text not null default '/',
  referrer     text,                      -- referrer completo (solo primo pageview di sessione)
  referrer_host text,                     -- host del referrer, per raggruppare le sorgenti
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  device       text,                      -- mobile | tablet | desktop
  browser      text,
  os           text,
  country      text,                      -- da header CDN (x-vercel-ip-country)
  screen_w     int,
  viewport_w   int,
  viewport_h   int,
  x_pct        real,                      -- click: X come frazione della larghezza pagina (0..1)
  y_px         int,                       -- click: Y assoluto nel documento
  doc_h        int,                       -- altezza documento al momento del click / scroll
  scroll_pct   int,                       -- scroll: profondità massima raggiunta (0..100)
  dur_ms       int,                       -- durata sulla pagina (ping/scroll)
  created_at   timestamptz not null default now()
);

create index if not exists idx_analytics_time     on public.analytics_events (created_at desc);
create index if not exists idx_analytics_kind_time on public.analytics_events (kind, created_at desc);
create index if not exists idx_analytics_path_time on public.analytics_events (path, created_at desc);
create index if not exists idx_analytics_session   on public.analytics_events (session_id);
create index if not exists idx_analytics_click     on public.analytics_events (path, created_at desc) where kind = 'click';

-- Nessuna policy: scrittura e lettura avvengono solo dal server con la service key.
alter table public.analytics_events enable row level security;
