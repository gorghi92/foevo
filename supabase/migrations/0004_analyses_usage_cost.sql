-- Tracciamento consumo/costo per analisi (per la dashboard superadmin).
-- Token del provider AI + costo stimato in USD calcolato server-side.

alter table public.analyses
  add column if not exists input_tokens int,
  add column if not exists output_tokens int,
  add column if not exists cost_usd numeric(12,6);
