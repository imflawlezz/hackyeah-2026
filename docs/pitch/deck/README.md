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

Wymagana przeglądarka Chrome. Dla Edge ustawić `$env:PITCH_BROWSER = 'msedge'`. Skrypt generuje także konspekt, podgląd HTML i cztery obrazy kontrolne. Obrazy kontrolne i HTML nie są materiałami zgłoszeniowymi; można wygenerować je ponownie. Zmiany treści wprowadzać w `deck.md`, potem odtworzyć PDF i konspekt. Eksport sprawdza limity tytułów, punktów, stron, wielkość pliku, obecność czcionki i przepełnienie slajdów.

## Zakres potwierdzeń

Klatki pochodzą z #65; [pochodzenie makiet](../../mockups/README.md) rozróżnia produkcję i lokalny tryb demonstracyjny. Statystyka dostępności pochodzi z [audytu lokalnego](../../copy-audit.md), obejmującego 76 widoków; nie dowodzi pełnej zgodności z WCAG ani działania ścieżek zalogowanych na produkcji. Konfigurację regionów opisuje README projektu. Nie deklarujemy, że przetwarzanie przez OpenAI pozostaje w UE.

Odczyt produkcji 4 października potwierdził dostępność strony głównej, dopasowania, instytucji i testów. Kreator, wiadomości i trendy przekierowują do logowania. Ich implementację potwierdza bieżący kod `main`; działania po zalogowaniu nie zweryfikowano w tym zadaniu. Nie używamy prywatnych danych ani haseł do materiałów.

Koszt pozostaje oznaczony „DO UZUPEŁNIENIA” do aktualizacji #64. Stara suma nie obejmuje aktualnego zakresu AI. Zachowano ujawnienie z `ai-credits.md`; aktualizacja pełnej listy modeli i narzędzi należy do #64. Przed zgłoszeniem potrzebne są nazwa i identyfikator zespołu HackTribe. Film nagrywa zespół według scenariusza; to zadanie nie dostarcza MP4.

PDF ma logiczną kolejność: tytuł, punkty, obraz z opisem, informacja o wizualizacji i numer strony. Znaczniki PDF i wynik axe nie zastępują ręcznego sprawdzenia czytnikiem ekranu.
