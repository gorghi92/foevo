-- Pacchetto Starter: la porta d'ingresso da 5 € al mese.
--
-- Il `tier` resta binario perché non è il prezzo: dice quale motore AI gira
-- (base = motore standard, premium = analisi più profonda). Starter è quindi
-- tier `base` con una quota piccola — il prezzo e il nome li porta il pacchetto.
--
-- Il piano Whop collegato è plan_gSh84kM8wX5WX (5 €/mese ricorrente, stesso
-- prodotto di Base e Premium).

insert into public.packages (name, slug, tier, monthly_quota, unlimited, whop_plan_id, price_monthly, features, active, order_index)
values (
  'Starter', 'starter', 'base', 5, false, 'plan_gSh84kM8wX5WX', 500,
  '["Heatmap ibrida", "Analisi AI", "5 analisi/mese"]'::jsonb,
  true, 0
)
on conflict (slug) do update set
  name = excluded.name,
  tier = excluded.tier,
  monthly_quota = excluded.monthly_quota,
  whop_plan_id = excluded.whop_plan_id,
  price_monthly = excluded.price_monthly,
  features = excluded.features,
  active = excluded.active,
  order_index = excluded.order_index,
  updated_at = now();
