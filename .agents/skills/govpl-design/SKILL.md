---
name: govpl-design
description: Use this when building or reviewing UI for HubMI.pl or any Polish public-sector web app, so it follows the Design System Gov.pl visual rules, Polish plain-language guidelines, WCAG 2.1 AA and the ustawa o dostępności cyfrowej, and avoids generic AI-looking design.
---

# Design System Gov.pl (for HubMI.pl)

Source: Design System Gov.pl v1.0 beta (KPRM), https://aplikacje.gov.pl/app/govpl-front-styleguide/
Do NOT copy the gov.pl logo, top bar or portal footer: those are only for sites hosted on gov.pl. Use the visual language, not the branding.
Do NOT use npm `@gov-design-system-ce/*`. That is the Czech design system.

## 1. Colors

| Token         | Hex                   | Use                               | Contrast on white |
| ------------- | --------------------- | --------------------------------- | ----------------- |
| primary       | `#0052a5`             | main actions, links               | 7.6:1             |
| primary-light | `#006cd7`             | hover, accents                    | 5.1:1             |
| navy          | `#00468d`             | active / pressed, info            |                   |
| text          | `#1b1b1b`             | body text                         |                   |
| gray-700      | `#656565`             | secondary text                    | 5.8:1             |
| gray-600      | `#767676`             | lightest gray allowed for text    | 4.5:1             |
| gray-400      | `#b7b7b7`             | borders only                      |                   |
| gray-200      | `#dadada`             | borders, dividers                 |                   |
| gray-100      | `#f1f1f1`             | backgrounds                       |                   |
| danger-dark   | `#a7162d`             | errors, destructive               |                   |
| danger        | `#d5233f`             | error accents                     |                   |
| warning       | `#eba828` / `#ffc605` | warnings (never as text on white) |                   |
| success       | `#598527`             | success, validation               |                   |

Rules: text contrast ≥ 4.5:1, UI components and icons ≥ 3:1. Never use color as the only signal (add an icon or text).

Tailwind (v4 `@theme` or v3 `theme.extend.colors`):

```css
@theme {
  --color-primary: #0052a5;
  --color-primary-light: #006cd7;
  --color-navy: #00468d;
  --color-text: #1b1b1b;
  --color-gray-700: #656565;
  --color-gray-600: #767676;
  --color-gray-400: #b7b7b7;
  --color-gray-200: #dadada;
  --color-gray-100: #f1f1f1;
  --color-danger-dark: #a7162d;
  --color-danger: #d5233f;
  --color-warning: #eba828;
  --color-success: #598527;
  --font-sans: "Open Sans", system-ui, sans-serif;
}
```

## 2. Typography

- Open Sans only (`next/font/google`, subsets `latin`, `latin-ext` for Polish letters). Weights 400, 600, 700.
- Base 16px desktop, 14px mobile. Scale: 40 / 32 / 28 / 24 / 20 / 16 / 14 / 12. Never below 12px.
- Line height: body 1.5, headings 1.25. Paragraph gap = 2× font size.
- Left-aligned. Never justified. No ALL CAPS for emphasis. Sentence case in headings and buttons.
- Must survive 200% browser zoom without horizontal scroll or clipped text.

## 3. Spacing

Steps: 4 / 8 / 10 / 16 / 20 / 24 / 28 / 32 / 40 / 56 / 72 px. Default vertical gap 20px.

## 4. Buttons

- Exactly ONE primary button per page/view (filled `#0052a5`, white text).
- Secondary = outline (alternative action). Tertiary = text-style (cancel / back).
- Red primary/secondary only for irreversible actions (delete, withdraw).
- Buttons perform actions; navigation uses links.
- No decorative icons, no "→" arrows. Icon only if it adds meaning; icon-only buttons need `aria-label`.
- Links that open a new window get hidden text: `<span class="sr-only">(otwiera się w nowym oknie)</span>`.
- Visible focus outline on every interactive element (e.g. `focus-visible:outline-2 outline-offset-2 outline-primary`). Works with Enter/Space.

