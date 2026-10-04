# Matching: relevance thresholds

`/match` compares a problem description with the innovation library and has to
say honestly when nothing fits. This page records how the two thresholds in
`src/lib/match/score.ts` were chosen.

## How a result is scored

1. `POST /api/match` embeds the description (`text-embedding-3-small`).
2. The `match_innovations` RPC returns the nearest innovations with their cosine
   similarity (the **raw similarity**).
3. `rerank()` adds a small keyword boost: +0.06 when the description names the
   innovation's category theme, and +0.015 per shared keyword up to +0.045. The
   sum is the **reranked score**. The API rounds it to two decimals.
4. The server classifies each of the top 5 on the rounded reranked score:

| Reranked score                              | Tier      | On `/match`                                                                                |
| ------------------------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| ≥ `MATCH_THRESHOLD` (0.50)                  | `match`   | Listed as a match, with a label and a percentage                                           |
| ≥ `RELATED_THRESHOLD` (0.40) and below 0.50 | `related` | Listed under "Mniej powiązane rozwiązania", no label, no percentage, no "why it fits" text |
| below 0.40                                  | none      | Not shown                                                                                  |

The response is `{ results, noGoodMatch }`. `noGoodMatch` is `true` when no
result is a `match`; the page then shows "Nie mamy jeszcze rozwiązania, które
pasuje do Twojego opisu" and invites the resident to report a new challenge.

When a category is selected and none of the nearest innovations is in it, the
answer is `noGoodMatch: true` with no results. It no longer switches to keyword
results.

## Calibration

Run on 4 October 2026 against the production library (22 seeded innovations)
with `npx tsx scripts/calibrate-match.ts`. The script is read-only: it embeds
each query, calls the RPC with the anon key and applies `rerank()`. It does not
call `POST /api/match`, so it stores no `problems` rows.

"Expect" is what a person would say: `match` when the library has an innovation
for the problem, `none` when it has not. "Matches" and "Related" count the top 5
results in each tier with the chosen thresholds.

