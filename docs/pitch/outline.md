# HubMI.pl — konspekt prezentacji (10 slajdów)

Stan prototypu: 3 października 2026. Materiał do przygotowania PDF po polsku zgodnie z [briefem, §4](../task/CHALLENGE.md) i [regulaminem, §4 ust. 9](../task/RULES.md). Regulamin wymaga zarówno PDF, jak i filmu MP4. Poniższe punkty są treścią slajdów; wskazówki opisują proponowane kadry.

## 1. Problem: rozwiązania istnieją, trudno je odnaleźć

- Samotność, wykluczenie cyfrowe i ograniczony dostęp do usług dotyczą mieszkańców Małopolski.
- ROPS ma blisko 200 innowacji społecznych, według briefu wyzwania.
- Mieszkaniec i gmina potrzebują prostego przejścia od opisu potrzeby do sprawdzonego rozwiązania.

Kadr: potrzeba mieszkańca → rozproszone zasoby → czas poszukiwania.

## 2. Rozwiązanie: HubMI.pl

- Cyfrowe serce Małopolskiego Hubu Innowacji Społecznych.
- Opisujesz problem własnymi słowami, otrzymujesz propozycje innowacji i uzasadnienia.
- Docelowo jedna ścieżka łączy mieszkańców, samorządy, organizacje, ekspertów i ROPS.

Kadr: potrzeba → dopasowanie → kontakt → lokalny pilotaż; ostatnie dwa kroki jako plan rozwoju.

## 3. Demonstracja: od potrzeby do propozycji

- Przykład: „Potrzebuję wsparcia w opiece nad osobą starszą”.
- Wywołujemy działające API dopasowania; pokazujemy tytuł innowacji, wynik i uzasadnienie.
- Sprawdzamy oznaczenie źródła: AI albo dane demonstracyjne. Strona formularza jest jeszcze szablonem.

Kadr: rzeczywiste żądanie i odpowiedź API; instrukcja w [scenariuszu](video-script.md). Nie przedstawiamy danych demonstracyjnych jako zweryfikowanej biblioteki ROPS.

## 4. Moduły: wspólna ścieżka współpracy

- Rdzeń zaimplementowany: API dopasowania oraz przygotowanie wektorów opisów innowacji.
- Strony szablonowe: zasobnik wiedzy, kreator pomysłów, tester innowacji, komunikacja i panel administratora.
- Plan: nabory grantowe, asystent kreatora i pośrednik dostosowujący innowację do potrzeb instytucji.

Kadr: mapa modułów z legendą „zaimplementowane / szablon / plan”. Asystent API obecnie zwraca 501.

## 5. AI: podobieństwo i zrozumiałe uzasadnienie

- OpenAI `text-embedding-3-small`: wektor opisu potrzeby; Supabase: wyszukanie podobnych innowacji.
- OpenAI `gpt-4o-mini`: krótkie uzasadnienia po polsku dla znalezionych propozycji.
- Przy braku konfiguracji lub błędzie wyszukiwania działa tryb demonstracyjny; człowiek ocenia przydatność wyniku.

Kadr: opis → wektor → katalog → uzasadnienie. Wynik podobieństwa nie jest prawdopodobieństwem skuteczności. Stopka: „OpenAI, Vercel AI SDK, Supabase; dokumentacja przygotowana z pomocą OpenAI Codex”. Pełny wykaz: [uznanie autorstwa](ai-credits.md).

## 6. Dostępność: projektujemy dla różnych odbiorców

- Cel: WCAG 2.1 AA, prosty język i czytelna ścieżka zgłoszenia.
- Już w szkielecie: język polski dokumentu, główny obszar treści i odnośnik „Przejdź do treści”.
- Przed pilotażem: testy klawiatury, czytnika ekranu, kontrastu i powiększenia oraz badania z seniorami.

Kadr: widoczny odnośnik po naciśnięciu Tab. Zgodność WCAG wymaga audytu; nie deklarujemy certyfikacji.

## 7. Skalowalność: od gminy do regionu

- Next.js na Vercel i katalog w Supabase pozwalają rozwijać aplikację etapami.
- Wektory katalogu przygotowujemy wcześniej; jedno wywołanie modelu językowego obsługuje cały zestaw wyników.
- Przed wzrostem ruchu: wspólny ogranicznik żądań, indeksowanie, testy obciążeniowe i monitoring opóźnień.

Kadr: gmina → kilka gmin → województwo. Obecny ogranicznik działa na pojedynczej instancji; wydajność regionalna pozostaje do zmierzenia.

## 8. Koszt i utrzymanie

- Pilotaż: 1000 dopasowań miesięcznie, jeden projekt bazy i jedno konto wdrażające.
- Usługi z rezerwą AI: około **184,07 PLN netto/miesiąc** przy kursie planistycznym 4,00 PLN/USD.
- Obsługa techniczna i treści: szacunkowo 2000 PLN netto; łącznie **2184,07 PLN netto/miesiąc**.

Kadr: Vercel 80 PLN + Supabase 100 PLN + AI 3,47 PLN; osobno praca ludzi. Stawki, założenia, zasoby i ograniczenia: [kosztorys](cost.md).

## 9. Zespół: odpowiedzialność za wdrożenie

- Interfejs i dostępność; API, baza i AI; testy, treści i prezentacja — obszary odpowiedzialności zespołu.
- Do pilotażu potrzebujemy opiekuna technicznego oraz redaktora i koordynatora po stronie ROPS.
- Nazwa zespołu, identyfikator HackTribe i nazwiska: do uzupełnienia przez zespół przed eksportem.

Kadr: rzeczywiści członkowie i ich role; nie przypisujemy niepotwierdzonych nazwisk ani partnerstwa z ROPS.

## 10. Następne kroki: pilotaż z mierzalnym wynikiem

- Podłączyć zweryfikowany katalog ROPS i ukończyć formularz dopasowania.
- Przeprowadzić pilotaż z mieszkańcami i gminami: mierzyć trafność propozycji, czas znalezienia rozwiązania i zrozumiałość.
- Po audycie dostępności i bezpieczeństwa rozbudować komunikację, kreator i testowanie innowacji.

Kadr: etapy pilotażu i zaproszenie do współpracy. Przed zgłoszeniem uzupełnić adres działającego demo oraz makiet; nie zastępować ich adresem lokalnym. Repozytorium: https://github.com/imflawlezz/hackyeah-2026.
