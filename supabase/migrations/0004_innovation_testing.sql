-- Innovation tester: tests, sign-ups, richer feedback and public aggregates.
-- Idempotent: safe to run again in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.innovation_tests (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations (id) on delete cascade,
  title text not null,
  description text not null,
  municipality text not null,
  starts_at date not null,
  ends_at date not null,
  slots int not null check (slots > 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create table if not exists public.test_signups (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.innovation_tests (id) on delete cascade,
  user_id uuid default auth.uid() references public.profiles (id) on delete cascade,
  motivation text,
  availability text,
  accessibility_needs text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (test_id, user_id)
);

alter table public.feedback
  add column if not exists test_id uuid references public.innovation_tests (id) on delete set null,
  add column if not exists ease_of_use smallint check (ease_of_use between 1 and 5),
  add column if not exists would_recommend boolean,
  add column if not exists what_worked text,
  add column if not exists what_to_improve text;

create index if not exists innovation_tests_innovation_id_idx
  on public.innovation_tests (innovation_id);
create index if not exists test_signups_user_id_idx on public.test_signups (user_id);
create index if not exists feedback_test_id_idx on public.feedback (test_id);

-- ---------------------------------------------------------------------------
-- Sign-up guard
-- ---------------------------------------------------------------------------

-- Security definer because a user cannot see other people's sign-ups, and the
-- slot count needs all of them. The row lock on the test serialises concurrent
-- sign-ups so the last slot cannot be taken twice. The app maps TEST_NOT_FOUND,
-- TEST_CLOSED and TEST_FULL to Polish messages.
create or replace function public.guard_test_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  test public.innovation_tests%rowtype;
  taken int;
begin
  select * into test
  from public.innovation_tests
  where id = new.test_id
  for update;

  if not found then
    raise exception 'TEST_NOT_FOUND' using errcode = 'P0001';
  end if;
  if test.status <> 'open' then
    raise exception 'TEST_CLOSED' using errcode = 'P0001';
  end if;

  select count(*) into taken
  from public.test_signups
  where test_id = new.test_id
    and status <> 'declined';

  if taken >= test.slots then
    raise exception 'TEST_FULL' using errcode = 'P0001';
  end if;

  -- Only an admin (or the SQL editor / service role) decides who is accepted.
  if (select auth.uid()) is not null and not public.is_admin() then
    new.status := 'pending';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_test_signup() from public, anon, authenticated;

drop trigger if exists test_signups_guard on public.test_signups;
create trigger test_signups_guard
  before insert on public.test_signups
  for each row execute function public.guard_test_signup();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.innovation_tests enable row level security;
alter table public.test_signups enable row level security;

revoke all on public.innovation_tests, public.test_signups from anon, authenticated;

grant select on public.innovation_tests to anon;
grant select, insert, update, delete
  on public.innovation_tests, public.test_signups
  to authenticated;
grant all on public.innovation_tests, public.test_signups to service_role;

drop policy if exists "innovation_tests: public read" on public.innovation_tests;
create policy "innovation_tests: public read"
  on public.innovation_tests for select to anon, authenticated
  using (true);

drop policy if exists "innovation_tests: admin full access" on public.innovation_tests;
create policy "innovation_tests: admin full access"
  on public.innovation_tests for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Whether the test is open and has room is checked by guard_test_signup.
drop policy if exists "test_signups: insert own" on public.test_signups;
create policy "test_signups: insert own"
  on public.test_signups for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "test_signups: read own" on public.test_signups;
create policy "test_signups: read own"
  on public.test_signups for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "test_signups: admin full access" on public.test_signups;
create policy "test_signups: admin full access"
  on public.test_signups for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Public aggregates
-- ---------------------------------------------------------------------------

-- Feedback rows are readable only by their author and admins. This returns
-- numbers only, never comments or author ids, so anyone may call it.
create or replace function public.innovation_feedback_summary(p_innovation_id uuid)
returns table (
  count bigint,
  avg_rating numeric,
  rating_1 bigint,
  rating_2 bigint,
  rating_3 bigint,
  rating_4 bigint,
  rating_5 bigint,
  avg_ease numeric,
  recommend_share numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*),
    round(avg(f.rating), 2),
    count(*) filter (where f.rating = 1),
    count(*) filter (where f.rating = 2),
    count(*) filter (where f.rating = 3),
    count(*) filter (where f.rating = 4),
    count(*) filter (where f.rating = 5),
    round(avg(f.ease_of_use), 2),
    round(avg(case when f.would_recommend then 1.0 else 0.0 end)
      filter (where f.would_recommend is not null), 4)
  from public.feedback as f
  where f.innovation_id = p_innovation_id;
$$;

-- Sign-ups that hold a slot (everything except declined).
create or replace function public.test_slots_taken(p_test_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.test_signups as s
  where s.test_id = p_test_id
    and s.status <> 'declined';
$$;

revoke execute on function public.innovation_feedback_summary(uuid) from public;
revoke execute on function public.test_slots_taken(uuid) from public;
grant execute on function public.innovation_feedback_summary(uuid)
  to anon, authenticated, service_role;
grant execute on function public.test_slots_taken(uuid)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Demo tests (fictional). Skipped for innovations that are not seeded.
-- ---------------------------------------------------------------------------

insert into public.innovation_tests
  (id, innovation_id, title, description, municipality, starts_at, ends_at, slots)
select t.id, t.innovation_id, t.title, t.description, t.municipality, t.starts_at, t.ends_at, t.slots
from (
  values
    (
      '00000000-0000-4000-8000-000000000101'::uuid,
      '00000000-0000-4000-8000-000000000012'::uuid,
      'Dyżury asystenta cyfrowego w bibliotece',
      'Raz w tygodniu przychodzisz na godzinny dyżur i z asystentem załatwiasz jedną sprawę przez internet. Po czterech spotkaniach pytamy, co było jasne, a co nie.',
      'Wieliczka',
      '2026-10-15'::date,
      '2026-11-30'::date,
      12
    ),
    (
      '00000000-0000-4000-8000-000000000102'::uuid,
      '00000000-0000-4000-8000-000000000018'::uuid,
      'Codzienny telefon do seniora',
      'Przez sześć tygodni wolontariusz dzwoni do Ciebie albo do Twojego bliskiego o ustalonej porze. Sprawdzamy, czy pora i sposób rozmowy są wygodne.',
      'Nowy Targ',
      '2026-11-02'::date,
      '2026-12-13'::date,
      20
    ),
    (
      '00000000-0000-4000-8000-000000000103'::uuid,
      '00000000-0000-4000-8000-000000000019'::uuid,
      'Wspólny obiad w świetlicy wiejskiej',
      'Cztery czwartkowe obiady z dowozem z przysiółków. Testujemy dowóz, godzinę spotkania i to, czy zajęcia po obiedzie są potrzebne.',
      'Tarnów',
      '2026-11-05'::date,
      '2026-12-17'::date,
      16
    )
) as t (id, innovation_id, title, description, municipality, starts_at, ends_at, slots)
where exists (select 1 from public.innovations as i where i.id = t.innovation_id)
on conflict (id) do nothing;
