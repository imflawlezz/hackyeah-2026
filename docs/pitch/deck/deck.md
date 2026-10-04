# Potrzeby czekają na lokalne rozwiązania

- Samotność, wykluczenie cyfrowe i bariery usług wymagają lokalnych odpowiedzi.
- Wiedza, pomysły i partnerzy są rozproszeni.
- Mieszkaniec potrzebuje prostej drogi od problemu do działania.

Wizual: Schemat: potrzeba → wiedza → współpraca.

---

# HubMI.pl łączy potrzeby z działaniem

- HubMI.pl łączy potrzeby społeczne, innowacje i współpracę w jednym miejscu.
- Działający prototyp dla Małopolskiego Hubu Innowacji Społecznych.
- Baza demonstracyjna: 22 fikcyjne innowacje, zamiast danych osobowych.

Wizual: Strona główna prototypu; makieta z produkcji.
Obraz: ../../mockups/frames/home-desktop.png | Strona główna HubMI.pl z wejściami do modułów.

---

# Jedna platforma, różne role

- Mieszkańcy: opisują potrzeby, rozwijają pomysły, uczestniczą w testach.
- Gminy i organizacje: szukają innowacji oraz planują wdrożenie.
- ROPS i eksperci: oceniają zgłoszenia, porządkują wiedzę, wspierają autorów.

Wizual: Trzy role wokół wspólnego katalogu; prototyp dla ROPS, nie usługa ROPS.

---

# Od opisu do rozwiązania lub wyzwania

- Opisz problem tekstem lub głosem; AI proponuje powiązane innowacje.
- Próg trafności oddziela dopasowania od słabiej powiązanych wyników.
- Brak dobrego dopasowania? Przekaż opis jako nowe wyzwanie.

Wizual: Formularz → wyniki → nowe wyzwanie; przykład fikcyjnego problemu mieszkańca.
Obraz: ../../mockups/frames/match-none-desktop.png | Brak dobrego dopasowania i możliwość zgłoszenia wyzwania.

---

# Pomysł otrzymuje wsparcie i odpowiedź

- Fiszka i Kanwa Innowacji Społecznych porządkują pomysł.
- Asystent AI pomaga; otwarty nabór umożliwia szkic wniosku grantowego.
- Panel ROPS umożliwia ocenę i przekazanie uwagi autorowi.

Wizual: Kreator z asystentem; makieta z lokalnego trybu demonstracyjnego.
Obraz: ../../mockups/frames/idea-creator-desktop.png | Kreator pomysłu z formularzem i asystentem AI.

---

# Instytucje wdrażają, mieszkańcy testują

- Instytucja otrzymuje propozycje oraz plan: koszty, ryzyka, mierniki.
- Tester obsługuje zapisy, oceny i propozycje usprawnień.
- Wiadomości i powiadomienia wspierają rozmowy z partnerami.

Wizual: Plan wdrożenia dla instytucji; makieta prototypu.
Obraz: ../../mockups/frames/institutions-plan-desktop.png | Plan wdrożenia innowacji dla instytucji.

---

# Panel ROPS porządkuje wiedzę

- Moderacja pomysłów i odpowiedzi dla autorów.
- Trendy potrzeb agregują zgłoszenia; AI przygotowuje podsumowanie.
- Administrator aktualizuje katalog i zarządza publikacją innowacji.

Wizual: Trendy potrzeb; makieta z lokalnego trybu demonstracyjnego.
Obraz: ../../mockups/frames/admin-trends-desktop.png | Panel trendów potrzeb z kategoriami i podsumowaniem.

---

# Dostępność i zaufanie od początku

- Cel: WCAG 2.1 AA; klawiatura, wysoki kontrast, A+/A++.
- Polski interfejs inspirowany Gov.pl; baza i funkcje serwerowe w UE.
- AI wspiera człowieka; wynik wymaga oceny, dane demonstracyjne są fikcyjne.

Wizual: Wysoki kontrast. Audyt lokalny: 0 naruszeń axe w 76 widokach; to nie certyfikat WCAG. Lokalizacja bazy i serwera nie przesądza lokalizacji przetwarzania AI.
Obraz: ../../mockups/frames/a11y-high-contrast-desktop.png | Interfejs HubMI.pl w wysokim kontraście.

---

# Wdrożenie wymaga budżetu i opiekunów

- Next.js, Vercel, Supabase i OpenAI; infrastruktura bez własnego GPU.
- DO UZUPEŁNIENIA: miesięczny koszt pilotażu po aktualizacji #64.
- Potrzebni: opiekun techniczny, redaktor katalogu i moderator zgłoszeń.

Wizual: Stos technologiczny → koszty usług → godziny obsługi. Kosztorys z 3 października nie obejmuje obecnych modułów AI; nie jest aktualnym budżetem.

---

# Zespół i droga do pilotażu

- Plan: katalog ROPS, audyt bezpieczeństwa i dostępności, pilotaż.
- Zmierzymy trafność dopasowań, czas obsługi i zrozumiałość.
- Zespół: interfejs i dostępność, API i AI, testy i materiały.

Wizual: Demo: https://hubml-hackyeah2026-ab.vercel.app · Repozytorium: https://github.com/imflawlezz/hackyeah-2026 · Makiety: https://github.com/imflawlezz/hackyeah-2026/blob/main/docs/mockups/hubmi-makiety.pdf · DO UZUPEŁNIENIA: nazwa i identyfikator zespołu HackTribe.

Ujawnienie AI: Wykorzystano modele OpenAI: text-embedding-3-small i gpt-4o-mini, Vercel AI SDK oraz Supabase/PostgreSQL z pgvector. Dokumentację prezentacyjną przygotowano z pomocą OpenAI Codex. Ocena przydatności proponowanych innowacji należy do człowieka.
