# HubMI.pl: źródło prezentacji, 10 slajdów

Treść zgodna z [deck.md](deck/deck.md); eksport: [hubmi-pitch.pdf](deck/hubmi-pitch.pdf). Stan: 4 października 2026.

## 1. HubMI.pl: cyfrowe serce Hubu Innowacji

- Matchmaking z AI :: Mieszkaniec opisuje problem, AI dopasowuje innowacje z bazy wiedzy.
- 7 modułów wyzwania :: Wszystkie moduły z briefu działają w jednym prototypie.
- Cel: WCAG 2.1 AA :: Wysoki kontrast, tekst 18 px, klawiatura, wprowadzanie głosem.

Wizual: Demo bez rejestracji: cztery fikcyjne konta, jedno kliknięcie. Usługi pilotażu: 334,32 PLN netto miesięcznie. Prototyp dla Małopolskiego Hubu Innowacji Społecznych, nie usługa ROPS.

## 2. Od potrzeby do działania w jednym miejscu

- Potrzeba :: Samotność, wykluczenie cyfrowe i bariery usług wymagają lokalnych odpowiedzi.
- Wiedza :: Innowacje, pomysły i partnerzy są dziś rozproszeni.
- Działanie :: HubMI.pl łączy je: baza wiedzy, kreator, testy, wdrożenie.

Wizual: Baza demonstracyjna ma 23 fikcyjne innowacje, zamiast danych osobowych.

## 3. Jedna platforma, różne role

- Mieszkańcy :: Opisują potrzeby, rozwijają pomysły, uczestniczą w testach.
- Gminy i organizacje :: Szukają innowacji oraz planują wdrożenie.
- ROPS i eksperci :: Oceniają zgłoszenia, porządkują wiedzę, wspierają autorów.

Wizual: Trzy role wokół wspólnego katalogu; prototyp dla ROPS, nie usługa ROPS.

## 4. Od opisu do rozwiązania lub wyzwania

- Opisz problem tekstem lub głosem; AI proponuje powiązane innowacje.
- Próg trafności oddziela dopasowania od słabiej powiązanych wyników.
- Brak dobrego dopasowania? Przekaż opis jako nowe wyzwanie.

Wizual: Formularz → wyniki → nowe wyzwanie; przykład fikcyjnego problemu mieszkańca.
Klatka makiety: ../../mockups/frames/match-none-desktop.png | Brak dobrego dopasowania i możliwość zgłoszenia wyzwania.

## 5. Pomysł otrzymuje wsparcie i odpowiedź

- Fiszka i Kanwa Innowacji Społecznych porządkują pomysł.
- Asystent AI pomaga; otwarty nabór umożliwia szkic wniosku grantowego.
- Panel ROPS umożliwia ocenę i przekazanie uwagi autorowi.

Wizual: Kreator z asystentem; klatka z produkcji, fikcyjne konto mieszkańca.
Klatka makiety: ../../mockups/frames/idea-creator-desktop.png | Kreator pomysłu z formularzem i asystentem AI.

## 6. Instytucje wdrażają, mieszkańcy testują

- Instytucja otrzymuje propozycje oraz plan: koszty, ryzyka, mierniki.
- Tester obsługuje zapisy, oceny i propozycje usprawnień.
- Wiadomości i powiadomienia wspierają rozmowy z partnerami.

Wizual: Plan wdrożenia dla instytucji; klatka z produkcji.
Klatka makiety: ../../mockups/frames/institutions-plan-desktop.png | Plan wdrożenia innowacji dla instytucji.

## 7. Panel ROPS porządkuje wiedzę

- Moderacja pomysłów i odpowiedzi dla autorów.
- Trendy potrzeb agregują zgłoszenia; AI przygotowuje podsumowanie.
- Administrator aktualizuje katalog i zarządza publikacją innowacji.

Wizual: Trendy potrzeb; klatka z produkcji, fikcyjne konto administratora.
Klatka makiety: ../../mockups/frames/admin-trends-desktop.png | Panel trendów potrzeb z kategoriami i podsumowaniem.

## 8. Dostępność i zaufanie od początku

- Cel: WCAG 2.1 AA; klawiatura, wysoki kontrast, A+/A++.
- Polski interfejs inspirowany Gov.pl; baza i funkcje serwerowe w UE.
- AI wspiera człowieka; wynik wymaga oceny, dane demonstracyjne są fikcyjne.

Wizual: Wysoki kontrast. Audyt lokalny: 0 naruszeń axe w 76 widokach; to nie certyfikat WCAG. Lokalizacja bazy i serwera nie przesądza lokalizacji przetwarzania AI.
Klatka makiety: ../../mockups/frames/a11y-high-contrast-desktop.png | Interfejs HubMI.pl w wysokim kontraście.

## 9. Wdrożenie wymaga budżetu i opiekunów

- Next.js, Vercel, Supabase i OpenAI; infrastruktura bez własnego GPU.
- Pilotaż województwa: 334,32 PLN netto miesięcznie, z rezerwą 20%.
- Potrzebni: opiekun techniczny, redaktor katalogu i moderator zgłoszeń.

Wizual: Usługi 278,60 PLN, w tym AI 12,89 PLN; rezerwa 55,72 PLN. Przy dziesięciokrotnym użyciu 482,14 PLN. Kwoty bez wynagrodzeń; kurs planistyczny 1 USD = 4,00 PLN.

## 10. Zespół i droga do pilotażu

- Plan: katalog ROPS, audyt bezpieczeństwa i dostępności, pilotaż.
- Zmierzymy trafność dopasowań, czas obsługi i zrozumiałość.
- Zespół 313Team: interfejs i dostępność, API i AI, testy i materiały.

Wizual: Demo: https://hubml-hackyeah2026-ab.vercel.app · Repozytorium: https://github.com/imflawlezz/hackyeah-2026 · Makiety: https://github.com/imflawlezz/hackyeah-2026/blob/main/docs/mockups/hubmi-makiety.pdf · Konta demonstracyjne: jedno kliknięcie na stronie logowania.

Ujawnienie AI: HubMI.pl wykorzystuje modele OpenAI text-embedding-3-small, gpt-4o-mini i gpt-4o-mini-transcribe oraz Vercel AI SDK; w budowie kodu i dokumentacji pomagały Cursor i jego agenci, Claude oraz OpenAI Codex, a ocena i zatwierdzenie propozycji AI należą do człowieka.

## Powiązanie z kryteriami oceny

Tabela nie jest częścią prezentacji. Wagi: [brief, §8](../task/CHALLENGE.md).

| Slajd | Kryteria                                                   |
| ----- | ---------------------------------------------------------- |
| 1     | Wyzwanie 40%, wdrożenie 20%, dostępność 20%, materiały 10% |
| 2     | Wyzwanie 40%, interfejs 10%                                |
| 3     | Wyzwanie 40%, wdrożenie 20%                                |
| 4     | Wyzwanie 40%, dostępność 20%                               |
| 5     | Wyzwanie 40%                                               |
| 6     | Wyzwanie 40%, wdrożenie 20%                                |
| 7     | Wyzwanie 40%, wdrożenie 20%                                |
| 8     | Dostępność 20%, interfejs 10%                              |
| 9     | Wdrożenie 20%                                              |
| 10    | Wdrożenie 20%, materiały 10%                               |
