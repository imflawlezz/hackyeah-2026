# Narzędzia AI i uznanie autorstwa

Stan: **4 października 2026**. Podstawa: `package.json`, [models.ts](../../src/lib/ai/models.ts), wywołania modeli i historia współautorstwa Git. Modele aplikacji i narzędzia budowy mają różne role.

| Narzędzie / biblioteka          | Rola w projekcie                                                                                                                      | Autor / dostawca                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `text-embedding-3-small`        | Wektory potrzeb i innowacji, 1536 wymiarów; dopasowanie semantyczne i aktualizacja katalogu                                           | OpenAI                                      |
| `gpt-4o-mini`                   | Polskie uzasadnienia dopasowań, strumieniowy asystent pomysłu, szkice grantów, plany instytucji i podsumowania trendów administratora | OpenAI                                      |
| `gpt-4o-mini-transcribe`        | Transkrypcja nagrań po polsku do wprowadzania tekstu głosem przez `/api/transcribe`                                                   | OpenAI                                      |
| Vercel AI SDK (`ai`)            | Wywołania modeli, strumieniowanie, wektory i odpowiedzi o określonej strukturze                                                       | Vercel                                      |
| `@ai-sdk/openai`                | Połączenie AI SDK z OpenAI; transkrypcja korzysta z bezpośredniego żądania do API OpenAI                                              | Vercel                                      |
| Supabase, PostgreSQL i pgvector | Przechowywanie i wyszukiwanie podobieństwa wektorów; infrastruktura, nie generatywny model                                            | Supabase i społeczności PostgreSQL/pgvector |
| Zod (`zod`)                     | Walidacja żądań i struktury odpowiedzi modeli; biblioteka pomocnicza                                                                  | Autorzy Zod                                 |
| Cursor i jego agenci            | Pomoc w implementacji kodu; współautorstwo odnotowane w commitach                                                                     | Cursor / Anysphere                          |
| Claude                          | Pomoc w implementacji kodu; historia oznacza współautora jako „Claude Opus 5.5”                                                       | Anthropic                                   |
| OpenAI Codex                    | Pomoc w dokumentacji prezentacyjnej, kosztorysie i wykazie narzędzi                                                                   | OpenAI                                      |

Wersje bibliotek określa `package-lock.json`; wszystkie trzy identyfikatory modeli API są w `src/lib/ai/models.ts`. Asystent i szkic grantu są zaimplementowane. Odpowiedzi AI wymagają konfiguracji usług; część ścieżek ma lokalne dane lub szablony zastępcze. Transkrypcja wymaga OpenAI i zalogowania. Generowanie wizualizacji nie jest funkcją potwierdzoną tym wykazem.

## Potwierdzenie narzędzi budowy

Przegląd historii wykonano 04.10.2026 poleceniem `git log --format='%(trailers:key=Co-authored-by)'` z grupowaniem wpisów. Zawiera ona `Co-authored-by: Cursor <cursoragent@cursor.com>` oraz `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. To potwierdza pomoc narzędzi; nie określa wszystkich sesji, modeli wybranych w Cursor ani procentu autorstwa. Nazwa Claude jest oznaczeniem z Git, nie niezależnie zweryfikowanym identyfikatorem API. Zespół odpowiada za przegląd i dostarczenie rozwiązania.

## Zdanie do prezentacji i filmu

> HubMI.pl wykorzystuje modele OpenAI text-embedding-3-small, gpt-4o-mini i gpt-4o-mini-transcribe oraz Vercel AI SDK; w budowie kodu i dokumentacji pomagały Cursor i jego agenci, Claude oraz OpenAI Codex, a ocena i zatwierdzenie propozycji AI należą do człowieka.

Zachować ujawnienie w PDF i filmie. Koszty działania: [cost.md](cost.md). Abonamenty narzędzi programistycznych są kosztami budowy, nie obowiązkowymi usługami utrzymania aplikacji; nie wliczamy ich do pilotażu. Autorstwo zasobów graficznych i fontów jest prowadzone osobno w [CREDITS.md](../design/CREDITS.md).
