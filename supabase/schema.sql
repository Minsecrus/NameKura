create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle)
  values (
    new.id,
    concat('nk_', substring(new.id::text from 1 for 8))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle citext unique not null,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

create table if not exists public.names (
  id uuid primary key default gen_random_uuid(),
  surname text not null check (char_length(surname) between 1 and 2),
  given_name text not null check (char_length(given_name) between 1 and 3),
  full_name text generated always as (surname || given_name) stored,
  source text not null default 'user' check (source in ('seed', 'user')),
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_session_id text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  description text,
  tags text[] not null default '{}',
  copy_count integer not null default 0 check (copy_count >= 0),
  score integer not null default 0,
  upvotes_count integer not null default 0 check (upvotes_count >= 0),
  downvotes_count integer not null default 0 check (downvotes_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (full_name)
);

create index if not exists names_status_created_at_idx
on public.names (status, created_at desc);

create index if not exists names_score_created_at_idx
on public.names (score desc, created_at desc);

create index if not exists names_tags_gin_idx
on public.names using gin (tags);

create trigger names_set_updated_at
before update on public.names
for each row
execute function public.set_updated_at();

create table if not exists public.name_votes (
  name_id uuid not null references public.names(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (user_id is not null or session_id is not null)
);

create index if not exists name_votes_user_id_idx
on public.name_votes (user_id, updated_at desc);

create index if not exists name_votes_session_id_idx
on public.name_votes (session_id, updated_at desc);

create unique index if not exists name_votes_name_user_unique_idx
on public.name_votes (name_id, user_id)
where user_id is not null;

create unique index if not exists name_votes_name_session_unique_idx
on public.name_votes (name_id, session_id)
where session_id is not null;

create trigger name_votes_set_updated_at
before update on public.name_votes
for each row
execute function public.set_updated_at();

create table if not exists public.name_bookmarks (
  name_id uuid not null references public.names(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (name_id, user_id)
);

create index if not exists name_bookmarks_user_id_idx
on public.name_bookmarks (user_id, created_at desc);

create table if not exists public.copy_events (
  id bigint generated always as identity primary key,
  name_id uuid not null references public.names(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  created_at timestamptz not null default timezone('utc', now()),
  check (user_id is not null or session_id is not null)
);

create index if not exists copy_events_name_id_created_at_idx
on public.copy_events (name_id, created_at desc);

create or replace function public.refresh_name_stats(target_name_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  up_count integer;
  down_count integer;
  copies integer;
begin
  select
    count(*) filter (where value = 1),
    count(*) filter (where value = -1)
  into up_count, down_count
  from public.name_votes
  where name_id = target_name_id;

  select count(*)
  into copies
  from public.copy_events
  where name_id = target_name_id;

  update public.names
  set
    upvotes_count = coalesce(up_count, 0),
    downvotes_count = coalesce(down_count, 0),
    copy_count = coalesce(copies, 0),
    score = coalesce(up_count, 0) - coalesce(down_count, 0),
    updated_at = timezone('utc', now())
  where id = target_name_id;
end;
$$;

create or replace function public.handle_vote_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_name_stats(coalesce(new.name_id, old.name_id));
  return coalesce(new, old);
end;
$$;

create trigger name_votes_refresh_stats_after_insert
after insert on public.name_votes
for each row
execute function public.handle_vote_stats();

create trigger name_votes_refresh_stats_after_update
after update on public.name_votes
for each row
execute function public.handle_vote_stats();

create trigger name_votes_refresh_stats_after_delete
after delete on public.name_votes
for each row
execute function public.handle_vote_stats();

create or replace function public.handle_copy_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_name_stats(coalesce(new.name_id, old.name_id));
  return coalesce(new, old);
end;
$$;

create trigger copy_events_refresh_stats_after_insert
after insert on public.copy_events
for each row
execute function public.handle_copy_stats();

create trigger copy_events_refresh_stats_after_delete
after delete on public.copy_events
for each row
execute function public.handle_copy_stats();

create or replace function public.vote_name(
  target_name_id uuid,
  target_value smallint,
  target_session_id text default null
)
returns public.names
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  result_row public.names;
begin
  current_user_id := auth.uid();

  if target_value not in (-1, 1) then
    raise exception 'invalid_vote';
  end if;

  if current_user_id is null and target_session_id is null then
    raise exception 'session_required';
  end if;

  if current_user_id is not null then
    insert into public.name_votes (name_id, user_id, session_id, value)
    values (target_name_id, current_user_id, null, target_value)
    on conflict (name_id, user_id)
    do update set
      value = excluded.value,
      updated_at = timezone('utc', now());
  else
    insert into public.name_votes (name_id, user_id, session_id, value)
    values (target_name_id, null, target_session_id, target_value)
    on conflict (name_id, session_id)
    do update set
      value = excluded.value,
      updated_at = timezone('utc', now());
  end if;

  perform public.refresh_name_stats(target_name_id);

  select *
  into result_row
  from public.names
  where id = target_name_id;

  return result_row;
end;
$$;

create or replace function public.record_copy(target_name_id uuid, target_session_id text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  insert into public.copy_events (name_id, user_id, session_id)
  values (target_name_id, current_user_id, target_session_id);

  perform public.refresh_name_stats(target_name_id);
end;
$$;

create or replace view public.name_feed as
select
  n.id,
  n.surname,
  n.given_name,
  n.full_name,
  n.tags,
  n.source,
  n.score,
  n.copy_count,
  n.upvotes_count,
  n.downvotes_count,
  n.created_at,
  p.handle as submitted_by_handle
from public.names n
left join public.profiles p on p.id = n.submitted_by
where n.status = 'published';

alter table public.profiles enable row level security;
alter table public.names enable row level security;
alter table public.name_votes enable row level security;
alter table public.name_bookmarks enable row level security;
alter table public.copy_events enable row level security;

create policy "profiles_select_public"
on public.profiles
for select
to authenticated, anon
using (true);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "names_select_published"
on public.names
for select
to authenticated, anon
using (status = 'published');

create policy "names_insert_authenticated"
on public.names
for insert
to authenticated, anon
with check (
  (
    auth.uid() is not null
    and auth.uid() = submitted_by
    and submitted_session_id is null
  )
  or (
    auth.uid() is null
    and submitted_by is null
    and submitted_session_id is not null
  )
  and source = 'user'
  and status = 'published'
);

create policy "names_update_own"
on public.names
for update
to authenticated, anon
using (
  (submitted_by is not null and submitted_by = auth.uid())
)
with check (
  (submitted_by is not null and submitted_by = auth.uid())
);

create policy "name_votes_select_own"
on public.name_votes
for select
to authenticated, anon
using (
  user_id = auth.uid()
);

create policy "name_votes_insert_own"
on public.name_votes
for insert
to authenticated, anon
with check (
  (auth.uid() is not null and user_id = auth.uid() and session_id is null)
  or (auth.uid() is null and user_id is null and session_id is not null)
);

create policy "name_votes_update_own"
on public.name_votes
for update
to authenticated, anon
using (
  (auth.uid() is not null and user_id = auth.uid())
  or (auth.uid() is null and user_id is null and session_id is not null)
)
with check (
  (auth.uid() is not null and user_id = auth.uid())
  or (auth.uid() is null and user_id is null and session_id is not null)
);

create policy "name_bookmarks_select_own"
on public.name_bookmarks
for select
to authenticated
using (user_id = auth.uid());

create policy "name_bookmarks_insert_own"
on public.name_bookmarks
for insert
to authenticated
with check (user_id = auth.uid());

create policy "name_bookmarks_delete_own"
on public.name_bookmarks
for delete
to authenticated
using (user_id = auth.uid());

create policy "copy_events_insert_any_session_or_user"
on public.copy_events
for insert
to authenticated, anon
with check (
  user_id = auth.uid()
  or (auth.uid() is null and user_id is null and session_id is not null)
);

create policy "copy_events_select_own"
on public.copy_events
for select
to authenticated
using (user_id = auth.uid());
