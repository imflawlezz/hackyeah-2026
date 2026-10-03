# HubMI.pl design and Polish copy

This is the source of truth for screens and generated text. Read it alongside the [challenge brief](../task/CHALLENGE.md) and [README contrast table](../../README.md#palette).

## Principles

Build a calm, editorial civic service for Małopolska residents, NGOs, gminy, CUS/OPS, experts and ROPS. Use real hierarchy, left-aligned text, generous whitespace and one primary action per screen. Asymmetric layouts, such as a 7/5 hero, should help readers distinguish introduction from example. Prefer a concrete problem or innovation over decoration. Do not imply that prototype fixtures are proven real-world outcomes.

## Banned treatments

No gradient blobs or mesh backgrounds, glassmorphism, backdrop blur, emoji icons, sparkles motifs, “✨ AI-powered” labels, centred-everything heroes, three identical feature cards, stock photos, AI-generated images, pill-shaped everything or decorative animation. Loading feedback may animate only with reduced-motion support.

Also avoid: all-caps or letter-spaced labels above headings; number markers (01, 02, 03) on content that is not a real sequence; an arrow icon appended to every link or button in a list; a bordered box around every item of a list when a divided list would do.

## Palette and contrast

Use only existing tokens from `src/app/globals.css`. Primary is for actions and links; navy is for headings and the footer. Use the semantic `heading` token for headings so high contrast remains readable. Crimson `highlight` appears at most once per screen, for example a “Nowe” badge or one key number. Use the muted surface for alternating sections. Never convey status by colour alone.

| Token             | Default | Contrast on white | Usage                          |
| ----------------- | ------- | ----------------- | ------------------------------ |
| primary           | #2462ad | 6.13:1            | Actions and links              |
| primary-hover     | #1d508d | 8.13:1            | Action hover                   |
| navy / heading    | #0f4a91 | 8.72:1            | Headings; white on navy footer |
| highlight         | #d10a52 | 5.42:1            | One restrained emphasis        |
| foreground        | #1a1a1a | 17.4:1            | Body text                      |
| muted-foreground  | #4d4d4d | 8.45:1            | Secondary text                 |
| muted / secondary | #f5f7fa | Surface           | Alternating sections           |
| input             | #6b7280 | 4.83:1            | Control boundaries             |
| border            | #d5dbe3 | Decorative only   | Dividers                       |

The [full contrast table](../../README.md#palette) covers status and hover tokens. `src/lib/a11y/contrast.test.ts` enforces 4.5:1 for default text, 7:1 for high-contrast text and 3:1 for control boundaries. High contrast changes surfaces to black, text and borders to white, links and focus to yellow. Use token classes so every screen follows these settings.

## Typography

Headings use **Source Serif 4**, weights 600/700. Body uses **Source Sans 3**, weights 400/600. Both use `next/font/google`, `latin` and `latin-ext`, `display: swap`; font files are served locally after build. Verify `ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ` in both families.

Use an 18 px base and a scale near 1.25: 14 / 16 / 18 / 22 / 28 / 35 / 44 px. Express sizes in rem so A, A+ and A++ scale them. Tailwind `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl` approximate the scale at our base. Body line-height is 1.5–1.6, heading line-height 1.15–1.25. Keep reading lines around 60–75ch and balance headings with `text-wrap: balance`.

Only the loaded weights exist, so use only these classes: serif `font-semibold` or `font-bold`; sans `font-normal` or `font-semibold`. Never `font-medium` or sans `font-bold`: the first falls back to 400 and the second is synthesised. `globals.css` gives h1–h4 serif 600 and `th`, `strong`, `b` sans 600 by default. The serif is for h1–h4 and the HubMI.pl wordmark only. Field legends, definition terms, step numbers and key figures use the sans at 600. Do not tighten or widen letter-spacing. Paragraphs are capped at 75ch in `globals.css`; do not truncate text with an ellipsis, because WCAG 1.4.12 text spacing must not hide content.

## Spacing and shape

Use an 8 px reference grid: Tailwind `2` = 8 px, `4` = 16 px, `6` = 24 px, `8` = 32 px, `12` = 48 px, `16` = 64 px at the standard 16 px root. Our 18 px root and larger accessibility settings scale rem spacing proportionally. Use `max-w-6xl` containers, small 4–8 px radii, 1 px solid `border` dividers and no content-card shadows. Only overlays (dialogs and menus) may have subtle shadows. Controls and navigation targets must be at least 44 px and allow long Polish labels to wrap.

## Imagery

None by default. Use real content: an example problem or innovation. Any necessary photo must be licensed and specific to the service; simple illustrations are acceptable when useful. Record source and licence in [CREDITS.md](CREDITS.md). Never use AI-generated imagery.

## Heroicons

Use [Heroicons](https://heroicons.com), following the [React README](https://github.com/tailwindlabs/heroicons/blob/master/react/README.md):

- UI and navigation: `@heroicons/react/24/outline`, `size-6`.
- Inline text and buttons: `@heroicons/react/20/solid`, `size-5`.
- Badges and dense tables: `@heroicons/react/16/solid`, `size-4`.

Keep one style per context. Decorative icons get `aria-hidden="true"`. Icon-only buttons have a Polish `aria-label`, such as “Zamknij menu”. Navigation always has a visible text label. The shadcn CLI still generates lucide imports; replace them after each add command. ESLint rejects `lucide-react`.

## Polish copy

Use concrete Polish about social services in Małopolska: gminy, CUS/OPS, NGOs, seniors and caregivers. Write short sentences in active voice. Address residents with friendly-formal “Ty”: “Opisz problem”, “Sprawdź”. Use neutral “Ty” for institutions too: “Twoja gmina”, never “Państwo”. Labels are nouns; buttons are verbs. Errors explain what happened and what to do next.

No marketing fluff: “rewolucyjny”, “innowacyjna platforma oparta na AI”, “przełomowy”, “kompleksowe rozwiązanie”, “z łatwością”. No exclamation marks in UI. Prefer full stops to long dashes, at most one dash per paragraph. Avoid English loanwords when Polish words exist. Do not put “AI” in headings unless necessary to explain data handling.

| Context          | Do                                                            | Don't                                             |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| Headline         | Opisz, czego brakuje w Twojej okolicy.                        | Rewolucyjna platforma oparta na AI                |
| Button           | Znajdź rozwiązania                                            | Rozpocznij swoją podróż!                          |
| Empty state      | Nie znaleźliśmy rozwiązań. Zmień opis lub kategorię.          | Brak wyników                                      |
| Error            | Opis jest za krótki. Napisz co najmniej 10 znaków.            | Błąd walidacji                                    |
| Loading          | Porównujemy opis z bazą innowacji…                            | Magia AI trwa!                                    |
| Success toast    | Fiszka została zapisana. Możesz wrócić do niej później.       | Sukces!                                           |
| Generated result | Tekst przygotowany automatycznie. Sprawdź go przed wysłaniem. | AI znalazło idealne rozwiązanie!                  |
| Form hint        | Napisz, kogo dotyczy problem i czego brakuje.                 | Wprowadź kompleksowy opis sytuacji                |
| Notification     | Zespół Hubu odpowiedział na Twoją wiadomość.                  | Masz nowy update!                                 |
| Admin label      | Zgłoszenia do sprawdzenia                                     | Panel zarządzania workflow                        |
| Institution      | Sprawdź pomysły dla Twojej gminy.                             | Szanowni Państwo, odkryjcie przełomowe możliwości |

## AI-generated text

Generated text follows these same rules through `src/lib/ai/style.ts`. Wrap every system prompt in `withCopyStyle`; do not duplicate the guide in feature prompts. Never invent facts, numbers or names. Say plainly when data is missing. No emoji or Markdown headings unless asked. In the UI label generated output: “Tekst przygotowany automatycznie. Sprawdź go przed wysłaniem.” Use plain text, never sparkles. Matching reasons describe possible relevance, not guaranteed success.

## Accessibility non-negotiables

WCAG 2.1 AA. Preserve the first skip link, toolbar, persistent preferences, high contrast, reduced-motion rules and visible 3 px focus. Every control has a label. Async states use `aria-live`; errors explain recovery. Score and status include text, not only colour. Preserve result-heading focus management and keyboard menu behaviour. Reflow at 320 px and 200% zoom without clipping. All screens work at A++ and in high contrast.

## How to review a screen

- Is the main action clear, with concrete Polish copy and honest prototype claims?
- Is the hierarchy left-aligned, with useful content rather than decorative cards?
- Are tokens, font pairing, spacing and icon contexts consistent?
- Do keyboard focus, labels, live regions and menu close/return focus work?
- Does it reflow at 320 px, A++ and 200% zoom in both themes?
- Are generated output and example data labelled plainly?
- Do contrast tests pass, Lighthouse accessibility reach 95 and axe show no serious or critical findings?
