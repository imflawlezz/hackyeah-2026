-- HubMI.pl auth: sign-up metadata on profiles.
--
-- Replaces public.handle_new_user() so a new profile also takes `role` and
-- `municipality` from the sign-up metadata (auth.users.raw_user_meta_data).
--
-- The metadata is sent by the client, so the role is accepted only when it is
-- 'resident', 'jst' or 'expert'. Anything else, including 'admin', becomes
-- 'resident'. The same rule lives in sanitizeSignupRole (src/lib/auth/roles.ts).
--
-- Admins are still promoted manually, in the SQL Editor:
--   update public.profiles set role = 'admin' where id = '<user id>';
--
-- Idempotent: safe to run more than once. Run it in the Supabase SQL Editor
-- after 0001_init.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, display_name, role, municipality)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Użytkownik'),
    case
      when requested_role in ('resident', 'jst', 'expert')
        then requested_role::public.user_role
      else 'resident'::public.user_role
    end,
    nullif(trim(new.raw_user_meta_data ->> 'municipality'), '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- The trigger from 0001 keeps pointing at the replaced function. It is
-- recreated here only so this file also repairs a database where it is missing.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
