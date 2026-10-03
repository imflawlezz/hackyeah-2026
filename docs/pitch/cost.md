# HubMI.pl — miesięczny koszt i zasoby utrzymania

Wymagany element zgłoszenia: [brief, §4 — wymagania formalne](../task/CHALLENGE.md). Kosztorys pilotażu, stan cenników sprawdzony 3 października 2026. Kwoty netto; podatki i opłaty przewalutowania nie są uwzględnione.

## Założenia

- 1000 dopasowań miesięcznie, do 5 wyników na zapytanie; każde korzysta z AI.
- Jedno konto wdrażające Vercel Pro, jeden projekt Supabase Pro z instancją Micro. Ruch i zasoby mieszczą się w pakietach; to założenie do sprawdzenia w pilotażu.
- Na dopasowanie: 3000 tokenów wejścia i 600 wyjścia modelu uzasadnień oraz 200 tokenów wejścia modelu wektorowego. To szacunek, nie pomiar; dłuższe opisy i większa liczba wyników zwiększą rachunek.
- Miesięczne aktualizacje katalogu: 100 opisów po 400 tokenów do przeliczenia wektorów.
- **1 USD = 4,00 PLN** — jawnie przyjęty kurs planistyczny, nie bieżący kurs NBP ani kurs banku. Kwoty USD należy przemnożyć przez rzeczywisty kurs rozliczenia.

## Usługi miesięcznie

| Składnik                        | Podstawa wyliczenia                                                      | USD/miesiąc | PLN/miesiąc |
| ------------------------------- | ------------------------------------------------------------------------ | ----------: | ----------: |
| Vercel Pro                      | 20 USD, jedno konto wdrażające; 20 USD kredytu zużycia zawarte w opłacie |       20,00 |       80,00 |
| Supabase Pro                    | 25 USD + Micro 10 USD − kredyt obliczeniowy 10 USD                       |       25,00 |      100,00 |
| OpenAI `gpt-4o-mini`            | 3 mln tokenów wejścia × 0,15 USD/mln + 0,6 mln wyjścia × 0,60 USD/mln    |        0,81 |        3,24 |
| OpenAI `text-embedding-3-small` | (0,2 mln zapytań + 0,04 mln aktualizacji) × 0,02 USD/mln                 |      0,0048 |      0,0192 |
| **Suma usług**                  | Bez rezerwy                                                              | **45,8148** |  **183,26** |
| Rezerwa na AI                   | 25% kosztu modeli: 0,8148 × 25%                                          |      0,2037 |      0,8148 |
| **Budżet usług z rezerwą**      | Zaokrąglenie końcowej sumy                                               | **46,0185** |  **184,07** |

Rezerwa nie pokrywa przekroczeń Vercel ani Supabase. Dodatkowe konto wdrażające Vercel to 20 USD, czyli 80 PLN miesięcznie przy przyjętym kursie. Kolejna instancja Supabase, większa baza, transfer i dodatki wymagają osobnego przeliczenia. Filmy prezentujemy jako odnośniki do istniejących zasobów; nie zakładamy hostowania dużej biblioteki MP4 w tym budżecie.

Źródła stawek:

- [Vercel Pro — opłata platformowa, kredyt i dodatkowe konta](https://vercel.com/docs/plans/pro-plan).
- [Supabase — Pro, Micro i kredyt obliczeniowy](https://supabase.com/pricing).
- [OpenAI GPT-4o mini — standardowe stawki za milion tokenów](https://developers.openai.com/api/docs/models/gpt-4o-mini).
- [OpenAI text-embedding-3-small — standardowa stawka za milion tokenów](https://developers.openai.com/api/docs/models/text-embedding-3-small).

Nie zakładamy rabatów za pamięć podręczną ani przetwarzanie wsadowe. Pierwsze zaindeksowanie 200 opisów po 400 tokenów kosztuje jednorazowo około 0,0016 USD, czyli 0,0064 PLN; import i weryfikacja danych wymagają dodatkowo pracy człowieka.

## Niezbędne zasoby i obsługa

| Zasób / odpowiedzialność    | Zakres miesięczny                                                                           | Szacunek pracy i kosztu netto |
| --------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------: |
| Opiekun techniczny          | Aktualizacje zależności, monitoring błędów i kosztów, wdrożenia, kontrola kopii i uprawnień |      8 h × 150 PLN = 1200 PLN |
| Redaktor / koordynator Hubu | Weryfikacja innowacji, aktualizacja katalogu, ocena dopasowań i wsparcie użytkowników       |       10 h × 80 PLN = 800 PLN |
| **Obsługa łącznie**         | Stawki i nakład to założenia budżetowe zespołu, nie oferta dostawcy                         |                  **2000 PLN** |

**Łączny miesięczny budżet pilotażu: 2184,07 PLN netto**, w tym 184,07 PLN usługi z rezerwą AI i 2000 PLN praca ludzi. Jeżeli zadania wykonują obecni pracownicy, koszt usług pozostaje taki sam, a obsługa zużywa ich czas zamiast dodatkowego zlecenia. Szacunek nie obejmuje nowych funkcji ani całodobowego dyżuru.

Potrzebne są: konta organizacji u trzech dostawców, repozytorium i proces wdrożeń, komputer z przeglądarką oraz Node.js 22 do prac technicznych, katalog innowacji dopuszczony do publikacji i osoba odpowiedzialna za jego jakość. Konfiguracja serwerowa: Supabase, `OPENAI_API_KEY`, klucz administracyjny bazy i sekret importu; klucze przechowujemy po stronie serwera. Nie potrzeba własnego serwera ani GPU. Domena i poczta mogą wykorzystywać zasoby instytucji; zakup nowej domeny, wysyłka poczty, osobne środowisko testowe i zewnętrzny monitoring nie są wliczone.

Co tydzień: przegląd błędów, zużycia i jakości wyników. Co miesiąc: aktualizacje, weryfikacja dostępu i próba odtworzenia danych z kopii. Przed pilotażem: import katalogu, kontrola uprawnień i bezpieczeństwa, wspólny ogranicznik żądań oraz testy dostępności i obciążenia. Wdrożenie i te prace przygotowawcze wymagają oddzielnej wyceny. Supabase Pro zawiera codzienne kopie bazy z retencją 7 dni; osobną kopię plików i dłuższą retencję należy zaplanować według potrzeb.

## Wzrost i kontrola wydatków

Przy 10 000 dopasowań i tych samych aktualizacjach katalogu AI kosztuje 8,1408 USD, czyli 32,56 PLN bez rezerwy. Jeśli pakiety infrastruktury nadal wystarczą, usługi z rezerwą 25% na AI wyniosą **220,70 PLN netto/miesiąc**. To scenariusz kosztowy, nie potwierdzenie wydajności instancji Micro; obciążenie i czas obsługi trzeba zmierzyć ponownie.

Ustawić alerty zużycia i progi budżetu, limity długości opisów i liczby wyników oraz monitorować rzeczywiste tokeny. Obecny tryb demonstracyjny nie wywołuje płatnego AI, ale nie zastępuje produkcyjnego wyszukiwania. Asystent kreatora pozostaje niewdrożony i nie jest uwzględniony w kosztach API.