| #   | Expect | Query                                                                                        | Category filter | Top result (category)                                    | Top 5: raw similarity → reranked score                                    | Matches | Related | Shown as      |
| --- | ------ | -------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- | ------- | ------- | ------------- |
| 1   | match  | Seniorzy w naszej wsi są samotni i nie mają z kim porozmawiać.                               | –               | Obiad przy wspólnym stole (Samotność)                    | 0.530 → 0.620; 0.479 → 0.569; 0.455 → 0.545; 0.430 → 0.445; 0.428 → 0.443 | 3       | 2       | matches       |
| 2   | match  | Starsze osoby nie umieją korzystać ze smartfona i załatwić sprawy w urzędzie przez internet. | –               | Gminny asystent cyfrowy (Wykluczenie cyfrowe)            | 0.598 → 0.673; 0.502 → 0.577; 0.505 → 0.565; 0.505 → 0.550; 0.488 → 0.503 | 5       | 0       | matches       |
| 3   | match  | Opiekuję się chorą mamą całą dobę i nie mam ani chwili odpoczynku.                           | –               | Sąsiedzka opieka wytchnieniowa (Opieka)                  | 0.464 → 0.539; 0.458 → 0.533; 0.413 → 0.488; 0.418 → 0.418; 0.364 → 0.379 | 2       | 2       | matches       |
| 4   | match  | Młodzież w gminie nie ma gdzie spędzać czasu po szkole.                                      | –               | Młodzieżowy budżet sołecki (Młodzież)                    | 0.538 → 0.613; 0.497 → 0.572; 0.474 → 0.564; 0.442 → 0.457; 0.443 → 0.443 | 3       | 2       | matches       |
| 5   | match  | Nastolatki w szkole mają stany lękowe i depresję, a do psychologa czeka się miesiącami.      | –               | Pierwsza pomoc emocjonalna w szkole (Zdrowie psychiczne) | 0.447 → 0.537; 0.407 → 0.482; 0.394 → 0.469; 0.360 → 0.435; 0.311 → 0.371 | 1       | 3       | matches       |
| 6   | match  | Osoby długotrwale bezrobotne nie mogą wrócić do pracy.                                       | –               | Warsztat naprawczy 50+ (Aktywizacja)                     | 0.502 → 0.592; 0.524 → 0.584; 0.491 → 0.491; 0.442 → 0.442; 0.410 → 0.410 | 2       | 3       | matches       |
| 7   | match  | Osoby w kryzysie bezdomności nie mają gdzie spędzić nocy zimą.                               | –               | Nocleg interwencyjny „Jedna noc” (Bezdomność)            | 0.608 → 0.698; 0.515 → 0.590; 0.446 → 0.446; 0.426 → 0.441; 0.436 → 0.436 | 2       | 3       | matches       |
| 8   | match  | Osoby niesłyszące nie mogą załatwić sprawy w urzędzie, bo nikt nie zna języka migowego.      | –               | Urząd prostym językiem (Dostępność)                      | 0.544 → 0.649; 0.424 → 0.499; 0.412 → 0.472; 0.442 → 0.457; 0.380 → 0.380 | 2       | 2       | matches       |
| 9   | match  | Opiekunowie rodzinni osób z demencją są wypaleni i potrzebują wsparcia.                      | –               | Sąsiedzka opieka wytchnieniowa (Opieka)                  | 0.526 → 0.601; 0.510 → 0.600; 0.498 → 0.573; 0.452 → 0.512; 0.449 → 0.509 | 5       | 0       | matches       |
| 10  | match  | Samotna wdowa po osiemdziesiątce nie wychodzi z domu i nikt jej nie odwiedza.                | –               | Teleopieka sąsiedzka (Samotność)                         | 0.465 → 0.540; 0.438 → 0.513; 0.398 → 0.473; 0.414 → 0.414; 0.389 → 0.404 | 2       | 3       | matches       |
| 11  | none   | Na drodze powiatowej jest dziura w jezdni.                                                   | –               | Mapa barier w gminie (Dostępność)                        | 0.406 → 0.406; 0.303 → 0.303; 0.293 → 0.293; 0.275 → 0.275; 0.262 → 0.262 | 0       | 1       | no good match |
| 12  | none   | Na dworcu kolejowym nie ma podjazdu dla wózków inwalidzkich.                                 | –               | Mobilny punkt dostępności (Dostępność)                   | 0.397 → 0.457; 0.383 → 0.443; 0.359 → 0.359; 0.343 → 0.343; 0.340 → 0.340 | 0       | 2       | no good match |
| 13  | none   | Rozkład jazdy autobusów nie jest dopasowany do pociągów.                                     | –               | Spacerowi partnerzy (Samotność)                          | 0.297 → 0.297; 0.286 → 0.286; 0.279 → 0.279; 0.278 → 0.278; 0.270 → 0.270 | 0       | 0       | no good match |
| 14  | none   | Śmieci nie są wywożone na czas.                                                              | –               | Bank czasu opiekunów (Opieka)                            | 0.338 → 0.338; 0.313 → 0.313; 0.302 → 0.302; 0.289 → 0.289; 0.283 → 0.283 | 0       | 0       | no good match |
| 15  | none   | Na naszej ulicy nie działa oświetlenie.                                                      | –               | Świetlica otwarta po lekcjach (Młodzież)                 | 0.380 → 0.380; 0.354 → 0.354; 0.349 → 0.349; 0.348 → 0.348; 0.338 → 0.338 | 0       | 0       | no good match |
| 16  | none   | Zimą powietrze jest zatrute smogiem z pieców.                                                | –               | Obiad przy wspólnym stole (Samotność)                    | 0.301 → 0.301; 0.279 → 0.279; 0.279 → 0.279; 0.279 → 0.279; 0.264 → 0.264 | 0       | 0       | no good match |
| 17  | none   | W centrum miasta brakuje miejsc parkingowych.                                                | –               | Mobilny punkt dostępności (Dostępność)                   | 0.390 → 0.390; 0.384 → 0.384; 0.349 → 0.349; 0.344 → 0.344; 0.339 → 0.339 | 0       | 0       | no good match |
| 18  | none   | Po deszczu woda zalewa piwnice na osiedlu.                                                   | –               | Obiad przy wspólnym stole (Samotność)                    | 0.352 → 0.352; 0.347 → 0.347; 0.332 → 0.332; 0.320 → 0.320; 0.309 → 0.309 | 0       | 0       | no good match |
| 19  | none   | Dziki niszczą uprawy na polach.                                                              | –               | Warsztat naprawczy 50+ (Aktywizacja)                     | 0.331 → 0.331; 0.328 → 0.328; 0.313 → 0.313; 0.303 → 0.303; 0.297 → 0.297 | 0       | 0       | no good match |
| 20  | none   | Podatek od nieruchomości jest za wysoki.                                                     | –               | Mieszkanie treningowe z asystentem (Bezdomność)          | 0.367 → 0.367; 0.349 → 0.349; 0.338 → 0.338; 0.314 → 0.314; 0.301 → 0.301 | 0       | 0       | no good match |
| 21  | none   | W przychodni kolejka do kardiologa trwa ponad rok.                                           | –               | Bank czasu opiekunów (Opieka)                            | 0.376 → 0.376; 0.353 → 0.353; 0.348 → 0.348; 0.339 → 0.339; 0.338 → 0.338 | 0       | 0       | no good match |
| 22  | none   | Seniorzy w naszej wsi są samotni i nie mają z kim porozmawiać.                               | Bezdomność      | Nocleg interwencyjny „Jedna noc” (Bezdomność)            | 0.350 → 0.350; 0.348 → 0.348                                              | 0       | 0       | no good match |

