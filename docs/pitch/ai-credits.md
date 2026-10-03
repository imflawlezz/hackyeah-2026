# Narzędzia AI i uznanie autorstwa

Wykaz oparty na `package.json` i `src/lib/ai`, stan: 3 października 2026. W filmie i PDF zachować poniższą informację o użyciu AI.

| Narzędzie / biblioteka           | Rola w projekcie                                                                   | Autor / dostawca                             |
| -------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| `text-embedding-3-small`         | Wektory opisów potrzeb i innowacji, 1536 wymiarów                                  | OpenAI                                       |
| `gpt-4o-mini`                    | Generowanie krótkich uzasadnień dopasowania po polsku                              | OpenAI                                       |
| Vercel AI SDK (`ai`)             | Wywołania modeli, wektory i odpowiedzi o określonej strukturze                     | Vercel                                       |
| `@ai-sdk/openai`                 | Połączenie AI SDK z modelami OpenAI                                                | Vercel                                       |
| Supabase i PostgreSQL z pgvector | Przechowywanie i wyszukiwanie podobieństwa wektorów; infrastruktura dla AI         | Supabase, społeczności PostgreSQL i pgvector |
| Zod (`zod`)                      | Walidacja struktury wygenerowanych uzasadnień; biblioteka pomocnicza, nie model AI | Autorzy projektu Zod                         |
| OpenAI Codex                     | Pomoc w opracowaniu tych materiałów prezentacyjnych i kosztorysu                   | OpenAI                                       |

Wersje zależności określa `package-lock.json`; identyfikatory modeli znajdują się w `src/lib/ai/models.ts`. Modele API wymagają konfiguracji, a bez niej API dopasowania korzysta z lokalnych danych demonstracyjnych. Asystent kreatora i generowanie wizualizacji są planem, nie funkcjami dostarczonymi w tym stanie repozytorium.

Tekst do stopki PDF i końcowej planszy filmu:

> Wykorzystano modele OpenAI: text-embedding-3-small i gpt-4o-mini, Vercel AI SDK oraz Supabase/PostgreSQL z pgvector. Dokumentację prezentacyjną przygotowano z pomocą OpenAI Codex. Ocena przydatności proponowanych innowacji należy do człowieka.

Ten wykaz potwierdza użycie w kodzie i w przygotowaniu bieżącej dokumentacji; nie rekonstruuje historii pracy całego zespołu. Przed zgłoszeniem członkowie zespołu powinni dopisać inne faktycznie użyte narzędzia AI oraz materiały pochodzące od osób trzecich, jeśli występują.
