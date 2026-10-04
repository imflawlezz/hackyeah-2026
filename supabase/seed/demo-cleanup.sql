-- Removes QA rows from the jury database and copies seven innovation
-- descriptions from supabase/seed/seed.sql.
-- One transaction. Safe to run twice. Does not change auth.users, profiles,
-- or any published innovation except those seven descriptions.
-- Rows are chosen by exact title or exact text, never by a date or a pattern.
-- Run as the database owner, then supabase/seed/demo-scenario.sql.
-- After this script, run `npm run embed:innovations` so matching uses the
-- restored descriptions.

begin;

drop table if exists qa_ideas;
create temporary table qa_ideas on commit drop as
select id
from public.ideas
where title in (
  'Fikcyjna kawiarenka naprawcza dla seniorów',
  'Fikcyjna świetlica cyfrowa dla seniorów',
  'Pomóc seniorom w dojazdach do lekarza'
);

delete from public.notifications
where link in (
  select '/ideas/' || id::text from qa_ideas
);

-- These notices are not tied to an idea id. Delete them only while the QA
-- ideas are still here, so a later run leaves the scenario notices in place.
delete from public.notifications
where type = 'idea_submitted'
  and title = 'Nowy pomysł do sprawdzenia'
  and link = '/admin/moderation'
  and exists (select 1 from qa_ideas);

delete from public.notifications
where link = '/messages/6c6aa842-859f-4cd9-b6b3-dc8d7b2fa6b4';

delete from public.conversations
where idea_id in (select id from qa_ideas)
  or subject = 'Fikcyjny projekt kawiarenki naprawczej';

delete from public.ideas
where id in (select id from qa_ideas);

delete from public.innovations
where title = 'Test QA – Kawiarenka naprawcza'
  and status = 'archived';

delete from public.feedback
where comment = 'Fikcyjna uwaga QA.';

delete from public.test_signups
where motivation = 'Chcę sprawdzić dostępność wsparcia cyfrowego dla fikcyjnych seniorów z gminy Brzozowo.';

delete from public.problems
where description in (
  $qa$Chcemy uruchomić regularne sąsiedzkie dyżury naprawcze i kontakt dla seniorów. Wsparcie ma objąć: Seniorzy z fikcyjnych sołectw gminy Brzozowo. Instytucja: Gmina, gmina miejsko-wiejska. Ograniczenia: Brak stałego lokalu, potrzebne partnerstwo z fikcyjną biblioteką.$qa$,
  $qa$Chcemy uruchomić regularne spotkania i transport na zajęcia, aby ograniczyć samotność. Wsparcie ma objąć: Samotni seniorzy z fikcyjnej gminy Brzozowo. Instytucja: Gmina, gmina miejsko-wiejska. Ograniczenia: Brak stałego lokalu; potrzebny transport z sołectw.$qa$,
  $qa$Chcemy zapewnić regularny kontakt i szybką reakcję, gdy senior potrzebuje pomocy. Wsparcie ma objąć: Samotni seniorzy z przysiółków i małych wsi. Instytucja: Gmina, gmina wiejska. Ograniczenia: Brak stałego transportu i ograniczony budżet.$qa$,
  $qa$Jak sprawdzić, czy to potrzebne?$qa$,
  $qa$Jak zaangażować lokalnych seniorów do tego pomysłu?$qa$,
  $qa$Mam pomysł na kawiarenkę cyfrową dla seniorów w małej gminie. Jak go rozwinąć?$qa$,
  $qa$Młodzież po lekcjach nie ma gdzie bezpiecznie spędzić czasu, a rodzice pracują do wieczora.$qa$,
  $qa$Młodzież po szkole zawodowej nie może znaleźć pracy w naszym powiecie.$qa$,
  $qa$Młodzież w małych miastach nie znajduje pracy po szkole$qa$,
  $qa$Młodzież w Nowym Sączu ma problemy ze zdrowiem psychicznym i brakuje psychologów$qa$,
  $qa$Na drodze powiatowej jest dziura w jezdni.$qa$,
  $qa$Osoba z niepełnosprawnością wzroku nie może samodzielnie załatwić sprawy w urzędzie, bo stanowisko nie jest dostępne.$qa$,
  $qa$Osoby na wózkach nie mogą dostać się do urzędu i ośrodka kultury.$qa$,
  $qa$Osoby poruszające się na wózkach nie mogą dostać się do urzędu i korzystać z usług$qa$,
  $qa$Osoby starsze, dzieci i młodzież
miejscowość Zawoja
Wykluczenie komunikacyjne - brak komunikacji publicznej - osoby, które nie posiadają samochodu mają problem z dojazdem do większych miejscowości, żeby skorzystać$qa$,
  $qa$samotni seniorzy na wsi$qa$,
  $qa$Samotni seniorzy na wsi potrzebują opieki w ciągu dnia.$qa$,
  $qa$Samotni seniorzy w gminie wiejskiej nie dowożą się do przychodni i nie mają z kim porozmawiać w ciągu dnia.$qa$,
  $qa$seniorzy$qa$,
  $qa$Seniorzy w gminie są samotni i wykluczeni cyfrowo, potrzebujemy usługi wsparcia. Wsparcie ma objąć: seniorzy. Instytucja: Gmina, gmina wiejska.$qa$,
  $qa$Seniorzy w małych gminach są samotni i nie mają dostępu do opieki$qa$,
  $qa$Seniorzy w małych gminach są samotni i nie mają dostępu do opieki ani transportu.$qa$,
  $qa$Seniorzy w naszej wsi są samotni i nie mają z kim porozmawiać.$qa$,
  $qa$Starsi mieszkańcy naszej gminy czują się samotni i nie potrafią korzystać ze smartfonów, brakuje im kontaktu z innymi ludźmi.$qa$,
  $qa$Starsi mieszkańcy sołectw rzadko wychodzą z domu i nie mają z kim porozmawiać. Szukamy sposobu na regularny kontakt. Wsparcie ma objąć: Samotni seniorzy w małych miejscowościach. Instytucja: OPS lub CUS, gmina wiejska. Ograniczenia: Nie mamy własnego samochodu ani stałej sali.$qa$,
  $qa$Uruchomimy telefoniczne dyżury sąsiedzkie, które łączą seniora z przeszkolonym wolontariuszem.$qa$,
  $qa$xyzqwerty$qa$
);

