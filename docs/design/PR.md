# feat: design pass with editorial look, human Polish copy and Heroicons

Closes #23

HubMI.pl now presents a calm civic service for Małopolska: a left-aligned asymmetric introduction, a concrete fixture-based example, numbered steps, regional challenges and audience descriptions. Match retains URL state, focus management, live regions and API contracts, with a wide form, practical writing tips and editorial results.

The [design and Polish copy guide](https://github.com/imflawlezz/hackyeah-2026/blob/feat/design-pass/docs/design/STYLE.md) defines the palette, Source Serif 4 / Source Sans 3 pairing, spacing, Heroicons, accessibility and review rules. Shared `withCopyStyle` rules now apply to match reasons, and generated results carry a plain review reminder. Placeholder pages clearly describe features still in preparation.

## Validation

- Node 22.23.3: clean lockfile installation; format check, lint, typecheck, 147 tests and production build.
- Lighthouse accessibility: 100 on `/`, `/match` and `/accessibility`, in both default and high-contrast themes; no failing accessibility audits.
- axe: zero WCAG violations on those pages in both themes.
- A++: no horizontal overflow at 320, 360 and 1440 px. Serif heading and sans body fonts load with Polish diacritics at A, A+ and A++.
- Keyboard: skip link first, main receives focus, mobile menu closes with Escape and returns focus, results heading receives focus after submission.
- ESLint rejects an injected `lucide-react` import. No lucide dependency remains in either manifest or lockfile.
- GitHub `ci` still needs verification after publishing this branch.

Evidence and screenshot details: [design-pass verification](https://github.com/imflawlezz/hackyeah-2026/blob/feat/design-pass/docs/screenshots/design-pass/README.md).

## Copy changes affecting tests

- Field label: `Opis problemu`.
- Minimum length: `Opis jest za krótki. Napisz co najmniej 10 znaków.`
- Empty state: `Nie znaleźliśmy rozwiązań dla tego opisu.` with the existing recovery hint.
- Mock note: `Wyniki pochodzą z przykładowej bazy. Porównujemy słowa i kategorię z Twoim opisem.`
- Generic error: `Nie udało się pobrać propozycji. Spróbuj ponownie za chwilę.`
- Request error explains checking the form instead of naming `MatchRequest`.
- Mock reasons use `Wspólne słowa z Twoim opisem` and `Wybrana przez Ciebie kategoria`.
- AI fallback reason uses `Kategoria: … Dla kogo: …`.
- New prompt tests verify the shared style block and banned wording. Banned phrases occur only in that enforcement block and its assertions, never in UI copy.

The shadcn CLI still emits lucide imports. Replace them with Heroicons after every `npx shadcn@latest add`; the new lint restriction catches omissions.

## Before / after

| Screen         | Before                                                                                                                                             | After                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home, desktop  | ![Home before](https://raw.githubusercontent.com/imflawlezz/hackyeah-2026/feat/design-pass/docs/screenshots/design-pass/before-home-desktop.png)   | ![Home after](https://raw.githubusercontent.com/imflawlezz/hackyeah-2026/feat/design-pass/docs/screenshots/design-pass/after-home-desktop.png)   |
| Match, desktop | ![Match before](https://raw.githubusercontent.com/imflawlezz/hackyeah-2026/feat/design-pass/docs/screenshots/design-pass/before-match-desktop.png) | ![Match after](https://raw.githubusercontent.com/imflawlezz/hackyeah-2026/feat/design-pass/docs/screenshots/design-pass/after-match-desktop.png) |
| Home, mobile   | ![Home before](https://raw.githubusercontent.com/imflawlezz/hackyeah-2026/feat/design-pass/docs/screenshots/design-pass/before-home-mobile.png)    | ![Home after](https://raw.githubusercontent.com/imflawlezz/hackyeah-2026/feat/design-pass/docs/screenshots/design-pass/after-home-mobile.png)    |
| Match, mobile  | ![Match before](https://raw.githubusercontent.com/imflawlezz/hackyeah-2026/feat/design-pass/docs/screenshots/design-pass/before-match-mobile.png)  | ![Match after](https://raw.githubusercontent.com/imflawlezz/hackyeah-2026/feat/design-pass/docs/screenshots/design-pass/after-match-mobile.png)  |

Please review the hierarchy, Polish copy and keyboard flow before merge. Do not merge until the required `ci` check is green.
