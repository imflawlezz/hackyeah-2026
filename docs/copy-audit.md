# Copy audit — issue #54

HubMI.pl now identifies the HackYeah team as the project operator, explains server processing in Supabase and OpenAI, and puts the main task ahead of repeated explanations. Changes cover copy and content order; routes, data contracts, form behavior and theme styles are unchanged.

## Page audit

| Page                 | Cuts made                                                                     | Duplicates removed                                              | Most important element                                |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| `/`                  | Single short H1; removed “Jak to działa” and “Dla kogo”; shorter lead         | Matching instructions and prototype disclaimer                  | “Opisz problem” immediately after H1                  |
| `/match`             | Removed lead; shortened page-level personal-data warning                      | Repeated explanation of the matching steps                      | Problem form immediately after H1                     |
| `/knowledge`         | Removed introductory explanation                                              | Explanation already present in tabs and filters                 | Library tabs and search                               |
| `/knowledge/[id]`    | Description precedes optional video                                           | Category repeated in badge and detail list                      | Innovation description; retained unique summary       |
| `/ideas`             | Shortened lead; removed unavailable PDF link and promise                      | Explanation of fields already in the wizard                     | “Dodaj pomysł”                                        |
| `/ideas/new`         | Retained task instructions and required-field hints                           | No unnecessary copy found                                       | First problem field and wizard progress               |
| `/ideas/[id]`        | Retained task data and assistant controls                                     | No static duplicate found                                       | Idea summary directly after H1                        |
| `/test`              | Removed introductory explanation; shortened empty state                       | Instructions repeated by test actions                           | Open-tests count before municipality filter           |
| `/test/[id]`         | Retained audience, test information and feedback hints                        | No unnecessary static duplicate found                           | Target group directly after H1                        |
| `/institutions`      | Removed lead                                                                  | Request to describe the institution repeated by first form step | Institution profile form                              |
| `/messages`          | Replaced generic demo banner with a specific local-storage fact               | Generic prototype explanation                                   | “Napisz wiadomość”; storage behavior remains explicit |
| `/notifications`     | Retained brief task copy and status feedback                                  | No unnecessary static duplicate found                           | Notification list and mark-all-read action            |
| `/accessibility`     | Status first; shorter limitations, controls, contact and complaints procedure | Repeated statutory citations and prototype explanations         | Partial compliance status                             |
| `/privacy`           | Concise Supabase/OpenAI/browser list; one-line notice                         | False browser-only claim and future placeholder wording         | Where data goes and why                               |
| `/cookies`           | Session cookies and browser storage; removed verbose key table                | False blanket no-third-party claim and repeated storage labels  | `sb-*` session cookies                                |
| `/admin`             | Shorter page description                                                      | Instruction repeated by “Wymaga uwagi”                          | Counts of reports and ideas awaiting review           |
| `/admin/innovations` | One-sentence description                                                      | “Add/edit” repeated by actions                                  | Innovation list and “Dodaj innowację”                 |
| `/admin/moderation`  | One-sentence confirmation information                                         | List of queues repeated by tabs                                 | Moderation queues                                     |
| `/admin/trends`      | One-sentence description                                                      | Restricted access already conveyed by the admin context         | Period selector and report count                      |

The footer address block is removed. Its single project notice reads: “HubMI.pl – prototyp zespołu HackYeah 2026 dla ROPS w Krakowie. Dane są przykładowe.” Contact remains `kontakt@hubmi.example`; legal pages identify it as a demonstration address.

## Visible word counts

Counts use rendered `main.innerText.trim().split(/\s+/u).length` after hydration, with the same mock data and default page state. Header and footer are excluded; counts include the text exposed by native select elements. These five pages have identical counts at 1280 and 360 px.

| Page             | Before | After | Reduction |
| ---------------- | -----: | ----: | --------: |
| `/`              |    231 |    86 |       63% |
| `/match`         |    147 |   119 |       19% |
| `/accessibility` |    613 |   411 |       33% |
| `/privacy`       |    177 |   122 |       31% |
| `/cookies`       |    160 |    70 |       56% |
| Total            |   1328 |   808 |       39% |

## Validation

- Node 22.23.3, Next.js 16.3.8; `npm run format`, `format:check`, lint, typecheck, all 532 tests and production build passed.
- Chromium audit: all 19 routes at 1280 and 360 px in the default theme/default font size and high contrast/A++. All 76 views have zero axe WCAG 2.1 A/AA violations and no horizontal overflow; every audited content page has one H1 and no skipped heading levels.
- Representative detail routes: `/knowledge/inn-mobile-access`, `/ideas/idea-mobility-library`, `/test/inn-mobile-access`.
- Keyboard checks cover the skip link, A++ and contrast buttons, submitting the problem, focus on results, URL state and the live test count after filtering.
- Browser validation uses local mock mode; it does not certify authenticated Supabase paths or provider behavior. The EU region is supplied by the issue, not inferred from credentials.
- No files in `src/components/ui/*` changed. Form component markup and class names are unchanged. The test-count block moved without changes to its live-region attributes or calculation.

## Shared boundaries

The existing short warning in the matching aside belongs to #52 and remains until that issue removes it; this PR shortens the warning owned by the page. Existing demo labels in the header/admin shell remain outside this issue's page-copy scope. The unique footer project notice is no longer repeated in the home or accessibility content. Legal notices retain one short prototype note each.

Accessibility statement structure and request deadlines were checked against [the official declaration guidance](https://www.gov.pl/web/dostepnosc-cyfrowa/publikowanie-deklaracji-dostepnosci) and [the official request procedure](https://www.gov.pl/web/gov/zloz-wniosek-o-zapewnienie-dostepnosci-cyfrowej-strony-internetowej-lub-aplikacji-mobilnej). The project is not presented as a public institution or an operational complaints service.

Closes #54
