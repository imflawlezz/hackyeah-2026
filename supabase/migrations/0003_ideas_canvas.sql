-- Idea canvas, grant calls, and grant drafts.
-- Idempotent: safe to re-run in the HubMI SQL editor.

alter table public.ideas
  add column if not exists canvas jsonb not null default '{}'::jsonb;

alter table public.ideas
  add column if not exists municipality text;

alter table public.ideas
  add column if not exists updated_at timestamptz not null default now();

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

revoke execute on function public.touch_updated_at() from public, anon, authenticated;

drop trigger if exists ideas_touch_updated_at on public.ideas;
create trigger ideas_touch_updated_at
  before update on public.ideas
  for each row execute function public.touch_updated_at();

-- USING keeps reviewed and submitted rows read-only for the author.
-- WITH CHECK still allows a draft to become submitted ("Wyślij do Hubu").
drop policy if exists "ideas: public read submitted" on public.ideas;
create policy "ideas: public read submitted"
  on public.ideas for select to anon, authenticated
  using (status in ('submitted', 'reviewed'));

drop policy if exists "ideas: update own draft" on public.ideas;
create policy "ideas: update own draft"
  on public.ideas for update to authenticated
  using (author_id = (select auth.uid()) and status = 'draft')
  with check (
    author_id = (select auth.uid())
    and status in ('draft', 'submitted')
  );

grant select on public.ideas to anon;

create table if not exists public.grant_calls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  max_amount_pln int,
  required_sections jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.grant_drafts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  call_id uuid not null references public.grant_calls (id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idea_id, call_id)
);

create index if not exists grant_drafts_author_id_idx on public.grant_drafts (author_id);

drop trigger if exists grant_drafts_touch_updated_at on public.grant_drafts;
create trigger grant_drafts_touch_updated_at
  before update on public.grant_drafts
  for each row execute function public.touch_updated_at();

alter table public.grant_calls enable row level security;
alter table public.grant_drafts enable row level security;

revoke all on public.grant_calls, public.grant_drafts from anon, authenticated;

grant select on public.grant_calls to anon, authenticated;
grant insert, update, delete on public.grant_calls to authenticated;
grant select, insert, update, delete on public.grant_drafts to authenticated;
grant all on public.grant_calls, public.grant_drafts to service_role;

drop policy if exists "grant_calls: public read" on public.grant_calls;
create policy "grant_calls: public read"
  on public.grant_calls for select to anon, authenticated
  using (true);

drop policy if exists "grant_calls: admin write" on public.grant_calls;
create policy "grant_calls: admin write"
  on public.grant_calls for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "grant_drafts: read own" on public.grant_drafts;
create policy "grant_drafts: read own"
  on public.grant_drafts for select to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists "grant_drafts: insert own" on public.grant_drafts;
create policy "grant_drafts: insert own"
  on public.grant_drafts for insert to authenticated
  with check (author_id = (select auth.uid()));

drop policy if exists "grant_drafts: update own" on public.grant_drafts;
create policy "grant_drafts: update own"
  on public.grant_drafts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "grant_drafts: admin full access" on public.grant_drafts;
create policy "grant_drafts: admin full access"
  on public.grant_drafts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.grant_calls (
  id,
  title,
  organizer,
  description,
  starts_at,
  ends_at,
  max_amount_pln,
  required_sections
) values (
  '00000000-0000-4000-8000-000000000024',
  'Nabór demonstracyjny: mikrogranty na innowacje społeczne 2026',
  'Małopolski Hub Innowacji Społecznych',
  'Nabór fikcyjny na potrzeby prototypu HubMI.pl. Nie prowadzi do wypłaty środków.',
  '2026-10-01T00:00:00Z',
  '2026-12-31T22:59:59Z',
  20000,
  '[
    {"key":"problem","heading":"Problem","guidance":"Opisz sytuację mieszkańców. Nie podawaj danych osobowych.","maxChars":900},
    {"key":"rozwiązanie","heading":"Rozwiązanie","guidance":"Napisz, jak pomysł działa w praktyce.","maxChars":1200},
    {"key":"odbiorcy","heading":"Odbiorcy","guidance":"Wskaż, kogo pomysł dotyczy.","maxChars":700},
    {"key":"harmonogram","heading":"Harmonogram","guidance":"Zostaw placeholder, jeśli nie znasz dat.","maxChars":800},
    {"key":"budżet","heading":"Budżet","guidance":"Nie wpisuj kwoty, której nie podała osoba zgłaszająca.","maxChars":600}
  ]'::jsonb
)
on conflict (id) do nothing;
