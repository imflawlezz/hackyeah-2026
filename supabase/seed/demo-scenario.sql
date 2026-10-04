-- Fictional jury scenario owned by the four demo accounts from
-- scripts/create-demo-users.ts. One transaction. Safe to run twice.
-- Run supabase/seed/demo-cleanup.sql first.
--
-- Problem embeddings are left null. Trendy potrzeb and the admin list read
-- description, category, status, best_score and created_at. Matching stores
-- an embedding only when someone submits a new search, and no screen reads
-- the embedding already saved on a problem.
--
-- A reviewed idea writes public.idea_reviews when that table exists (#51),
-- and the older ideas.review_note columns otherwise.

begin;

insert into public.ideas (
  id, author_id, title, essence, target_group, stage, status, municipality, canvas, created_at
)
select
  '00000000-0000-4000-8000-000000000101',
  resident.id,
  'Dowóz seniorów do przychodni w Wieliczce',
  'Raz w tygodniu bus gminy zabiera seniorów z sołectw na badania i odwozi ich do domu.',
  'Samotni seniorzy z sołectw gminy Wieliczka',
  'idea',
  'submitted',
  'Wieliczka',
  jsonb_build_object(
    'problem', 'Seniorzy z sołectw nie mają jak dojechać do przychodni w Wieliczce.',
    'solution', 'Stały kurs busa w czwartek rano, z powrotem po południu.',
    'novelty', 'Godziny ustala przychodnia, nie rozkład linii.',
    'resources', 'Bus gminy i jeden kierowca na pięć godzin.',
    'partners', 'Przychodnia w Wieliczce i sołtysi.',
    'risks', 'Za mało chętnych w jednym tygodniu.',
    'successMeasures', 'Co najmniej osiem osób korzysta z kursu przez miesiąc.'
  ),
  timestamptz '2026-10-02 10:00:00+00'
from public.profiles as resident
join auth.users as account on account.id = resident.id
where account.email = 'resident@hubmi.example'
  and not exists (
    select 1 from public.ideas
    where id = '00000000-0000-4000-8000-000000000101'
  );

insert into public.ideas (
  id, author_id, title, essence, target_group, stage, status, municipality, canvas, created_at
)
select
  '00000000-0000-4000-8000-000000000102',
  resident.id,
  'Świetlica po lekcjach w Nowym Targu',
  'Dzieci zostają w szkole do 17:00. Dostają obiad i godzinę pomocy w lekcjach.',
  'Dzieci z klas 1–6, których rodzice pracują do wieczora',
  'idea',
  'submitted',
  'Nowy Targ',
  jsonb_build_object(
    'problem', 'Po lekcjach dzieci wracają do pustych domów albo czekają na korytarzu.',
    'solution', 'Dwie sale w szkole, obiad i dyżur nauczyciela albo wolontariusza.',
    'novelty', 'Grupa jest przy szkole, więc nie trzeba dodatkowego dowozu.',
    'resources', 'Dwie sale, obiady z kuchni szkolnej, czterech dyżurnych.',
    'partners', 'Szkoła podstawowa i rodzice z rady rodziców.',
    'risks', 'Dyżury mogą paść, gdy wolontariusze zrezygnują.',
    'successMeasures', 'Świetlica działa cztery dni w tygodniu przez dwa miesiące.'
  ),
  timestamptz '2026-09-29 14:30:00+00'
from public.profiles as resident
join auth.users as account on account.id = resident.id
where account.email = 'resident@hubmi.example'
  and not exists (
    select 1 from public.ideas
    where id = '00000000-0000-4000-8000-000000000102'
  );

insert into public.ideas (
  id, author_id, title, essence, target_group, stage, status, municipality, canvas, created_at
)
select
  '00000000-0000-4000-8000-000000000103',
  resident.id,
  'Poranne telefony do seniorów w Zakopanem',
  'Wolontariusz dzwoni rano do seniora. Gdy nikt nie odbiera, sąsiad sprawdza, czy wszystko w porządku.',
  'Seniorzy mieszkający samotnie w Zakopanem',
  'prototype',
  'draft',
  'Zakopane',
  jsonb_build_object(
    'problem', 'Samotni seniorzy w Zakopanem nie mają codziennego kontaktu z drugą osobą.',
    'solution', 'Krótki telefon między 8:00 a 10:00 i umówione sprawdzenie, gdy nikt nie odbiera.',
    'novelty', 'Ścieżka po braku odbioru jest ustalona z sąsiadem z góry.',
    'resources', 'Lista numerów, dwaj wolontariusze i kartka z zasadami.',
    'partners', 'OPS w Zakopanem i jedna wspólnota mieszkaniowa.',
    'risks', 'Senior może nie chcieć podać numeru telefonu.',
    'successMeasures', 'Dwudziestu seniorów odbiera telefon przez trzy tygodnie z rzędu.'
  ),
  timestamptz '2026-09-12 09:15:00+00'
from public.profiles as resident
join auth.users as account on account.id = resident.id
where account.email = 'resident@hubmi.example'
  and not exists (
    select 1 from public.ideas
    where id = '00000000-0000-4000-8000-000000000103'
  );

do $$
declare
  resident_id uuid;
  admin_id uuid;
  has_reviews boolean;
  review_note text := 'Pomysł jest konkretny. Na start wystarczy jedna lista w Zakopanem i dwóch wolontariuszy. Prosimy dopisać, kto przechowuje numery telefonów.';
begin
  select account.id into resident_id
  from auth.users as account
  join public.profiles as profile on profile.id = account.id
  where account.email = 'resident@hubmi.example';

  select account.id into admin_id
  from auth.users as account
  join public.profiles as profile on profile.id = account.id
  where account.email = 'admin@hubmi.example'
    and profile.role = 'admin';

  if resident_id is null or admin_id is null then
    raise exception 'MISSING_DEMO_USER';
  end if;

  if (select count(*) from public.ideas where id in (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000103'
  )) < 3 then
    raise exception 'MISSING_DEMO_IDEA';
  end if;

  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'idea_reviews'
  ) into has_reviews;

  if has_reviews then
    insert into public.idea_reviews (idea_id, note, reviewed_at, reviewed_by)
    select
      '00000000-0000-4000-8000-000000000103',
      review_note,
      timestamptz '2026-09-18 11:00:00+00',
      admin_id
    where not exists (
      select 1 from public.idea_reviews
      where idea_id = '00000000-0000-4000-8000-000000000103'
    );
  else
    update public.ideas
    set review_note = review_note,
      reviewed_at = timestamptz '2026-09-18 11:00:00+00',
      reviewed_by = admin_id
    where id = '00000000-0000-4000-8000-000000000103'
      and status = 'draft';
  end if;

  -- Status changes after the note, so the notification can see the response.
  update public.ideas
  set status = 'reviewed'
  where id = '00000000-0000-4000-8000-000000000103'
    and status = 'draft';
