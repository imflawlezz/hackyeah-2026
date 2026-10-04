# Prezentacja HubMI.pl

Źródło: [deck.md](deck.md). Wynik: [hubmi-pitch.pdf](hubmi-pitch.pdf). Dziesięć slajdów; eksport zachowuje tekst, znaczniki struktury, opisy obrazów, tytuł i język `pl-PL`. Czcionka Open Sans pochodzi z Google Fonts, na licencji SIL Open Font License; plik licencji jest obok czcionki.

## Odtworzenie

Z katalogu repozytorium, w PowerShell. Narzędzia pozostają w katalogu tymczasowym, bez zmian w zależnościach aplikacji:

```powershell
$pitchTools = Join-Path $env:TEMP 'hubmi-pitch-tools'
npm.cmd install --prefix $pitchTools playwright@1.63.0 pdf-lib@1.17.1 prettier@3.9.9
$env:PITCH_TOOLS = $pitchTools
node docs/pitch/deck/build.mjs
```

Wymagana przeglądarka Chrome. Dla Edge ustawić `$env:PITCH_BROWSER = 'msedge'`. Skrypt generuje także konspekt, podgląd HTML i cztery obrazy kontrolne. Obrazy kontrolne i HTML nie są materiałami zgłoszeniowymi; można wygenerować je ponownie. Slajdy 1–3 mają pod tytułem wiersz `Hasła:` ze słowami kluczowymi rozdzielonymi `|` (do pięciu haseł, każde do pięciu słów); to nazwy modułów i kryteria z briefu. Zmiany treści wprowadzać w `deck.md`, potem odtworzyć PDF i konspekt. Eksport sprawdza limity tytułów, punktów, stron, wielkość pliku, obecność czcionki i przepełnienie slajdów.

## Zakres potwierdzeń

Klatki odświeżono 4 października po #81; [pochodzenie makiet](../../mockups/README.md) opisuje, które pochodzą z produkcji, a które z lokalnej kompilacji. Statystyka dostępności pochodzi z [audytu lokalnego](../../copy-audit.md), obejmującego 76 widoków; nie dowodzi pełnej zgodności z WCAG ani działania ścieżek zalogowanych na produkcji. Konfigurację regionów opisuje README projektu. Nie deklarujemy, że przetwarzanie przez OpenAI pozostaje w UE.

Przy odświeżaniu klatek 4 października na produkcji otwarto po zalogowaniu kreator pomysłów z asystentem, pomysł z odpowiedzią ROPS, wiadomości, moderację i trendy. Logowanie jednym kliknięciem jest na stronie `/login`. Sprawdzono wyświetlanie tych widoków; nie wysyłano pomysłów, wiadomości ani decyzji moderacji. Baza wiedzy na produkcji pokazuje 23 innowacje. W materiałach nie ma haseł ani prywatnych danych.

Koszt na slajdzie 9 i zdanie o AI na slajdzie 10 pochodzą z [cost.md](../cost.md) i [ai-credits.md](../ai-credits.md); po zmianie tych plików trzeba je przenieść ręcznie. Slajd 10 podaje nazwę zespołu, 313Team. Identyfikatora HackTribe nie ma w repozytorium ani w prezentacji. Film nagrywa zespół według scenariusza; to zadanie nie dostarcza MP4.

PDF ma logiczną kolejność: tytuł, punkty, obraz z opisem, informacja o wizualizacji i numer strony. Znaczniki PDF i wynik axe nie zastępują ręcznego sprawdzenia czytnikiem ekranu.
