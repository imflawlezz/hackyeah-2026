-- HubMI.pl initial schema: profiles, innovations, problems, ideas, feedback.
-- Column names are the snake_case form of the contracts in src/types.

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('resident', 'jst', 'admin', 'expert');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'resident',
  display_name text not null,
  municipality text,
  created_at timestamptz not null default now()
);

create table public.innovations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  description text not null,
  category text not null,
  target_group text not null,
  region text,
  video_url text,
  image_url text,
  tags text[] not null default '{}',
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  description text not null,
  category text,
  embedding extensions.vector(1536),
  status text not null default 'new' check (status in ('new', 'matched', 'closed')),
  created_at timestamptz not null default now()
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  title text not null,
  essence text not null,
  target_group text not null,
  stage text not null default 'idea' check (stage in ('idea', 'prototype', 'pilot')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations (id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index innovations_embedding_idx
  on public.innovations using hnsw (embedding extensions.vector_cosine_ops);
create index innovations_category_idx on public.innovations (category);
create index problems_author_id_idx on public.problems (author_id);
create index ideas_author_id_idx on public.ideas (author_id);
create index feedback_innovation_id_idx on public.feedback (innovation_id);
create index feedback_author_id_idx on public.feedback (author_id);

-- ---------------------------------------------------------------------------
-- Helper functions and triggers
-- ---------------------------------------------------------------------------

-- Security definer so policies can check the caller's role without recursing
-- into the RLS policies on profiles.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- Every new auth user gets a profile. The role always starts as 'resident';
-- it is never read from user-supplied sign-up metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Użytkownik')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own profile but not promote themselves. Calls without a
-- JWT (SQL editor, service role) have no auth.uid() and are allowed through.
create function public.prevent_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and (select auth.uid()) is not null
    and not public.is_admin()
  then
    raise exception 'Only an admin can change a profile role.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.innovations enable row level security;
alter table public.problems enable row level security;
alter table public.ideas enable row level security;
alter table public.feedback enable row level security;

-- Table privileges. RLS below narrows these down to rows.
revoke all on public.profiles, public.innovations, public.problems, public.ideas, public.feedback
  from anon, authenticated;

grant select on public.innovations to anon;
grant select, insert, update, delete
  on public.profiles, public.innovations, public.problems, public.ideas, public.feedback
  to authenticated;
grant all
  on public.profiles, public.innovations, public.problems, public.ideas, public.feedback
  to service_role;

-- profiles: own row, admin everything
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin full access"
  on public.profiles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- innovations: public read, admin write
create policy "innovations: public read"
  on public.innovations for select to anon, authenticated
  using (true);

create policy "innovations: admin full access"
  on public.innovations for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- problems: authors insert and read their own rows
create policy "problems: insert own"
  on public.problems for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "problems: read own"
  on public.problems for select to authenticated
  using (author_id = (select auth.uid()));

create policy "problems: admin full access"
  on public.problems for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ideas: authors insert and read their own rows
create policy "ideas: insert own"
  on public.ideas for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "ideas: read own"
  on public.ideas for select to authenticated
  using (author_id = (select auth.uid()));

create policy "ideas: admin full access"
  on public.ideas for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- feedback: authors insert and read their own rows
create policy "feedback: insert own"
  on public.feedback for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "feedback: read own"
  on public.feedback for select to authenticated
  using (author_id = (select auth.uid()));

create policy "feedback: admin full access"
  on public.feedback for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Matchmaking
-- ---------------------------------------------------------------------------

-- Returns the innovations closest to query_embedding by cosine similarity
-- (1 = identical direction). Rows without an embedding are skipped. Runs with
-- the caller's rights, so RLS on innovations applies.
create function public.match_innovations(
  query_embedding extensions.vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  summary text,
  description text,
  category text,
  target_group text,
  region text,
  video_url text,
  image_url text,
  tags text[],
  created_at timestamptz,
  similarity double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    i.id,
    i.title,
    i.summary,
    i.description,
    i.category,
    i.target_group,
    i.region,
    i.video_url,
    i.image_url,
    i.tags,
    i.created_at,
    1 - (i.embedding <=> query_embedding) as similarity
  from public.innovations as i
  where i.embedding is not null
  order by i.embedding <=> query_embedding
  limit greatest(match_count, 0);
$$;

grant execute on function public.match_innovations(extensions.vector, int)
  to anon, authenticated, service_role;
