-- Private messaging. Apply in the HubMI SQL Editor; safe to run again.
create table if not exists public.conversations (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('ask_rops','ask_expert','partnership')),
 subject text not null check(char_length(btrim(subject)) between 1 and 200),
 innovation_id uuid references public.innovations on delete set null,
 idea_id uuid references public.ideas on delete set null,
 created_by uuid not null default auth.uid() references public.profiles,
 created_at timestamptz not null default now(), last_message_at timestamptz not null default now()
);
create table if not exists public.conversation_participants (
 conversation_id uuid references public.conversations on delete cascade,
 user_id uuid references public.profiles on delete cascade,
 last_read_at timestamptz, primary key(conversation_id,user_id)
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations on delete cascade,
 author_id uuid not null default auth.uid() references public.profiles,
 body text not null check(char_length(btrim(body)) between 1 and 4000), created_at timestamptz not null default now()
);
create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
 type text not null check(type in ('message','idea_submitted','idea_reviewed','system')),
 title text not null, body text not null, link text not null check(link like '/%' and link not like '//%'),
 read_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists messages_thread_time on public.messages(conversation_id,created_at);
create index if not exists participants_user on public.conversation_participants(user_id);
create index if not exists notifications_owner_time on public.notifications(user_id,created_at desc);
create or replace function public.is_conversation_participant(p_conversation uuid) returns boolean
 language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.conversation_participants where conversation_id=p_conversation and user_id=auth.uid());
$$;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
do $$ declare t text; begin
 foreach t in array array['conversations','conversation_participants','messages','notifications'] loop
 execute format('drop policy if exists admin_all on public.%I',t);
 execute format('create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',t);
 end loop;
end $$;
drop policy if exists participant_read on public.conversations;
create policy participant_read on public.conversations for select to authenticated using(public.is_conversation_participant(id));
drop policy if exists participant_read on public.conversation_participants;
create policy participant_read on public.conversation_participants for select to authenticated using(public.is_conversation_participant(conversation_id));
drop policy if exists participant_update on public.conversation_participants;
create policy participant_update on public.conversation_participants for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists participant_read on public.messages;
create policy participant_read on public.messages for select to authenticated using(public.is_conversation_participant(conversation_id));
drop policy if exists participant_send on public.messages;
create policy participant_send on public.messages for insert to authenticated with check(author_id=auth.uid() and public.is_conversation_participant(conversation_id));
drop policy if exists owner_read on public.notifications;
create policy owner_read on public.notifications for select to authenticated using(user_id=auth.uid());
drop policy if exists owner_update on public.notifications;
create policy owner_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.conversations,public.conversation_participants,public.messages,public.notifications from anon,authenticated;
grant select,insert,delete on public.conversations,public.conversation_participants,public.messages,public.notifications to authenticated;
grant update on public.conversations,public.messages to authenticated;
grant update(last_read_at) on public.conversation_participants to authenticated;
grant update(read_at) on public.notifications to authenticated;
-- Guard immutable owner fields while retaining full administrator access.
create or replace function public.guard_message_updates() returns trigger
 language plpgsql set search_path = '' as $$
begin
 if public.is_admin() then return new; end if;
 if tg_table_name='notifications' then
  if (to_jsonb(new) - 'read_at') is distinct from (to_jsonb(old) - 'read_at') then raise exception 'READ_AT_ONLY'; end if;
 elsif (to_jsonb(new) - 'last_read_at') is distinct from (to_jsonb(old) - 'last_read_at') then raise exception 'LAST_READ_AT_ONLY';
 end if;
 return new;
