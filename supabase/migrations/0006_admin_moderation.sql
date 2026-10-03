-- HubMI.pl #27: admin moderation, innovation publishing status and need trends.
-- Idempotent: safe to run more than once in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- innovations: publishing status
-- ---------------------------------------------------------------------------

alter table public.innovations
  add column if not exists status text not null default 'published',
  add column if not exists updated_at timestamptz not null default now();

alter table public.innovations
  drop constraint if exists innovations_status_check;
alter table public.innovations
  add constraint innovations_status_check
  check (status in ('draft', 'published', 'archived'));

create index if not exists innovations_status_idx on public.innovations (status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Embedding backfills only change the vector; they should not look like edits.
drop trigger if exists innovations_touch_updated_at on public.innovations;
create trigger innovations_touch_updated_at
  before update of title, summary, description, category, target_group,
    region, video_url, image_url, tags, status
  on public.innovations
  for each row execute function public.touch_updated_at();

-- Drafts and archived rows disappear from public pages and, because
-- match_innovations runs with the caller's rights, from matching too.
drop policy if exists "innovations: public read" on public.innovations;
create policy "innovations: public read"
  on public.innovations for select to anon, authenticated
  using (status = 'published' or public.is_admin());

-- ---------------------------------------------------------------------------
-- problems: matching outcome and admin note
-- ---------------------------------------------------------------------------

alter table public.problems
  add column if not exists best_score double precision,
  add column if not exists source text,
  add column if not exists admin_note text;

alter table public.problems
  drop constraint if exists problems_source_check;
alter table public.problems
  add constraint problems_source_check
  check (source is null or source in ('ai', 'mock'));

create index if not exists problems_created_at_idx on public.problems (created_at);
create index if not exists problems_status_idx on public.problems (status);

-- ---------------------------------------------------------------------------
-- ideas: review
-- ---------------------------------------------------------------------------

alter table public.ideas
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

create index if not exists ideas_status_idx on public.ideas (status);
create index if not exists ideas_reviewed_by_idx on public.ideas (reviewed_by);

-- ---------------------------------------------------------------------------
-- Need trends (admin only)
-- ---------------------------------------------------------------------------

-- Problems per category and ISO week. Security invoker: RLS on problems lets
-- only admins see every row, so other callers get only their own problems.
-- A problem is "unmet" when it is still new or its best similarity is below
-- p_unmet_score (the app uses UNMET_SCORE_THRESHOLD from src/lib/admin/trends.ts).
create or replace function public.problem_trends(
  p_days int default null,
  p_unmet_score double precision default 0.45
)
returns table (
  category text,
  week date,
  count bigint,
  unmet_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(p.category, 'Bez kategorii') as category,
    date_trunc('week', p.created_at)::date as week,
    count(*) as count,
    count(*) filter (
      where p.status = 'new'
        or (p.best_score is not null and p.best_score < p_unmet_score)
    ) as unmet_count
  from public.problems as p
  where p_days is null
    or p.created_at >= now() - make_interval(days => p_days)
  group by 1, 2
  order by 2, 1;
$$;

revoke execute on function public.problem_trends(int, double precision) from public, anon;
grant execute on function public.problem_trends(int, double precision)
  to authenticated, service_role;