end $$;

insert into public.problems (
  id, description, category, status, best_score, source, embedding, created_at
)
select
  row.id,
  row.description,
  row.category,
  row.status,
  row.best_score,
  row.source,
  null,
  row.created_at
from (
  values
    ('00000000-0000-4000-8000-000000000201'::uuid, 'W Wieliczce opiekunowie osób leżących nie mają komu zostawić bliskiego na kilka godzin w tygodniu.', 'Opieka', 'matched', 0.71::double precision, 'ai', timestamptz '2026-08-25 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000202'::uuid, 'W Nowym Targu starsi mieszkańcy kamienic całymi dniami nie rozmawiają z nikim spoza domu.', 'Samotność', 'matched', 0.66::double precision, 'ai', timestamptz '2026-08-26 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000203'::uuid, 'W Krakowie brakuje noclegu na jedną noc dla osoby, która właśnie straciła mieszkanie.', 'Bezdomność', 'new', null::double precision, null::text, timestamptz '2026-08-27 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000204'::uuid, 'Wejście do ośrodka kultury w Wadowicach ma schody i nie da się wjechać wózkiem.', 'Dostępność', 'matched', 0.74::double precision, 'ai', timestamptz '2026-09-02 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000205'::uuid, 'W Limanowej młodzież po szkole zawodowej nie znajduje pierwszej pracy w okolicy.', 'Młodzież', 'matched', 0.68::double precision, 'ai', timestamptz '2026-09-03 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000206'::uuid, 'W Skawinie seniorzy nie umieją samodzielnie zapisać się do lekarza przez internet.', 'Wykluczenie cyfrowe', 'matched', 0.77::double precision, 'ai', timestamptz '2026-09-04 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000207'::uuid, 'W Olkuszu osoby po długotrwałej przerwie w pracy nie mają gdzie sprawdzić prostych zleceń.', 'Aktywizacja', 'matched', 0.63::double precision, 'ai', timestamptz '2026-09-05 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000208'::uuid, 'W Gorlicach samotni seniorzy z pięter bez windy wychodzą z domu raz na kilka dni.', 'Samotność', 'matched', 0.31::double precision, 'ai', timestamptz '2026-09-08 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000209'::uuid, 'W Bochni rodziny opiekujące się osobą chorą nie mają sprzętu na czas rehabilitacji w domu.', 'Opieka', 'matched', 0.70::double precision, 'ai', timestamptz '2026-09-10 09:00:00+00'),
    ('00000000-0000-4000-8000-00000000020a'::uuid, 'W Myślenicach dorośli po kryzysie nie mają spokojnego miejsca na rozmowę bez zapisów.', 'Zdrowie psychiczne', 'matched', 0.65::double precision, 'ai', timestamptz '2026-09-11 09:00:00+00'),
    ('00000000-0000-4000-8000-00000000020b'::uuid, 'W Niepołomicach stanowisko w urzędzie nie ma czytnika ekranu dla osoby słabowidzącej.', 'Dostępność', 'matched', 0.73::double precision, 'ai', timestamptz '2026-09-15 09:00:00+00'),
    ('00000000-0000-4000-8000-00000000020c'::uuid, 'W Zakopanem dzieci po lekcjach nie mają gdzie zostać, gdy rodzice pracują do wieczora.', 'Młodzież', 'new', null::double precision, null::text, timestamptz '2026-09-16 09:00:00+00'),
    ('00000000-0000-4000-8000-00000000020d'::uuid, 'W Rabce-Zdroju seniorzy z sanatoriów i mieszkańcy gminy nie mają wspólnych spotkań.', 'Samotność', 'matched', 0.69::double precision, 'ai', timestamptz '2026-09-18 09:00:00+00'),
    ('00000000-0000-4000-8000-00000000020e'::uuid, 'W Brzesku opiekunowie osób starszych nie mają dnia wolnego w miesiącu.', 'Opieka', 'matched', 0.76::double precision, 'ai', timestamptz '2026-09-19 09:00:00+00'),
    ('00000000-0000-4000-8000-00000000020f'::uuid, 'W Mszanie Dolnej brakuje dowozu na rehabilitację dla osób, które nie prowadzą samochodu.', 'Opieka', 'matched', 0.38::double precision, 'ai', timestamptz '2026-09-22 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000210'::uuid, 'W Dobczycach pisma z gminy są zbyt trudne dla osób, które słabo czytają.', 'Wykluczenie cyfrowe', 'matched', 0.64::double precision, 'ai', timestamptz '2026-09-23 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000211'::uuid, 'W Andrychowie osoby z niepełnosprawnością szukają pracy, którą da się robić z domu.', 'Aktywizacja', 'matched', 0.72::double precision, 'ai', timestamptz '2026-09-24 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000212'::uuid, 'W Suchej Beskidzkiej młodzież nie wie, gdzie porozmawiać, gdy nastrój długo jest zły.', 'Zdrowie psychiczne', 'matched', 0.67::double precision, 'ai', timestamptz '2026-09-25 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000213'::uuid, 'W Krzeszowicach starsi mieszkańcy bloków nie mają sąsiedzkiego punktu, w którym można usiąść i porozmawiać.', 'Samotność', 'matched', 0.75::double precision, 'ai', timestamptz '2026-09-29 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000214'::uuid, 'W Proszowicach krawężnik przed przychodnią blokuje wjazd wózkiem.', 'Dostępność', 'matched', 0.62::double precision, 'ai', timestamptz '2026-09-30 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000215'::uuid, 'W Tarnowie osoba bez dachu nad głową nie ma gdzie przenocować do rana.', 'Bezdomność', 'new', null::double precision, null::text, timestamptz '2026-10-01 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000216'::uuid, 'W Grybowie nastolatki po lekcjach spędzają czas na rynku, bo świetlica jest zamknięta.', 'Młodzież', 'matched', 0.71::double precision, 'ai', timestamptz '2026-10-02 08:00:00+00'),
    ('00000000-0000-4000-8000-000000000217'::uuid, 'W Starym Sączu rodziny nie mają kogo poprosić o zastępstwo przy osobie leżącej.', 'Opieka', 'matched', 0.66::double precision, 'ai', timestamptz '2026-10-02 15:00:00+00'),
    ('00000000-0000-4000-8000-000000000218'::uuid, 'W Muszynie seniorzy nie korzystają z e-recepty, bo nie mają komu pokazać telefonu.', 'Wykluczenie cyfrowe', 'matched', 0.42::double precision, 'ai', timestamptz '2026-10-03 09:00:00+00'),
    ('00000000-0000-4000-8000-000000000219'::uuid, 'W Szczawnicy samotni mieszkańcy pensjonatów poza sezonem nie mają do kogo zadzwonić.', 'Samotność', 'matched', 0.78::double precision, 'ai', timestamptz '2026-10-03 16:00:00+00')
) as row (id, description, category, status, best_score, source, created_at)
where not exists (
  select 1 from public.problems as problem where problem.id = row.id
);

