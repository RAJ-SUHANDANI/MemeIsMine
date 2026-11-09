create table public.template_like_counts (
  template_key text primary key check (template_key ~ '^(image|video):[a-z0-9-]{1,120}$'),
  count integer not null default 0 check (count >= 0),
  revision bigint not null default 0
);

create table public.template_likes (
  template_key text not null references public.template_like_counts(template_key),
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (template_key, user_id)
);

alter table public.template_like_counts enable row level security;
alter table public.template_likes enable row level security;
revoke all on public.template_like_counts, public.template_likes from anon, authenticated;
grant select on public.template_like_counts to anon, authenticated;
create policy "Public aggregate like counts" on public.template_like_counts for select to anon, authenticated using (true);

create function public.update_template_like_count()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    update public.template_like_counts
      set count = count + 1, revision = revision + 1 where template_key = new.template_key;
  else
    update public.template_like_counts
      set count = count - 1, revision = revision + 1 where template_key = old.template_key;
  end if;
  return null;
end;
$$;
revoke all on function public.update_template_like_count() from public, anon, authenticated;

create trigger template_likes_changed after insert or delete on public.template_likes
for each row execute function public.update_template_like_count();

create function public.read_template_like(p_key text)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'count', coalesce((select count from public.template_like_counts where template_key = p_key), 0),
    'revision', coalesce((select revision from public.template_like_counts where template_key = p_key), 0),
    'liked', exists(select 1 from public.template_likes where template_key = p_key and user_id = auth.uid()),
    'signedIn', auth.uid() is not null
  );
$$;
revoke all on function public.read_template_like(text) from public;
grant execute on function public.read_template_like(text) to anon, authenticated;

create function public.set_template_like(p_key text, p_liked boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  account uuid := auth.uid();
begin
  if account is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_key is null or p_key !~ '^(image|video):[a-z0-9-]{1,120}$' or p_liked is null then
    raise exception 'Invalid reaction' using errcode = '22023';
  end if;
  -- Serialize retries and conflicting requests for the same template.
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));
  if p_liked then
    insert into public.template_like_counts(template_key) values (p_key) on conflict do nothing;
    insert into public.template_likes(template_key, user_id) values (p_key, account) on conflict do nothing;
  else
    delete from public.template_likes where template_key = p_key and user_id = account;
  end if;
  return public.read_template_like(p_key);
end;
$$;
revoke all on function public.set_template_like(text, boolean) from public, anon;
grant execute on function public.set_template_like(text, boolean) to authenticated;

do $$
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.template_like_counts;
  end if;
end;
$$;
