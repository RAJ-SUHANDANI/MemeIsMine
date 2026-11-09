-- Authenticated users can read only their own template keys.
-- Apply this migration in the existing Supabase project after 202611100002_template_likes.sql.
create or replace function public.list_my_template_likes()
returns table(template_key text)
language sql stable security definer set search_path = ''
as $$
  select likes.template_key
  from public.template_likes as likes
  where likes.user_id = auth.uid()
  order by likes.template_key
  limit 1000;
$$;
revoke all on function public.list_my_template_likes() from public, anon;
grant execute on function public.list_my_template_likes() to authenticated;