## 5. Forms

- Label always ABOVE the field, linked with `htmlFor`/`id`. Placeholder is never a label.
- Required fields end with ` *`. Under the form title: `* Pola obowiązkowe`. Optional fields get no marker.
- Validate on blur; message under the field in `#a7162d` with an icon, linked via `aria-describedby`, field gets `aria-invalid="true"`.
- After submit / server check: error summary box at the top (`role="alert"`, focus moved to it) listing errors as links to fields.
- Use input masks where helpful (postal code `00-000`, phone). Related short fields side by side (nr domu / nr lokalu).
- Proper `autocomplete` and `type` attributes.

## 6. Breadcrumbs

- Only if the site has more than 2 levels. Top-left, under the header, above the H1.
- First item: house icon linking home (with `sr-only` "Strona główna"). Current page is plain text with `aria-current="page"`.
- `<nav aria-label="Ścieżka okruszków"><ol>…</ol></nav>`. Hide below 700px.

## 7. Layout, header and footer

- Own HubMI header: logo/name, main nav, skip link `Przejdź do treści głównej` as the first focusable element.
- Landmarks: `header`, `nav`, `main id="main"`, `footer`. One `h1` per page; no skipped heading levels.
- Footer: horizontal list of 7–14 links, must include **Deklaracja dostępności**, **Klauzula informacyjna RODO**, **Polityka cookies**, copyright. Owner address under heading `ADRES` (ROPS Kraków). EU logos only if EU-funded.
- `<html lang="pl">`.

## 8. Language (Rekomendacje językowe gov.pl)

- Address the user as "ty" ("Opisz swój problem"), not "Państwo". Avoid gendered verb forms; prefer neutral ("Wyślij zgłoszenie" over "Wysłałeś").
- Active voice. Key information first. One idea per paragraph. Target reader: 8–9 years of schooling.
- Link text says where it goes; never "kliknij tutaj" / "tutaj".
- Downloads show format and size: `Pobierz regulamin (PDF, 240 KB)`.
- No marketing hype ("rewolucyjny", "innowacyjna platforma nowej generacji"), no emoji in UI.

## 9. Accessibility (WCAG 2.1 AA + ustawa o dostępności cyfrowej)

- Alt text for meaningful images, `alt=""` for decorative ones.
- Full keyboard operation, logical focus order, no keyboard traps; modals trap focus and return it on close.
- Respect `prefers-reduced-motion`; no auto-playing motion.
- Touch targets ≥ 44×44px. Status messages via `aria-live="polite"`.
- Required page `/deklaracja-dostepnosci` (Art. 10 ustawy z 4 kwietnia 2019, Dz.U. 2023 poz. 1440), following "Warunki techniczne v2.0": https://www.gov.pl/web/dostepnosc-cyfrowa/publikowanie-deklaracji-dostepnosci (example: https://www.gov.pl/web/dostepnosc-cyfrowa/deklaracja-dostepnosci-przyklad). Include publication/update dates, compliance status, contact person, keyboard shortcuts, building accessibility.

## 10. Anti AI-look checklist (remove on sight)

- Purple/indigo gradients, glassmorphism, glowing blobs, gradient text.
- Grid of identical rounded cards with an icon + title + 2 lines for everything.
- Huge hero with vague slogan + two CTAs; "01 / 02 / 03" step markers; ALL-CAPS eyebrow labels above every heading.
- Fade-up animation on every section; "→" on every button; emoji as icons.
- `rounded-2xl` + heavy shadows everywhere. Prefer `rounded` (4px), 1px `#dadada` borders, flat surfaces.
- Filler copy ("Odkryj moc…", "Twoja podróż zaczyna się tutaj"). Replace with concrete, task-first text.

## Review procedure

When asked to review a view: check sections 1–10 in order, report findings as `file:line — problem — fix`, then apply fixes with minimal diffs. Run a contrast check for any new color pair.
