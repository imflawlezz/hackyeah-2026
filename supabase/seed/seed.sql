-- Demo innovations for HubMI.pl. Fictional sample data: no real people,
-- organisations or contact details. Safe to re-run; existing ids are skipped.
--
-- Embeddings are left null here. `npm run embed:innovations` generates them
-- from the text (OpenAI, 1536 dimensions); match_innovations skips rows
-- without one.

insert into public.innovations
  (id, title, summary, description, category, target_group, region, tags, created_at)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Sąsiedzka opieka wytchnieniowa',
    'Wolontariusze z osiedla zastępują na kilka godzin opiekuna osoby starszej.',
    'Wolontariusze z osiedla przejmują na kilka godzin opiekę nad osobą starszą, żeby stały opiekun mógł odpocząć albo załatwić sprawy. Dyżury układa lokalne centrum usług społecznych.',
    'Opieka',
    'Opiekunowie osób starszych',
    'Kraków',
    array['seniorzy', 'opieka', 'wytchnienie', 'wolontariat'],
    '2025-02-11T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Bank czasu opiekunów',
    'Wymiana godzin opieki, transportu i towarzystwa bez rozliczeń pieniężnych.',
    'Mieszkańcy wymieniają godziny opieki, transportu i towarzystwa bez rozliczeń pieniężnych. Poręczenia prowadzi centrum usług społecznych.',
    'Opieka',
    'Opiekunowie osób zależnych',
    'powiat wielicki',
    array['opieka', 'seniorzy', 'wolontariat', 'transport'],
    '2025-03-22T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Wypożyczalnia sprzętu opiekuńczego',
    'Gminna wypożyczalnia łóżek, podnośników i wózków z instruktażem w domu.',
    'Gmina wypożycza rodzinom łóżka rehabilitacyjne, podnośniki i wózki na czas opieki domowej. Przy dostawie fizjoterapeuta pokazuje, jak bezpiecznie korzystać ze sprzętu i przenosić osobę leżącą.',
    'Opieka',
    'Rodziny opiekujące się osobą leżącą',
    'powiat limanowski',
    array['opieka', 'sprzęt', 'rehabilitacja', 'dom'],
    '2024-10-07T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'Mobilny punkt dostępności',
    'Przenośny zestaw sprzętu wspierającego, wypożyczany urzędom na dyżury.',
    'Przenośny zestaw z pętlą indukcyjną, lupą elektroniczną i stanowiskiem z czytnikiem ekranu. Urzędy i świetlice wypożyczają go na dyżury dla mieszkańców.',
    'Dostępność',
    'Osoby z niepełnosprawnością',
    'cała Małopolska',
    array['niepełnosprawność', 'dostępność', 'urząd', 'sprzęt'],
    '2025-01-20T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'Urząd prostym językiem',
    'Najczęstsze pisma urzędowe przepisane na prosty język i tekst łatwy do czytania.',
    'Zespół urzędników i mieszkańców przepisuje najczęściej wysyłane pisma na prosty język, a wybrane także na tekst łatwy do czytania. Każdy wzór sprawdza przed publikacją grupa odbiorców.',
    'Dostępność',
    'Mieszkańcy załatwiający sprawy urzędowe',
    'powiat tarnowski',
    array['dostępność', 'prosty język', 'urząd', 'pisma'],
    '2025-04-15T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000006',
    'Mapa barier w gminie',
    'Mieszkańcy oznaczają bariery architektoniczne, a gmina co kwartał wybiera te do usunięcia.',
    'Mieszkańcy zgłaszają na wspólnej mapie krawężniki, schody i przejścia, których nie da się pokonać wózkiem lub z laską. Raz na kwartał gmina wybiera z listy bariery do usunięcia i publikuje, co zostało zrobione.',
    'Dostępność',
    'Osoby z ograniczoną mobilnością',
    'powiat myślenicki',
    array['dostępność', 'niepełnosprawność', 'mapa', 'partycypacja'],
    '2025-06-18T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000007',
    'Inkubator młodzieżowych inicjatyw',
    'Cykl warsztatów, w którym młodzież zamienia lokalny problem w mikroprojekt.',
    'Krótki cykl warsztatów, w którym młodzież zamienia lokalny problem w mikroprojekt i sprawdza go z mentorem. Grupa kończy cykl publiczną prezentacją w domu kultury.',
    'Młodzież',
    'Młodzież w wieku 15–25 lat',
    'Nowy Sącz',
    array['młodzież', 'partycypacja', 'warsztaty', 'gmina'],
    '2025-03-04T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000008',
    'Świetlica otwarta po lekcjach',
    'Bezpłatna świetlica z posiłkiem i pomocą w lekcjach dla dzieci rodziców pracujących zmianowo.',
    'Bezpłatna świetlica z posiłkiem i pomocą w lekcjach dla dzieci i młodzieży, których rodzice pracują zmianowo. Świetlica jest otwarta także w części ferii.',
    'Młodzież',
    'Dzieci i młodzież szkolna',
    'powiat chrzanowski',
    array['młodzież', 'opieka', 'świetlica', 'edukacja'],
    '2025-06-01T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000009',
    'Młodzieżowy budżet sołecki',
    'Wydzielona część funduszu sołeckiego, o której decydują osoby do 18 lat.',
    'Sołectwo oddaje część funduszu do decyzji osób poniżej 18 lat. Młodzież sama zbiera pomysły, liczy koszty z sołtysem i głosuje, a potem pilnuje wykonania wybranego zadania.',
    'Młodzież',
    'Młodzież z terenów wiejskich',
    'powiat nowotarski',
    array['młodzież', 'partycypacja', 'wieś', 'budżet'],
    '2024-09-12T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000010',
    'Nocleg interwencyjny „Jedna noc”',
    'Sieć sprawdzonych miejsc noclegowych na jedną noc z kontaktem do pracownika socjalnego rano.',
    'Sieć sprawdzonych miejsc noclegowych na jedną noc dla osób w kryzysie bezdomności. Rano mieszkaniec dostaje kontakt do pracownika socjalnego.',
    'Bezdomność',
    'Osoby w kryzysie bezdomności',
    'Kraków',
    array['bezdomność', 'nocleg', 'kryzys', 'pomoc'],
    '2024-11-18T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    'Mieszkanie treningowe z asystentem',
    'Półroczny pobyt w mieszkaniu treningowym z planem wyjścia z bezdomności.',
    'Osoba wychodząca z bezdomności mieszka przez pół roku w mieszkaniu treningowym i raz w tygodniu spotyka się z asystentem. Razem układają budżet, sprawy urzędowe i plan przejścia do samodzielnego najmu.',
    'Bezdomność',
    'Osoby wychodzące z bezdomności',
    'Tarnów',
    array['bezdomność', 'mieszkanie', 'asystent', 'usamodzielnienie'],
    '2025-01-09T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    'Gminny asystent cyfrowy',
    'Dyżury w bibliotece, na których mieszkańcy uczą się załatwiać sprawy online.',
    'Stałe dyżury w bibliotece i domu kultury, na których mieszkańcy uczą się profilu zaufanego, e-recepty i kontaktu z urzędem online. Asystent nie załatwia sprawy zamiast mieszkańca, tylko prowadzi go przez kolejne kroki.',
    'Wykluczenie cyfrowe',
    'Seniorzy i osoby wykluczone cyfrowo',
    'powiat gorlicki',
    array['seniorzy', 'cyfryzacja', 'urząd', 'edukacja'],
    '2025-04-02T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000013',
    'Wnuczek na godziny',
    'Uczniowie szkół średnich uczą seniorów obsługi telefonu w parach jeden na jeden.',
    'Uczniowie szkół średnich spotykają się z seniorami w parach i uczą ich obsługi telefonu: wideorozmów, bankowości i rozpoznawania oszustw. Szkoła zalicza te godziny jako wolontariat.',
    'Wykluczenie cyfrowe',
    'Seniorzy',
    'powiat oświęcimski',
    array['seniorzy', 'cyfryzacja', 'młodzież', 'wolontariat'],
    '2025-05-06T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000014',
    'Wypożyczalnia tabletów z internetem',
    'Biblioteka wypożycza skonfigurowane tablety z pakietem danych i krótkim szkoleniem.',
    'Biblioteka wypożycza na trzy miesiące tablety z pakietem danych i dużymi ikonami najpotrzebniejszych usług. Przed wypożyczeniem bibliotekarz przeprowadza półgodzinne szkolenie.',
    'Wykluczenie cyfrowe',
    'Osoby bez dostępu do internetu',
    'powiat miechowski',
    array['cyfryzacja', 'biblioteka', 'sprzęt', 'internet'],
    '2024-12-02T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000015',
    'Krąg po kryzysie psychicznym',
    'Małe, moderowane grupy wsparcia po epizodzie kryzysu, bez skierowania.',
    'Małe, moderowane grupy wsparcia po epizodzie kryzysu psychicznego, prowadzone razem z lokalnym ośrodkiem zdrowia. Spotkania są bezpłatne i nie wymagają skierowania.',
    'Zdrowie psychiczne',
    'Osoby po kryzysie psychicznym',
    'Kraków',
    array['zdrowie psychiczne', 'wsparcie', 'grupa', 'samotność'],
    '2025-05-14T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000016',
    'Pierwsza pomoc emocjonalna w szkole',
    'Szkolenie nauczycieli i uczniów z rozpoznawania kryzysu i pierwszej rozmowy.',
    'Nauczyciele i wybrani uczniowie uczą się rozpoznawać sygnały kryzysu u rówieśników i prowadzić pierwszą rozmowę. Szkoła ma spisaną ścieżkę, do kogo kieruje ucznia dalej.',
    'Zdrowie psychiczne',
    'Uczniowie szkół ponadpodstawowych',
    'powiat bocheński',
    array['zdrowie psychiczne', 'młodzież', 'szkoła', 'profilaktyka'],
    '2025-02-03T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000017',
    'Ławka rozmowy',
    'Oznaczone ławki w parkach z dyżurami przeszkolonych wolontariuszy.',
    'Oznaczone ławki w parkach, przy których o stałych porach dyżurują przeszkoleni wolontariusze gotowi do zwykłej rozmowy. Wolontariusz wie, gdzie skierować osobę, która potrzebuje pomocy specjalisty.',
    'Zdrowie psychiczne',
    'Dorośli mieszkańcy w obniżonym nastroju',
    'powiat wadowicki',
    array['zdrowie psychiczne', 'rozmowa', 'wolontariat', 'samotność'],
    '2025-07-08T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000018',
    'Teleopieka sąsiedzka',
    'Codzienny telefon do samotnego seniora i ustalona ścieżka, gdy nie odbiera.',
    'Codzienny krótki telefon do seniora mieszkającego samotnie. Brak odebrania uruchamia ustaloną ścieżkę sprawdzenia u sąsiada albo opiekuna.',
    'Samotność',
    'Samotni seniorzy',
    'powiat nowosądecki',
    array['seniorzy', 'samotność', 'telefon', 'bezpieczeństwo'],
    '2025-02-28T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000019',
    'Obiad przy wspólnym stole',
    'Cotygodniowy wspólny obiad w świetlicy z dowozem dla seniorów z przysiółków.',
    'Raz w tygodniu koło gospodyń gotuje obiad w świetlicy wiejskiej dla seniorów, a gmina dowozi osoby z odległych przysiółków. Po obiedzie jest czas na rozmowę i krótkie zajęcia ruchowe.',
    'Samotność',
    'Seniorzy z terenów wiejskich',
    'powiat suski',
    array['seniorzy', 'samotność', 'wieś', 'transport'],
    '2024-10-21T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000020',
    'Spacerowi partnerzy',
    'Łączenie w pary osób, które chcą regularnie spacerować w towarzystwie.',
    'Klub seniora łączy w pary osoby z tej samej okolicy, które chcą spacerować dwa razy w tygodniu. Trasy są krótkie, z ławkami po drodze, a pary zmieniają się co miesiąc.',
    'Samotność',
    'Osoby starsze mieszkające samotnie',
    'Kraków',
    array['seniorzy', 'samotność', 'ruch', 'sąsiedztwo'],
    '2025-08-19T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'Praca chroniona zdalnie',
    'Proste zlecenia zdalne dla osób z niepełnosprawnością ze wsparciem asystenta zatrudnienia.',
    'Proste zlecenia zdalne, takie jak porządkowanie danych, dla osób z niepełnosprawnością. Asystent zatrudnienia w gminie pomaga ustalić zakres i tempo pracy.',
    'Aktywizacja',
    'Osoby z niepełnosprawnością',
    'cała Małopolska',
    array['niepełnosprawność', 'praca', 'zdalnie', 'aktywizacja'],
    '2024-12-09T08:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000000022',
    'Warsztat naprawczy 50+',
    'Punkt napraw prowadzony przez osoby po pięćdziesiątce wracające na rynek pracy.',
    'Osoby po pięćdziesiątce, które długo nie pracowały, prowadzą punkt napraw sprzętu domowego i rowerów. Przez pierwsze miesiące pracują z instruktorem, a spółdzielnia socjalna zatrudnia najlepszych na stałe.',
    'Aktywizacja',
    'Osoby długotrwale bezrobotne 50+',
    'powiat olkuski',
    array['aktywizacja', 'praca', 'naprawa', 'spółdzielnia socjalna'],
    '2025-03-17T08:00:00Z'
  )
on conflict (id) do nothing;
