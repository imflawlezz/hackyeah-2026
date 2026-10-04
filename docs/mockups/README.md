# Makiety UX/UI

Plansza z makietami: **[hubmi-makiety.pdf](hubmi-makiety.pdf)** (17 stron, do otwarcia bez logowania). Ta sama plansza jako strona: [hubmi-makiety.html](hubmi-makiety.html).

Makiety to klatki z działającej aplikacji, a nie osobne rysunki. Każda strona planszy pokazuje jeden ekran na komputerze (1440 × 900) i na telefonie (390 × 844), z krótkim opisem i ponumerowanymi decyzjami projektowymi. Numery na klatkach odpowiadają opisom po lewej stronie.

Dane na ekranach są fikcyjne. Konta demonstracyjne mają adresy w domenie `hubmi.example`.

## Co jest na planszy

| Strona | Przepływ                             | Ekran                         | Klatki (`frames/`)         |
| ------ | ------------------------------------ | ----------------------------- | -------------------------- |
| 1      | Okładka i spis przepływów            |                               |                            |
| 2      | 1. Strona główna                     | Wejście do serwisu            | `home-*.png`               |
| 3      | 2. Znajdź rozwiązania                | Opis problemu                 | `match-form-*.png`         |
| 4      | 2. Znajdź rozwiązania                | Dobre dopasowanie             | `match-results-*.png`      |
| 5      | 2. Znajdź rozwiązania                | Brak dobrego dopasowania      | `match-none-*.png`         |
| 6      | 3. Baza wiedzy                       | Karta innowacji               | `knowledge-detail-*.png`   |
| 7      | 4. Kreator pomysłów z asystentem     | Nowy pomysł                   | `idea-creator-*.png`       |
| 8      | 5. Pomysł z odpowiedzią ROPS         | Strona pomysłu autora         | `idea-response-*.png`      |
| 9      | 6. Dla instytucji                    | Krok 1: instytucja i potrzeba | `institutions-form-*.png`  |
| 10     | 6. Dla instytucji                    | Plan wdrożenia                | `institutions-plan-*.png`  |
| 11     | 7. Testowanie innowacji              | Otwarte testy i opinie        | `testing-*.png`            |
| 12     | 8. Wiadomości                        | Rozmowy                       | `messages-*.png`           |
| 13     | 9. Panel administratora ROPS         | Moderacja                     | `admin-moderation-*.png`   |
| 14     | 9. Panel administratora ROPS         | Trendy potrzeb                | `admin-trends-*.png`       |
| 15     | 10. Dostępność: wysoki kontrast, A++ | Wysoki kontrast               | `a11y-high-contrast-*.png` |
| 16     | 10. Dostępność: wysoki kontrast, A++ | Największy tekst (A++)        | `a11y-largest-text-*.png`  |
| 17     | 11. Konta demonstracyjne             | Logowanie jednym kliknięciem  | `login-demo-*.png`         |

Każdy ekran ma dwie klatki: `-desktop.png` i `-mobile.png`. Plik `frames/frames.json` zapisuje, skąd i kiedy pochodzi każda klatka oraz gdzie stoją numery.

## Jak odtworzyć makiety

Jedno polecenie renderuje wszystkie klatki z produkcji i składa planszę:

```bash
DEMO_USER_PASSWORD=… npx tsx scripts/render-mockups.ts
```

- Hasło kont demonstracyjnych jest w menedżerze haseł zespołu. Można je też wpisać do `.env.local`, którego nie ma w repozytorium. Nie zapisuj go w żadnym pliku w repozytorium.
- Skrypt używa przeglądarki Chromium z Playwrighta. Jeśli jej nie ma, uruchom `npx playwright-core install chromium` albo wskaż zainstalowaną przeglądarkę: `MOCKUP_BROWSER=chrome` lub `MOCKUP_BROWSER=msedge`.
- Skrypt tylko czyta i wyszukuje. Nie wysyła pomysłów, wiadomości, zgłoszeń ani decyzji moderacji. Dwa wyszukiwania w „Znajdź rozwiązania” i plan dla instytucji to zwykłe zapytania do aplikacji.

Przydatne opcje:

| Opcja lub zmienna                             | Działanie                                                           |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `--only=home,match-none`                      | renderuje tylko wskazane ekrany; pozostałe klatki zostają bez zmian |
| `--board-only`                                | składa planszę z istniejących klatek, bez otwierania aplikacji      |
| `MOCKUP_BASE_URL=http://localhost:3000`       | renderuje z innego adresu niż produkcja                             |
| `MOCKUP_RESIDENT_EMAIL`, `MOCKUP_ADMIN_EMAIL` | inne konta niż `resident@hubmi.example` i `admin@hubmi.example`     |

Teksty opisów i adnotacji są w tablicy `SCREENS` w `scripts/render-mockups.ts`.

## Stan klatek w repozytorium

Wszystkie klatki powstały 4 października 2026 po scaleniu #81 (`7133548`), między 7:49 a 8:10.

- Ekrany wymagające logowania pochodzą z produkcji, z kont `resident@hubmi.example` i `admin@hubmi.example`. Widać na nich dane ze scenariusza demonstracyjnego (#80).
- Pozostałe ekrany bez wyszukiwania (strona główna, karta innowacji, instytucje, testy, wysoki kontrast, logowanie) też pochodzą z produkcji.
- Cztery ekrany z wyszukiwaniem (`match-form`, `match-results`, `match-none`, `a11y-largest-text`) pochodzą z lokalnej kompilacji tego samego commita, połączonej z tą samą bazą i OpenAI, ale bez `SUPABASE_SERVICE_ROLE_KEY`. Każde wyszukiwanie na produkcji zapisuje zgłoszenie do „Trendów potrzeb”, a bez tego klucza aplikacja niczego nie zapisuje. Dzięki temu trendy, które ogląda jury, zostały bez zmian (25 zgłoszeń z 90 dni).

Źródło każdej klatki zapisuje `frames/frames.json`. Polecenie z sekcji wyżej, uruchomione bez opcji, renderuje wszystko z produkcji i dopisuje do trendów sześć zgłoszeń (trzy ekrany z wyszukiwaniem, po dwie klatki).