-- Production copy drifted from seed.sql on these seven rows. Summaries,
-- categories and regions already match. Embeddings stay until
-- `npm run embed:innovations` rewrites them.
update public.innovations
set description = 'Na kilku warsztatach młodzież wybiera lokalny problem, robi z niego mikroprojekt i sprawdza go z mentorem. Na koniec grupa pokazuje wyniki publicznie w domu kultury.'
where id = '00000000-0000-4000-8000-000000000007'
  and description is distinct from 'Na kilku warsztatach młodzież wybiera lokalny problem, robi z niego mikroprojekt i sprawdza go z mentorem. Na koniec grupa pokazuje wyniki publicznie w domu kultury.';

update public.innovations
set description = 'Dzieci i młodzież, których rodzice pracują zmianowo, mogą po lekcjach przyjść do bezpłatnej świetlicy. Dostają tam posiłek i pomoc w lekcjach. Świetlica działa też przez część ferii.'
where id = '00000000-0000-4000-8000-000000000008'
  and description is distinct from 'Dzieci i młodzież, których rodzice pracują zmianowo, mogą po lekcjach przyjść do bezpłatnej świetlicy. Dostają tam posiłek i pomoc w lekcjach. Świetlica działa też przez część ferii.';

update public.innovations
set description = 'Osoba w kryzysie bezdomności dostaje nocleg na jedną noc w jednym ze sprawdzonych miejsc. Rano ma już kontakt do pracownika socjalnego.'
where id = '00000000-0000-4000-8000-000000000010'
  and description is distinct from 'Osoba w kryzysie bezdomności dostaje nocleg na jedną noc w jednym ze sprawdzonych miejsc. Rano ma już kontakt do pracownika socjalnego.';

update public.innovations
set description = 'Małe grupy wsparcia dla osób po epizodzie kryzysu psychicznego. Każda ma moderatora i działa razem z lokalnym ośrodkiem zdrowia. Udział jest bezpłatny, skierowanie nie jest potrzebne.'
where id = '00000000-0000-4000-8000-000000000015'
  and description is distinct from 'Małe grupy wsparcia dla osób po epizodzie kryzysu psychicznego. Każda ma moderatora i działa razem z lokalnym ośrodkiem zdrowia. Udział jest bezpłatny, skierowanie nie jest potrzebne.';

update public.innovations
set description = 'W parkach stoją oznaczone ławki. O stałych porach dyżurują przy nich przeszkoleni wolontariusze, z którymi można zwyczajnie porozmawiać. Wolontariusz wie, gdzie skierować osobę, która potrzebuje pomocy specjalisty.'
where id = '00000000-0000-4000-8000-000000000017'
  and description is distinct from 'W parkach stoją oznaczone ławki. O stałych porach dyżurują przy nich przeszkoleni wolontariusze, z którymi można zwyczajnie porozmawiać. Wolontariusz wie, gdzie skierować osobę, która potrzebuje pomocy specjalisty.';

update public.innovations
set description = 'Do seniora mieszkającego samotnie ktoś codziennie na chwilę dzwoni. Kiedy senior nie odbiera, rusza ustalona wcześniej ścieżka: sprawdzenie u sąsiada albo opiekuna.'
where id = '00000000-0000-4000-8000-000000000018'
  and description is distinct from 'Do seniora mieszkającego samotnie ktoś codziennie na chwilę dzwoni. Kiedy senior nie odbiera, rusza ustalona wcześniej ścieżka: sprawdzenie u sąsiada albo opiekuna.';

update public.innovations
set description = 'Osoby z niepełnosprawnością dostają proste zlecenia zdalne, na przykład porządkowanie danych. Zakres i tempo pracy pomaga ustalić asystent zatrudnienia w gminie.'
where id = '00000000-0000-4000-8000-000000000021'
  and description is distinct from 'Osoby z niepełnosprawnością dostają proste zlecenia zdalne, na przykład porządkowanie danych. Zakres i tempo pracy pomaga ustalić asystent zatrudnienia w gminie.';

commit;
