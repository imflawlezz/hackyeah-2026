-- Move private responses out of publicly readable idea rows atomically.
begin;

create table public.idea_reviews (
  idea_id uuid primary key references public.ideas(id) on delete cascade,
  note text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);
alter table public.idea_reviews enable row level security;
revoke all on public.idea_reviews from public, anon, authenticated;
grant select, insert, update, delete on public.idea_reviews to authenticated;
grant all on public.idea_reviews to service_role;

create policy "idea_reviews: admin full access"
  on public.idea_reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "idea_reviews: author read"
  on public.idea_reviews for select to authenticated
  using (exists (
    select 1 from public.ideas i
    where i.id = idea_id and i.author_id = (select auth.uid())
  ));

insert into public.idea_reviews(idea_id, note, reviewed_at, reviewed_by)
select id, review_note, reviewed_at, reviewed_by from public.ideas
where review_note is not null or reviewed_at is not null or reviewed_by is not null;

alter table public.ideas
  drop column review_note,
  drop column reviewed_at,
  drop column reviewed_by;

create or replace function public.notify_idea_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then return new; end if;
  end if;
  if new.status = 'submitted' then
    insert into public.notifications(user_id, type, title, body, link)
    select id, 'idea_submitted', 'Nowy pomysł do sprawdzenia', new.title,
      '/admin/moderation' from public.profiles where role = 'admin';
  elsif new.status = 'reviewed' and new.author_id is not null then
    insert into public.notifications(user_id, type, title, body, link)
    values(new.author_id, 'idea_reviewed', 'Twój pomysł został sprawdzony',
      case when exists (
        select 1 from public.idea_reviews where idea_id = new.id
          and nullif(btrim(note), '') is not null
      ) then 'Zespół ROPS dodał odpowiedź. Otwórz pomysł, aby ją przeczytać.'
      else new.title end, '/ideas/' || new.id);
  end if;
  return new;
end $$;

-- Invoker rights retain RLS; one transaction prevents partial saves and ensures
-- the status notification can see the response before it fires.
create function public.review_idea(p_idea_id uuid, p_note text)
returns uuid language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_note is not null and char_length(p_note) > 1000 then
    raise exception 'INVALID_INPUT';
  end if;
  perform 1 from public.ideas where id = p_idea_id for update;
  if not found then return null; end if;
  insert into public.idea_reviews(idea_id, note, reviewed_at, reviewed_by)
  values(p_idea_id, nullif(btrim(p_note), ''), now(), auth.uid())
  on conflict (idea_id) do update set note = excluded.note,
    reviewed_at = excluded.reviewed_at, reviewed_by = excluded.reviewed_by;
  update public.ideas set status = 'reviewed' where id = p_idea_id;
  return p_idea_id;
end $$;
revoke all on function public.review_idea(uuid, text) from public, anon;
grant execute on function public.review_idea(uuid, text) to authenticated;
commit;