insert into public.conversations (
  id, kind, subject, created_by, created_at, last_message_at
)
select
  '00000000-0000-4000-8000-000000000301',
  'partnership',
  'Dyżur asystenta w bibliotece w Myślenicach',
  jst.id,
  timestamptz '2026-09-20 11:00:00+00',
  timestamptz '2026-09-20 11:00:00+00'
from public.profiles as jst
join auth.users as account on account.id = jst.id
where account.email = 'jst@hubmi.example'
  and not exists (
    select 1 from public.conversations
    where id = '00000000-0000-4000-8000-000000000301'
  );

insert into public.conversation_participants (conversation_id, user_id)
select '00000000-0000-4000-8000-000000000301', profile.id
from public.profiles as profile
join auth.users as account on account.id = profile.id
where account.email in ('jst@hubmi.example', 'expert@hubmi.example')
on conflict (conversation_id, user_id) do nothing;

insert into public.messages (id, conversation_id, author_id, body, created_at)
select
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000301',
  jst.id,
  'W bibliotece w Myślenicach chcemy dyżur asystenta cyfrowego raz w tygodniu. Szukamy kogoś, kto przeszkoli dwóch wolontariuszy.',
  timestamptz '2026-09-20 11:05:00+00'
from public.profiles as jst
join auth.users as account on account.id = jst.id
where account.email = 'jst@hubmi.example'
  and not exists (
    select 1 from public.messages
    where id = '00000000-0000-4000-8000-000000000302'
  );

insert into public.messages (id, conversation_id, author_id, body, created_at)
select
  '00000000-0000-4000-8000-000000000303',
  '00000000-0000-4000-8000-000000000301',
  expert.id,
  'Mogę poprowadzić dwa spotkania po 90 minut. Najlepiej we wtorki, po 16:00.',
  timestamptz '2026-09-21 08:40:00+00'
from public.profiles as expert
join auth.users as account on account.id = expert.id
where account.email = 'expert@hubmi.example'
  and not exists (
    select 1 from public.messages
    where id = '00000000-0000-4000-8000-000000000303'
  );

do $$
begin
  if (select count(*) from public.problems where id::text like '00000000-0000-4000-8000-0000000002%') < 25 then
    raise exception 'MISSING_DEMO_PROBLEM';
  end if;
  if not exists (
    select 1 from public.conversations
    where id = '00000000-0000-4000-8000-000000000301'
  ) or (
    select count(*) from public.messages
    where conversation_id = '00000000-0000-4000-8000-000000000301'
  ) < 2 then
    raise exception 'MISSING_DEMO_CONVERSATION';
  end if;
end $$;

commit;
