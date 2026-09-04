-- Hardening: handle_new_user() è una funzione SECURITY DEFINER usata SOLO come
-- trigger AFTER INSERT su auth.users. Non deve essere invocabile direttamente
-- via l'API (schema public è esposto). Revochiamo EXECUTE da public/anon/authenticated.
-- Il trigger continua a funzionare: gira col privilegio dell'owner, non del chiamante.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
