# Kreator pomysłów

1. **Pomysł** — tytuł, problem, odbiorcy i krótki opis.
2. **Wdrożenie** — opcjonalny plan działania, nowość, zasoby, partnerzy, ryzyka i miary sukcesu. Przycisk „Pomiń ten krok” przechodzi do podsumowania.
3. **Podsumowanie** — gmina (opcjonalna), etap i przegląd wpisanych odpowiedzi. Można zapisać szkic lub wysłać pomysł do Hubu.

Puste pola wdrożenia nie są zapisywane ani pokazywane na fiszce i w moderacji. Generator wniosku działa także bez wdrożenia, z przypomnieniem o jego uzupełnieniu. Stare lokalne szkice zachowują odpowiedzi; krok powyżej 2 otwiera podsumowanie. Zmiana nie wymaga migracji ani zmian RLS.

## Sprawdzenie dostępności

Lokalny build w trybie mock, Chrome, axe-core 4.10.3: 18 audytów (3 kroki × 2 motywy × 3 rozmiary tekstu) bez naruszeń WCAG 2.1 A/AA. Przy szerokości 360 px nie wystąpiło przewijanie poziome. Przejście formularza klawiaturą i zapis pomysłu z pominiętym wdrożeniem przeszły w każdej kombinacji.

Dowód: [idea-wizard-a11y.json](idea-wizard-a11y.json). Powtórzenie: uruchom lokalny serwer mock na porcie 3100, ustaw `AXE_PATH` na lokalny plik axe-core, następnie `node scripts/check-idea-wizard.mjs`. Skrypt wymaga Chrome pod standardową ścieżką Windows. Testy zapisu do bazy używają atrap; zapis w rzeczywistym Supabase nie został sprawdzony.
