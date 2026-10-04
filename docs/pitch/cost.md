# HubMI.pl: miesięczny koszt i zasoby utrzymania

> Pilotaż jednego województwa: **334,32 PLN netto miesięcznie**, z rezerwą 20%, bez wynagrodzeń.
> Skala: 1000 dopasowań, 300 rozmów, 100 szkiców grantów, 50 planów, 200 minut transkrypcji i 30 podsumowań.
> AI: **12,89 PLN netto miesięcznie**; pozostałe usługi: **265,72 PLN netto**; rezerwa: **55,72 PLN netto**.
> Zespół: redakcja ROPS 16 h, moderacja 12 h, utrzymanie techniczne 8 h — **36 h miesięcznie**.
> Przy 10× użyciu: **482,14 PLN netto miesięcznie**, pod warunkiem zmieszczenia hostingu i bazy w pakietach; kurs planistyczny 1 USD = 4,00 PLN.

Kosztorys spełnia [brief, §4](../task/CHALLENGE.md). Kod i ceny sprawdzono **4 października 2026 (Europe/Warsaw)**. Wszystkie kwoty netto, bez podatków i kosztów przewalutowania. To plan budżetu, nie pomiar rachunków ani oferta.

## Demo a pilotaż

[Demo z main](https://hubml-hackyeah2026-ab.vercel.app) korzysta według informacji zespołu z mniejszych planów. Do wariantu demonstracyjnego przyjmujemy Vercel Hobby i Supabase Free (abonamenty 0 USD); nie zweryfikowano paneli rozliczeń kont. OpenAI jest płatne według użycia. Demo działa na adresie `vercel.app`; własna domena, SMTP i wspólny magazyn limitów są zasobami do przygotowania na pilotaż.

Pilotaż: jedno konto deweloperskie Vercel Pro, jeden projekt Supabase Pro z instancją Micro. [Hobby jest ograniczony do osobistego, niekomercyjnego użycia](https://vercel.com/docs/plans/hobby), dlatego dla usługi instytucjonalnej planujemy Pro. Zakładamy zmieszczenie ruchu w pakietach; należy to potwierdzić pomiarami. Supabase Pro obejmuje codzienne kopie z retencją 7 dni; opiekun techniczny musi sprawdzać odtwarzanie.

**1 USD = 4,00 PLN to kurs planistyczny**, nie kurs NBP ani banku. Domenę przeliczamy z PLN tym samym kursem. Nie zakładamy rabatów ani oszczędności z pamięci podręcznej.

## Założenia zużycia i kod

Tokeny wejścia obejmują instrukcje, dane, historię i format odpowiedzi. To szacunki na podstawie promptów, nie pomiar ani maksymalna dopuszczalna długość. Wyjścia są szacunkami; dla planu i podsumowania przyjmujemy pełny limit kodu. Liczymy wszystkie wywołania jako płatne. Odpowiedź zastępcza nie cofa opłaty za już wykonane wywołanie.

| Funkcja                                            |                         Wywołania miesięcznie | Tokeny wejścia / wyjścia na wywołanie | Podstawa                                                                                                                                                                                                                         |
| -------------------------------------------------- | --------------------------------------------: | ------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uzasadnienia dopasowań                             |                                          1000 |                            3000 / 600 | [reasons.ts](../../src/lib/ai/reasons.ts): pełne dane 5 wyników, 1–2 zdania do 220 znaków na wynik; `maxOutputTokens: 1800`. API pozwala na maks. 10 wyników.                                                                    |
| Asystent pomysłu, strumieniowy                     |               300 rozmów × 3 odpowiedzi = 900 |                            4000 / 800 | [route.ts](../../src/app/api/assistant/route.ts): kanwa, 3 innowacje, do 12 wiadomości po 2000 znaków. **Brak maxOutputTokens**; 800 to założenie.                                                                               |
| Dopasowania towarzyszące asystentowi i instytucjom |                                900 + 50 = 950 |                            2000 / 400 | Asystent wywołuje `matchProblem` przy każdej odpowiedzi; [kandydaci instytucji](../../src/app/api/institutions/candidates/route.ts) także dopasowują 3 wyniki. Zakładamy jeden wybór kandydatów na plan. Limit uzasadnień: 1800. |
| Szkic grantu                                       |                                           100 |                           5000 / 2000 | [route.ts](../../src/app/api/ideas/grant-draft/route.ts): fiszka i sekcje naboru. **Brak maxOutputTokens**; przycięcie do `maxChars` po generacji nie ogranicza rachunku.                                                        |
| Plan instytucji                                    |                                            50 |                           3000 / 2600 | [middleman.ts](../../src/lib/ai/middleman.ts): profil, innowacja, 5–6 kroków, 4–6 kosztów i ryzyka; `maxOutputTokens: 2600`.                                                                                                     |
| Podsumowanie administratora                        |                                            30 |                            3000 / 500 | [ai-summary.ts](../../src/lib/admin/ai-summary.ts): agregaty, maks. 30 zanonimizowanych fragmentów, 3–5 zdań; `maxOutputTokens: 500`.                                                                                            |
| Wektory zapytań i katalogu                         | 1950 zapytań × 200 tokenów + 100 opisów × 400 |       430 000 tokenów wejścia łącznie | [embeddings.ts](../../src/lib/ai/embeddings.ts), [backfill.ts](../../src/lib/ai/backfill.ts), `/api/embed`: 1000 + 900 + 50 zapytań.                                                                                             |
| Transkrypcja                                       |                        200 nagrań × ok. 1 min |                             200 minut | [transcribe.ts](../../src/lib/ai/transcribe.ts), `/api/transcribe`: język polski, model `gpt-4o-mini-transcribe`.                                                                                                                |

Instrukcje: [prompts.ts](../../src/lib/ai/prompts.ts). `assistant-fallback.ts` i `style.ts` nie wywołują dodatkowych modeli. PostgreSQL/pgvector jest kosztem bazy. Pierwsze wektory katalogu są kosztem jednorazowym: liczba opisów × tokeny opisu × 0,02 USD / 1 mln.

## Stawki i źródła

**Każdą cenę poniżej sprawdzono 04.10.2026.** Stawki netto:

| Usługa                                 | Stawka i źródło                                                                                                                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI `gpt-4o-mini`                   | [0,15 USD / 1 mln tokenów wejścia, 0,60 USD / 1 mln wyjścia](https://developers.openai.com/api/docs/models/gpt-4o-mini), standardowe wywołania.                                                |
| OpenAI `text-embedding-3-small`        | [0,02 USD / 1 mln tokenów wejścia](https://developers.openai.com/api/docs/models/text-embedding-3-small).                                                                                      |
| OpenAI `gpt-4o-mini-transcribe`        | [Orientacyjnie 0,003 USD / minutę](https://developers.openai.com/api/docs/pricing). Rzeczywiste rozliczenie tokenów audio może odbiegać od estymacji.                                          |
| Vercel Pro                             | [20 USD / miesiąc, jedno konto deweloperskie](https://vercel.com/pricing). Pakiet zawiera 20 USD kredytu użycia; nie odejmujemy go od abonamentu. Kolejne konta i przekroczenia płatne osobno. |
| Supabase Pro                           | [25 USD / miesiąc](https://supabase.com/pricing); kredyt obliczeniowy 10 USD pokrywa jedną instancję Micro. Bez drugiego projektu i dodatków.                                                  |
| Resend Pro, własny SMTP                | [20 USD / miesiąc, 50 000 wiadomości, bez limitu dziennego](https://resend.com/pricing). Zakładamy 1000 wiadomości uwierzytelniania, przy 10×: 10 000.                                         |
| Upstash Redis, wspólny magazyn limitów | [0,20 USD / 100 000 poleceń](https://upstash.com/pricing/redis), rozliczenie za użycie, jeden region. Budżet 100 000 poleceń; przy 10×: 1 mln. Zasób do wdrożenia.                             |
| Domena .pl, OVHcloud                   | [Odnowienie 58,99 PLN / rok](https://www.ovhcloud.com/pl/domains/tld/pl/), czyli 4,915833 PLN / miesiąc. Bez promocji pierwszego roku; dostępności `HubMI.pl` nie potwierdzono.                |

[README](../../README.md) opisuje ograniczenia wbudowanej poczty Supabase i wyłączone potwierdzanie adresu w demo. Pilotaż wymaga własnego SMTP, SPF/DKIM, ustawienia limitów wysyłki i przywrócenia potwierdzania adresu. Resend Free (0 USD, 3000 wiadomości miesięcznie, 100 dziennie; cennik sprawdzony 04.10.2026) może wystarczyć do małego pilotażu; w budżecie finansujemy Pro na skoki rejestracji.

## Miesięczny koszt pilotażu

Wzór tekstowy w USD: `liczba wywołań × (wejście × 0,15 + wyjście × 0,60) / 1 000 000`. Wektory: `430 000 × 0,02 / 1 000 000`. Głos: `200 × 0,003`. PLN = USD × 4,00. Rezerwa to 20% sumy usług na odchylenia użycia, ponowienia i drobne przekroczenia; nie obejmuje wynagrodzeń.

| Pozycja                          | USD netto / miesiąc | PLN netto / miesiąc |
| -------------------------------- | ------------------: | ------------------: |
| AI: 1000 dopasowań               |              0,8100 |                3,24 |
| AI: asystent, 900 odpowiedzi     |              0,9720 |                3,89 |
| AI: 950 dopasowań towarzyszących |              0,5130 |                2,05 |
| AI: 100 szkiców grantowych       |              0,1950 |                0,78 |
| AI: 50 planów instytucji         |              0,1005 |                0,40 |
| AI: 200 minut transkrypcji       |              0,6000 |                2,40 |
| AI: 30 podsumowań admina         |              0,0225 |                0,09 |
| AI: wektory zapytań i katalogu   |              0,0086 |                0,03 |
| **AI razem**                     |          **3,2216** |           **12,89** |
| Vercel Pro                       |             20,0000 |               80,00 |
| Supabase Pro + Micro             |             25,0000 |              100,00 |
| Resend Pro, SMTP                 |             20,0000 |               80,00 |
| Upstash Redis                    |              0,2000 |                0,80 |
| Domena .pl, odnowienie / 12      |            1,228958 |                4,92 |
| **Suma usług**                   |       **69,650558** |          **278,60** |
| Rezerwa 20%                      |           13,930112 |               55,72 |
| **Razem**                        |       **83,580670** |          **334,32** |

Sumy obliczono przed zaokrągleniem; wiersze PLN mogą różnić się od sumy o grosz. Domenę opłaca się rocznie. Wynagrodzenia, jednorazowe wdrożenie, integracje ROPS i niezależny audyt WCAG 2.1 AA wymagają osobnej wyceny.

### Wrażliwość: 10× użycie

10 000 dopasowań, 3000 rozmów po 3 odpowiedzi, 1000 szkiców, 500 planów, 2000 minut głosu, 300 podsumowań i 1000 aktualizacji katalogu: **AI 32,2160 USD (128,86 PLN) netto miesięcznie**. Redis: 2 USD (8 PLN); SMTP nadal 20 USD przy 10 000 wiadomości. Przy tych samych abonamentach i domenie suma usług wynosi 100,444958 USD; z rezerwą 20%: **120,533950 USD = 482,14 PLN netto miesięcznie**. Przy przekroczeniu pakietów Vercel/Supabase lub limitu wiadomości dochodzą dopłaty według cenników. Nie zakładamy, że 36 h pracy wystarczy przy 10× zgłoszeń.

## Zasoby ludzkie

Szacunek do weryfikacji po pierwszym miesiącu. Brief wymaga opisu zasobów; podajemy godziny bez arbitralnych stawek wynagrodzenia.

| Rola               | Godziny / miesiąc | Zakres i podstawa                                                                                                                                                                             |
| ------------------ | ----------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Redaktor ROPS      |                16 | Baza wiedzy, innowacje, nabory i źródła: 4 h tygodniowo × 4 tygodnie, przegląd zmian do 100 opisów.                                                                                           |
| Moderator          |                12 | Pomysły i problemy, spam, dane osobowe, kierowanie do ekspertów: 3 h tygodniowo × 4; do 100 spraw wymagających ręcznej oceny po ok. 7,2 min. Dopasowanie nie oznacza zgłoszenia do moderacji. |
| Opiekun techniczny |                 8 | Aktualizacje i regresje 4 h, monitoring kosztów/błędów 2 h, kopie i próba odtworzenia 2 h. Incydenty ponad ten zakres wymagają dodatkowego czasu.                                             |
| **Razem**          |            **36** | Role mogą być łączone, odpowiedzialność musi być przypisana.                                                                                                                                  |

Przed startem potrzebne są dodatkowo konfiguracja domeny, SMTP, wspólnych limitów i monitoringu oraz sprawdzenie uprawnień i dostępności. To jednorazowa praca poza miesięcznymi godzinami.

## Oszczędności i kontrola budżetu

- Zapisywać uzasadnienia w pamięci podręcznej według problemu, wersji katalogu i modelu; ograniczyć ponowne dopasowania w rozmowie. Oszczędności nie są odjęte od kalkulacji.
- Używać małych modeli i krótkich odpowiedzi; zmianę modelu poprzedzać oceną polskich odpowiedzi i trafności. Obecnie tekst generuje już `gpt-4o-mini`.
- Wdrożyć wspólne limity użytkowników i twardy miesięczny licznik wydatków AI, np. **10 USD (40 PLN) dla pilotażu**, blokujący nowe płatne wywołania po wykorzystaniu. Wariant 10× wymaga podniesienia budżetu. Dodać limity wyjścia asystenta i grantu oraz mierzyć tokeny.
- Obecne limity są w pamięci instancji: dopasowanie 20/min/IP, asystent 15/min/IP, grant i plan 5/min/IP, kandydaci 20/min/IP, głos 5/min/użytkownik i 60/min/instancję, podsumowanie admina 5/10 min. **Nie są globalnym limitem wydatków**: restart i wiele instancji osłabiają ochronę. Redis i miesięczny licznik są pracą przed pilotażem, nie dostarczoną funkcją.
- Przeliczać wektory tylko zmienionych opisów i zachować odpowiedzi zastępcze. Bez AI transkrypcja nie działa; pozostaje wpisanie tekstu.
