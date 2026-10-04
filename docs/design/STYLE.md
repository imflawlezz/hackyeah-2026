# HubMI.pl design and Polish copy

This is the source of truth for screens and generated text. HubMI.pl uses the visual language of [Design System Gov.pl](https://aplikacje.gov.pl/app/govpl-front-styleguide/) (KPRM, v1.0 beta), as described in the [govpl-design skill](../../.agents/skills/govpl-design/SKILL.md). Read it alongside the [challenge brief](../task/CHALLENGE.md) and the [README palette table](../../README.md#palette).

We use the visual language only. Do not copy the gov.pl logo, top bar or portal footer, and do not install `@gov-design-system-ce/*` (that is the Czech design system). No EU logos: the project is not EU-funded.

## Principles

A calm, task-first public service for Małopolska residents, NGOs, gminy, CUS/OPS, experts and ROPS. Left-aligned text, one clear primary action per view, flat surfaces and plain sections. Key information first. Prefer a concrete problem or innovation over decoration. Do not imply that prototype fixtures are proven real-world outcomes.

## Banned treatments (anti AI-look)

Remove on sight:

- gradients, gradient text, glassmorphism, backdrop blur, glowing blobs;
- grids of identical rounded cards with an icon, a title and two lines for everything;
- a large hero with a vague slogan and two CTAs; "01 / 02 / 03" markers on content that is not a sequence; all-caps or letter-spaced labels above headings;
- fade-up animation on sections, hover lifts, decorative motion;
- an arrow or decorative icon on every button or link, emoji as icons;
- large radii and heavy shadows; content cards with shadows;
- filler copy ("Odkryj moc…", "Twoja podróż zaczyna się tutaj").

## Palette and contrast

Use only the tokens in `src/app/globals.css`; never a hex value elsewhere. Token names did not change when the palette moved to Gov.pl, so components keep using `bg-primary`, `text-muted-foreground` and so on.

| Token                          | Gov.pl colour | Value     | Use                                                                             |
| ------------------------------ | ------------- | --------- | ------------------------------------------------------------------------------- |
| `primary`, `ring`              | primary       | `#0052a5` | actions, links, focus ring (7.64:1 on white)                                    |
| `primary-hover`                | primary-light | `#006cd7` | hover (white text 5.09:1)                                                       |
| `navy`                         | navy          | `#00468d` | pressed buttons, footer background                                              |
| `foreground`, `heading`        | text          | `#1b1b1b` | body text and headings                                                          |
| `muted-foreground`             | gray-700      | `#656565` | secondary text (5.83:1)                                                         |
| `input`                        | gray-600      | `#767676` | form-control borders (4.54:1, WCAG 1.4.11)                                      |
| `border`                       | gray-200      | `#dadada` | dividers only, never a control boundary                                         |
| `muted`, `secondary`, `accent` | gray-100      | `#f1f1f1` | surfaces and hover backgrounds                                                  |
| `destructive`, `highlight`     | danger-dark   | `#a7162d` | errors, irreversible actions, one restrained emphasis                           |
| `success`                      | success       | `#598527` | icons, borders and bars only (4.37:1, too low for text)                         |
| `warning`                      | warning       | `#eba828` | background only, with `warning-foreground` text; never text or an icon on white |

Rules: text at least 4.5:1, controls and meaningful icons at least 3:1, never colour as the only signal. `src/lib/a11y/contrast.test.ts` asserts the palette values and every pair. The high-contrast theme (`[data-theme="high-contrast"]`) is our own; Gov.pl has none.

## Typography

**Open Sans only**, weights 400, 600 and 700, through `next/font/google` with `latin` and `latin-ext` so Polish letters render (`ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ`). Headings and body use the same family; headings are bold.

The base is 16 px on desktop and 14 px below 700 px. A+ and A++ scale it to 115% and 130%. On mobile, Tailwind's `--spacing` unit is compensated, so spacing and 44 px touch targets keep their pixel size while text is 14 px.

The scale is 40 / 32 / 28 / 24 / 20 / 16 / 14 / 12 px, mapped onto Tailwind: `text-4xl` 40, `text-3xl` 32, `text-2xl` 28, `text-xl` 24, `text-lg` 20, `text-base` 16, `text-sm` 14, `text-xs` 12. Never below 12 px. Body line-height 1.5, headings 1.25.

Left-aligned, never justified. Sentence case in headings and buttons. No all caps for emphasis (the footer heading "ADRES" is the Gov.pl exception). Paragraphs are capped at 75 characters in `globals.css`. Do not truncate text with an ellipsis: WCAG 1.4.12 text spacing must not hide content. Headings use `text-wrap: balance` and break long Polish words instead of overflowing.

## Spacing and shape

Spacing steps: 4 / 8 / 10 / 16 / 20 / 24 / 28 / 32 / 40 / 56 / 72 px, in Tailwind `1, 2, 2.5, 4, 5, 6, 7, 8, 10, 14, 18`. The default vertical gap is 20 px. The only exception is `mt-0.5`, a 2 px optical offset that aligns an icon with the first line of text.

Radius 4 px (`--radius`). 1 px solid borders. Flat surfaces: no shadows on content; only overlays (dialogs, sheets, menus) may have one. Use `max-w-6xl` containers.

## Buttons and links

- Exactly one primary button per view: filled `primary` with white text. Views with no main action (statements, notifications) have none.
- Secondary is outline (an alternative action). Tertiary is text-style (cancel, back).
- Red (`destructive`) only for irreversible actions. Archiving can be undone, so it is not red.
- Buttons perform actions; navigation uses links.
- No decorative icons and no "→" arrows. An icon only when it adds meaning; icon-only buttons need an `aria-label`.
- A link that opens a new window ends with hidden text: a space, then `<span class="sr-only">(otwiera się w nowym oknie)</span>`. Put the space outside the span, or the accessible name loses it.
- Hover uses `primary-hover`, pressed uses `navy`. Every interactive element shows the global 3 px focus outline.

## Forms

- The label is always above the field and linked with `htmlFor`/`id`. A placeholder is never a label.
- Required fields end with a red ` *` (`RequiredMark`, `aria-hidden`) and carry `aria-required="true"` or `required`. Under the form title: `* pole wymagane` (`RequiredFieldsNote`), with the asterisk in the error colour and the words in body text. Optional fields get no marker; never write "(opcjonalnie)". Forms with no required fields show no note.
- Validate on blur (`mode: "onBlur"` in react-hook-form). The message sits under the field in `destructive` with an icon, is linked through `aria-describedby`, and the field gets `aria-invalid="true"`.
- After a failed submit, `ErrorSummary` (`src/components/forms/error-summary.tsx`) appears at the top with `role="alert"`, receives focus, and lists every error as a link that focuses its field.
- Correct `type`, `autocomplete` and `inputMode`: `autoComplete="off"` on non-account fields, `spellCheck={false}` on e-mail addresses.

## Breadcrumbs, header and footer

- Breadcrumbs (`src/components/layout/breadcrumbs.tsx`) only below the second level, under the header and above the `h1`: `<nav aria-label="Ścieżka okruszków"><ol>`, a house icon linking home with hidden "Strona główna" first, the current page as plain text with `aria-current="page"`. Hidden below 700 px.
- The skip link "Przejdź do treści głównej" is the first focusable element.
- Landmarks: `header`, `nav`, `main id="main"`, `footer`. One `h1` per page; no skipped heading levels. `<html lang="pl">`.
- The footer has a horizontal list of 7–14 links including Deklaracja dostępności, Klauzula informacyjna RODO and Polityka cookies, a copyright line, and the owner's address under the heading `ADRES`.

## Imagery

None by default. Use real content: an example problem or innovation. Any necessary photo must be licensed and specific to the service, with meaningful `alt` text (or `alt=""` when decorative). Record source and licence in [CREDITS.md](CREDITS.md). Never use AI-generated imagery.

## Heroicons

Use [Heroicons](https://heroicons.com) only; ESLint rejects `lucide-react`.

- UI and navigation: `@heroicons/react/24/outline`, `size-6`.
- Inline text and buttons: `@heroicons/react/20/solid`, `size-5`.
- Badges and dense tables: `@heroicons/react/16/solid`, `size-4`.

Decorative icons get `aria-hidden="true"`. The shadcn CLI still generates lucide imports; replace them after each add command.

## Polish copy

Follow the Gov.pl language recommendations (skill §8) and the rules below.

Use concrete Polish about social services in Małopolska: gminy, CUS/OPS, NGOs, seniors and caregivers. Write short sentences in active voice, key information first, one idea per paragraph, for a reader with 8–9 years of schooling. Address people with "Ty": "Opisz problem", "Sprawdź", "Twoja gmina", never "Państwo". Avoid gendered verb forms ("Wyślij zgłoszenie", not "Wysłałeś"). Labels are nouns; buttons are verbs. Errors explain what happened and what to do next.

Link text says where it goes; never "kliknij tutaj". Downloads show format and size: "Pobierz regulamin (PDF, 240 KB)". No marketing fluff ("rewolucyjny", "innowacyjna platforma oparta na AI", "przełomowy", "kompleksowe rozwiązanie", "z łatwością"), no exclamation marks and no emoji in the UI. Prefer full stops to long dashes. Avoid English loanwords when Polish words exist. Do not put "AI" in headings unless needed to explain data handling.

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

Generated text follows these same rules through `src/lib/ai/style.ts`. Wrap every system prompt in `withCopyStyle`; do not duplicate the guide in feature prompts. Never invent facts, numbers or names. Say plainly when data is missing. No emoji or Markdown headings unless asked. In the UI label generated output: "Tekst przygotowany automatycznie. Sprawdź go przed wysłaniem." Use plain text, never sparkles. Matching reasons describe possible relevance, not guaranteed success.

## Accessibility non-negotiables

WCAG 2.1 AA and the ustawa o dostępności cyfrowej. Preserve the skip link, the accessibility toolbar (A / A+ / A++), persistent preferences, the high-contrast theme, reduced-motion rules and the visible 3 px focus outline. Full keyboard operation; modals trap focus and return it on close. Touch targets at least 44 × 44 px. Status messages use `aria-live="polite"`. Score and status include text, not only colour. Reflow at 320 px and 200% zoom without clipping. All screens work at A++ and in high contrast.

The accessibility statement (`/accessibility`) follows the structure of "Warunki techniczne publikacji oraz struktura dokumentu elektronicznego deklaracji dostępności" v2.0: dates, compliance status, inaccessible content, preparation, facilities, keyboard shortcuts, contact, requests and complaints, mobile apps, architectural and communication accessibility.

## How to review a screen

Use the govpl-design review procedure: check skill sections 1–10 in order, report findings as `file:line — problem — fix`, then fix with minimal diffs. Then run the web-design-guidelines skill on the changed files. Where they disagree (for example Title Case or focusing the first invalid field), govpl-design wins.

- Is there exactly one primary action, with concrete Polish copy and honest prototype claims?
- Is the text Open Sans on the Gov.pl scale, left-aligned, in sentence case?
- Are tokens, 4 px radii, 1 px borders, flat surfaces and the spacing steps consistent?
- Do forms mark required fields, validate on blur and focus an error summary after submit?
- Do keyboard focus, labels, live regions and menu close/return focus work?
- Does it reflow at 320 px, A++ and 200% zoom in both themes, also with WCAG 1.4.12 text spacing?
- Do contrast tests pass, Lighthouse accessibility reach 95 and axe show no serious or critical findings?
