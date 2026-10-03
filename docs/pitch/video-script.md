# HubMI.pl: scenariusz filmu MP4 do 3 minut

Plan montażu: **2 min 50 s**, ostatnie 10 s limitu pozostaje jako margines. Czytamy wyłącznie cytowane kwestie lektora. Tempo około 110 słów/min; pozostały czas przeznaczamy na demonstrację i plansze. Przed eksportem wykonać próbę z zegarkiem. Napisy po polsku, czytelne także bez dźwięku; eksport MP4, zalecane H.264/AAC, 1920 × 1080.

## 00:00–00:20 Problem

Obraz: slajd problemu, następnie nazwa HubMI.pl.

> Samotność, wykluczenie cyfrowe i trudny dostęp do usług wymagają lokalnych odpowiedzi. ROPS Kraków ma już blisko dwieście innowacji społecznych. Jak pomóc mieszkańcom i gminom odnaleźć tę, która pasuje do ich potrzeby? Po to zbudowaliśmy HubMI.pl.

## 00:20–00:40 Rozwiązanie

Obraz: schemat potrzeba → propozycja → współpraca. Docelowe kroki oznaczyć jako plan.

> Projektujemy cyfrowe serce Małopolskiego Hubu Innowacji Społecznych. Użytkownik opisuje problem własnymi słowami. System proponuje innowacje i wyjaśnia, dlaczego pasują. Docelowo w tym samym miejscu mieszkańcy, samorządy, organizacje i eksperci będą razem pracować nad wdrożeniem.

## 00:40–01:15 Rzeczywista demonstracja

Obraz: żądanie do API i rzeczywista odpowiedź. Powiększyć opis, tytuł, uzasadnienie i nagłówek źródła. Nie pokazywać kluczy ani danych osobowych. Strona `/match` jest obecnie szablonem, więc nagrywamy API, np. w kliencie HTTP.

> Tutaj pokazujemy działające API dopasowania. Wpisujemy: potrzebuję wsparcia w opiece nad osobą starszą. Otrzymujemy propozycje z katalogu, wynik dopasowania i krótkie uzasadnienie. Nagłówek odpowiedzi wskazuje, czy wykorzystano AI, czy dane demonstracyjne. Te dane pokazują tylko, jak działa system. Nie są zweryfikowaną biblioteką ROPS. Wynik podobieństwa nie oznacza gwarancji skuteczności rozwiązania.

## 01:15–01:40 AI i moduły

Obraz: schemat AI i mapa modułów z oznaczeniem stanu realizacji.

> Model wektorowy OpenAI pomaga odnaleźć podobne opisy. Model językowy przygotowuje uzasadnienia po polsku. Gdy wyszukiwanie zawiedzie, włącza się tryb demonstracyjny. Mamy rdzeń dopasowania; zasobnik wiedzy, kreator, tester, komunikacja i panel administratora mają obecnie strony szablonowe. Asystent kreatora pozostaje kolejnym etapem rozwoju.

## 01:40–02:00 Dostępność i skala

Obraz: klawisz Tab i odnośnik „Przejdź do treści”; następnie schemat infrastruktury.

> Celujemy w WCAG dwa jeden na poziomie AA. Szkielet zawiera polski język dokumentu i przejście do treści. Przed pilotażem sprawdzimy klawiaturę, czytniki ekranu i kontrast. Aplikacja działa na Vercel i Supabase. Czy udźwignie cały region, sprawdzimy testami obciążeniowymi.

## 02:00–02:25 Koszty i utrzymanie

Obraz: kwoty usług oraz pracy ludzi, dopisek „netto, miesięcznie, szacunek pilotażu”.

> Przy tysiącu dopasowań miesięcznie szacujemy usługi z rezerwą na AI na około sto osiemdziesiąt cztery złote netto. Z obsługą techniczną i redakcją treści budżet wynosi około dwa tysiące sto osiemdziesiąt cztery złote. Założenia i źródła są w kosztorysie. Potrzebujemy opiekuna technicznego i koordynatora katalogu.

## 02:25–02:45 Zespół i następne kroki

Obraz: rzeczywiste nazwiska i role zespołu, identyfikator HackTribe; plan pilotażu.

> Łączymy pracę nad interfejsem, API, AI i testami. Następny krok to katalog ROPS, gotowy formularz i pilotaż z mieszkańcami oraz gminami. Zmierzymy, jak trafne są propozycje i ile trwa znalezienie rozwiązania.

## 02:45–02:50 Plansza końcowa bez lektora

Obraz: nazwa projektu, rzeczywisty adres demo i repozytorium oraz kredyty: „OpenAI: text-embedding-3-small, gpt-4o-mini; Vercel AI SDK; Supabase/PostgreSQL z pgvector. Dokumentacja: pomoc OpenAI Codex”. Pełny [wykaz narzędzi](ai-credits.md) dołączyć do zgłoszenia. Nie stosować fikcyjnego adresu demo.

## Przygotowanie demonstracji

Uruchomić aplikację zgodnie z README. W kliencie HTTP wykonać `POST http://localhost:3000/api/match`, nagłówek `Content-Type: application/json`, treść:

```json
{
  "problem": "Potrzebuję wsparcia w opiece nad osobą starszą",
  "limit": 3
}
```

Pokazać rzeczywistą odpowiedź, bez obietnicy konkretnej kolejności wyników. Bez konfiguracji dostawców nagłówek `X-Match-Source` ma wartość `mock`; taki pokaz podpisujemy „tryb demonstracyjny”. Pokaz AI wymaga konfiguracji OpenAI i Supabase, migracji oraz wektorów katalogu; w nagraniu sprawdzić wartość `ai`. Jeśli generowanie uzasadnień zawiedzie, API może zwrócić dopasowania AI z uzasadnieniami szablonowymi. Sam nagłówek nie dowodzi więc użycia modelu językowego.

Przed zgłoszeniem uzupełnić nazwiska, identyfikator zespołu, adres działającego demo i makiet. Ten plik jest scenariuszem; film MP4 i PDF z konspektu trzeba nagrać i wyeksportować osobno.