end $$;
drop trigger if exists guard_updates on public.notifications;
create trigger guard_updates before update on public.notifications for each row execute function public.guard_message_updates();
drop trigger if exists guard_updates on public.conversation_participants;
create trigger guard_updates before update on public.conversation_participants for each row execute function public.guard_message_updates();
grant update on public.notifications,public.conversation_participants to authenticated;
revoke all on function public.guard_message_updates() from public,anon,authenticated;
create or replace function public.start_conversation(p_kind text,p_subject text,p_body text,p_innovation_id uuid default null,p_idea_id uuid default null,p_recipient uuid default null)
 returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; recipients uuid[]; begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'AUTH_REQUIRED'; end if;
 if p_kind is null or p_kind not in ('ask_rops','ask_expert','partnership') or p_subject is null or char_length(btrim(p_subject)) not between 1 and 200 or p_body is null or char_length(btrim(p_body)) not between 1 and 4000 then raise exception 'INVALID_INPUT'; end if;
 if p_idea_id is not null and not exists(select 1 from public.ideas where id=p_idea_id and (author_id=auth.uid() or public.is_admin())) then raise exception 'IDEA_UNAVAILABLE'; end if;
 if p_kind='ask_rops' then select array_agg(id) into recipients from public.profiles where role='admin';
 elsif p_kind='ask_expert' then
  if exists(select 1 from public.profiles where id=p_recipient and role='expert') then recipients:=array[p_recipient];
  else select array_agg(id) into recipients from public.profiles where role='expert'; end if;
 else
  if p_recipient is null or p_recipient=auth.uid() or not exists(select 1 from public.profiles where id=p_recipient) then raise exception 'RECIPIENT_REQUIRED'; end if;
  recipients:=array[p_recipient];
 end if;
 if coalesce(array_length(recipients,1),0)=0 then raise exception 'NO_RECIPIENT'; end if;
 insert into public.conversations(kind,subject,innovation_id,idea_id,created_by) values(p_kind,btrim(p_subject),p_innovation_id,p_idea_id,auth.uid()) returning id into cid;
 insert into public.conversation_participants(conversation_id,user_id) select cid,unnest(recipients || array[auth.uid()]) on conflict do nothing;
 insert into public.messages(conversation_id,author_id,body) values(cid,auth.uid(),btrim(p_body));
 return cid;
end $$;
create or replace function public.list_experts() returns table(id uuid,display_name text,municipality text)
 language sql stable security definer set search_path = '' as $$
 select id,display_name,municipality from public.profiles where role='expert' and auth.uid() is not null;
$$;
create or replace function public.conversation_people(p_conversation uuid) returns table(id uuid,display_name text,role public.user_role)
 language sql stable security definer set search_path = '' as $$
 select p.id,p.display_name,p.role from public.profiles p join public.conversation_participants cp on cp.user_id=p.id
 where cp.conversation_id=p_conversation and public.is_conversation_participant(p_conversation);
$$;
create or replace function public.notify_message() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 update public.conversations set last_message_at=new.created_at where id=new.conversation_id;
 insert into public.notifications(user_id,type,title,body,link)
 select user_id,'message','Nowa wiadomość',c.subject,'/messages/' || new.conversation_id
 from public.conversation_participants cp join public.conversations c on c.id=cp.conversation_id
 where cp.conversation_id=new.conversation_id and cp.user_id<>new.author_id;
 return new;
end $$;
drop trigger if exists notify_message on public.messages;
create trigger notify_message after insert on public.messages for each row execute function public.notify_message();
create or replace function public.notify_idea_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if tg_op='UPDATE' then if new.status is not distinct from old.status then return new; end if; end if;
 if new.status='submitted' then
 insert into public.notifications(user_id,type,title,body,link) select id,'idea_submitted','Nowy pomysł do sprawdzenia',new.title,'/admin/moderation' from public.profiles where role='admin';
 elsif new.status='reviewed' and new.author_id is not null then
 insert into public.notifications(user_id,type,title,body,link) values(new.author_id,'idea_reviewed','Twój pomysł został sprawdzony',new.title,'/ideas/' || new.id);
 end if;
 return new;
end $$;
drop trigger if exists notify_idea_status on public.ideas;
create trigger notify_idea_status after insert or update of status on public.ideas for each row execute function public.notify_idea_status();
revoke all on function public.is_conversation_participant(uuid),public.start_conversation(text,text,text,uuid,uuid,uuid),public.list_experts(),public.conversation_people(uuid),public.notify_message(),public.notify_idea_status() from public,anon;
grant execute on function public.is_conversation_participant(uuid),public.start_conversation(text,text,text,uuid,uuid,uuid),public.list_experts(),public.conversation_people(uuid) to authenticated;
do $$ declare t text; begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
 foreach t in array array['messages','notifications'] loop
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then execute format('alter publication supabase_realtime add table public.%I',t); end if;
 end loop; end if;
end $$;