With the chosen thresholds, 22 of 22 queries are shown the way a
person would expect.

## Why 0.50 and 0.40, and why on the reranked score

| Top result     | Queries that should match (1–10) | Queries that should not (11–22) | Gap   |
| -------------- | -------------------------------- | ------------------------------- | ----- |
| Raw similarity | 0.447 – 0.608                    | 0.297 – 0.406                   | 0.041 |
| Reranked score | 0.537 – 0.698                    | 0.297 – 0.457                   | 0.080 |

- **The reranked score separates the two groups twice as well.** A real match
  nearly always names its theme, so it receives the category boost; an
  unrelated request does not. The classification therefore uses the reranked
  score, which is also the score the API already returns.
- **`MATCH_THRESHOLD` = 0.50** sits in the middle of the gap (0.457 – 0.537).
- **The suggested 0.50 on raw similarity does not work.** It would leave
  three of the ten good queries (3, 5 and 10) without any match. In this run
  the raw similarity of a good top result never exceeded 0.61.
- **`RELATED_THRESHOLD` = 0.40** keeps the loosely related results (a pothole
  → "Mapa barier w gminie", 0.406) and drops the noise: for 10 of the 12
  queries that should not match, nothing reaches 0.40 and the page shows only
  the invitation.

Limits of this calibration:

- 22 queries and a library of 22 innovations. Re-run the script when the
  library grows or `innovationEmbeddingText` changes, and adjust the constants.
- Query 12 (a ramp at the railway station) reaches 0.457 because it names the
  accessibility theme. A longer accessibility request with several shared
  keywords could cross 0.50 without a real answer in the library. The boost is
  capped at +0.105, so this needs a raw similarity of at least 0.395.
- Scores are rounded to two decimals before the comparison, so 0.495 counts as
  0.50 (query 8, second result: 0.499).

## The mock path

Without OpenAI or Supabase the keyword matcher is used. Its score is
`points / (points + 4)`, so the same constants apply: 4 points (for example the
category theme and two shared words) is 0.50 and a match, 3 points is 0.43 and
related, fewer is hidden. This was not calibrated against real queries; it is
a fallback for the demo mode.

## Admin trends: `UNMET_SCORE_THRESHOLD`

`problems.best_score` stores the **raw** top similarity, so it cannot be
compared with `MATCH_THRESHOLD` directly. `UNMET_SCORE_THRESHOLD` in
`src/lib/admin/trends.ts` is derived as `MATCH_THRESHOLD − CATEGORY_BOOST`
= 0.44: the match threshold with the boost that a real match receives taken
off. It falls inside the raw gap in the table above (0.406 – 0.447). It was
0.45 before, which counted query 5 (0.447) as unmet.

A problem is also stored with status `new`, which the trends count as unmet,
whenever `/match` answered `noGoodMatch`.

## Other callers

`matchProblem()` is also used by the idea assistant and the institution flow.
They need the nearest innovations, not a verdict, so they call it without
`hideWeak` and still receive every result (weak ones carry the tier
`related`).
