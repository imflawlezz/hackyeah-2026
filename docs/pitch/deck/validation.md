# Kontrola eksportu — 4 października 2026

- PDF: 10 stron, 366 632 bajty (około 0,37 MB).
- Metadane: tytuł „HubMI.pl — prezentacja prototypu HackYeah 2026”, język `pl-PL`.
- Odczyt PDF przez pdfjs-dist: rzeczywisty tekst na każdej stronie (315–775 znaków), polskie znaki zachowane, drzewo struktury obecne na wszystkich stronach.
- Eksporter: dokładnie 10 slajdów; tytuły do 8 słów; do 3 punktów po najwyżej 12 słów. Tekst punktów: 32 px, czyli 24 pt w PDF. Open Sans osadzony lokalnie; biały papier, tekst `#1b1b1b`, akcent `#0052a5`.
- Brak przepełnienia wszystkich 10 slajdów; sprawdzono podglądy slajdów 1, 2, 3, 7, 9 i 10. Tekst ujawnienia AI zachowany w PDF.
- Scenariusz: 329 słów narracji, plan 2:58 z ostatnią planszą bez lektora. Czas wymaga potwierdzenia próbą nagrania zespołu.
- Prettier: wszystkie zmienione pliki Markdown i skrypt eksportu przechodzą kontrolę. `git diff --check` bez błędów.
- Poza `scripts/render-mockups.ts` (nowy ekran logowania, logowanie na telefonie) nie zmieniano kodu aplikacji, `package.json`, blokady zależności, kosztorysu ani wykazu AI. Narzędzia eksportu i kontroli zainstalowano tymczasowo poza aplikacją.

Klatki odświeżono po #81: widoki po zalogowaniu pochodzą z produkcji, z kont demonstracyjnych, a cztery ekrany wyszukiwania z lokalnej kompilacji bez zapisu do bazy (szczegóły w `docs/mockups/README.md`). Otwarto widoki, bez wysyłania formularzy. Wynik axe to wcześniejszy audyt lokalny z `docs/copy-audit.md`, a nie nowy test produkcji.

Slajd 9 podaje sumy z `cost.md`, slajd 10 nazwę zespołu 313Team i zdanie z `ai-credits.md`. Identyfikatora HackTribe w materiałach nie ma. Nie dostarczono MP4: zadanie obejmuje scenariusz do nagrania przez zespół. Nie przeprowadzono certyfikacji PDF/UA ani ręcznego testu PDF czytnikiem ekranu.

Źródła czcionki: [Open Sans w Google Fonts](https://fonts.google.com/specimen/Open+Sans), [licencja SIL OFL](https://github.com/google/fonts/blob/main/ofl/opensans/OFL.txt). Dwie odmiany TrueType (400, 700) pobrano z Google Fonts i dołączono z licencją do odtwarzalnego eksportu.
