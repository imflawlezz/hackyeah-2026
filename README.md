# HubMI.pl

![CI](https://github.com/imflawlezz/hackyeah-2026/actions/workflows/ci.yml/badge.svg)

Prototype of the Małopolska Social Innovation Hub. The platform connects residents, local governments, experts, and the ROPS Kraków team: it matches social problems with existing innovations and will host a knowledge base, idea creator, innovation testing, messages, and an admin panel.

Accessibility target: WCAG 2.1 AA. Interface copy is Polish. Code, file names, and URLs are English.

## Stack

- Next.js (App Router) and React
- TypeScript (strict)
- Tailwind CSS and shadcn/ui (nova preset, Base UI)
- Supabase (`@supabase/ssr`)
- Vercel AI SDK and OpenAI
- Zod, React Hook Form, Recharts
- ESLint (`jsx-a11y` recommended), Prettier, Vitest

## Requirements

Node.js 22. From the repo root, `nvm use` reads `.nvmrc`.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Fill in `.env.local` when you wire Supabase or the assistant. The app boots without those values: `hasSupabase` is false and the match API uses local mocks. `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to the browser.

| Script                 | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Local development                         |
| `npm run build`        | Production build                          |
| `npm run start`        | Serve the production build                |
| `npm run lint`         | ESLint, including jsx-a11y                |
| `npm run typecheck`    | Next.js route types, then `tsc --noEmit`  |
| `npm test`             | Vitest                                    |
| `npm run format`       | Prettier, write changes                   |
| `npm run format:check` | Prettier, fail when files need formatting |

## Folder map

```text
src/app/(public)/          match, knowledge, ideas, test, messages, institutions, accessibility
src/app/(auth)/login/      sign-in
src/app/admin/             admin panel
src/app/api/               match (AI with mock fallback), assistant (501), embed
src/components/ui/         shadcn/ui
src/components/layout/     skip link, header, footer, accessibility toolbar
src/lib/supabase/          browser and server clients
src/lib/ai/                embeddings, batch backfill, Polish match reasons
src/lib/validators/        Zod schemas for the shared contracts
src/lib/mocks/             Polish fixtures and mockMatch
src/types/                 shared TypeScript contracts
supabase/migrations/       SQL migrations
supabase/seed/             seed data
docs/task/                 challenge brief and rules
docs/mockups/              UX mockups
docs/pitch/                pitch materials
```

Import shared code with the `@/` alias, for example `@/types`, `@/lib/mocks`, and `@/lib/validators`.

## Database

Supabase (Postgres, Frankfurt `eu-central-1`) with pgvector. Keys live in `.env.local` and the team password manager, never in git.

To set up a fresh project, open the Supabase SQL Editor and run, in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/seed/seed.sql` (22 fictional demo innovations, 8 categories; safe to re-run)

| Table         | Who can read                  | Who can write                           |
| ------------- | ----------------------------- | --------------------------------------- |
| `innovations` | everyone, including anonymous | admin                                   |
| `problems`    | author, admin                 | signed-in users insert their own; admin |
| `ideas`       | author, admin                 | signed-in users insert their own; admin |
| `feedback`    | author, admin                 | signed-in users insert their own; admin |
| `profiles`    | owner, admin                  | owner (not `role`); admin               |

A profile row is created automatically for every new auth user with role `resident`. To make someone an admin, run `update profiles set role = 'admin' where id = '<user id>';` in the SQL Editor.

### Column mapping

Columns are the snake_case form of the fields in `src/types` (`targetGroup` ↔ `target_group`, `createdAt` ↔ `created_at`, and so on). The exceptions:

| Database                                      | `src/types`             | Note                                     |
| --------------------------------------------- | ----------------------- | ---------------------------------------- |
| `ideas.essence`                               | `Idea.summary`          | different name, same field               |
| `innovations.summary`, `region`               | not in `Innovation` yet | nullable                                 |
| `innovations.embedding`, `problems.embedding` | not exposed             | `vector(1536)`, server-side only         |
| `id`                                          | `id: string`            | uuid in the database, slugs in the mocks |

### Matching

`match_innovations(query_embedding vector(1536), match_count int default 5)` returns innovation rows plus `similarity` (cosine, 1 = closest), best first. From the app: `supabase.rpc("match_innovations", { query_embedding, match_count })`.

The seed leaves `embedding` empty, and rows without an embedding are skipped, so the function returns nothing until you run `npm run embed:innovations` (needs `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`). To check it on a fresh database without storing fake vectors, run this; it fills in throwaway vectors, queries, and rolls back:

```sql
begin;
update innovations as i
set embedding = (
  select array_agg(sin(g * (1 + abs(hashtext(i.id::text)) % 997)))::vector(1536)
  from generate_series(1, 1536) as g
);
select title, similarity
from match_innovations(
  (select embedding from innovations where id = '00000000-0000-4000-8000-000000000001'),
  5
);
rollback;
```

## Design system and accessibility

The theme lives in `src/app/globals.css` as CSS variables mapped to Tailwind classes (`bg-primary`, `text-muted-foreground`, `bg-success`, `text-highlight`, `bg-navy`). Components use those classes only and never hardcode hex values.

### Palette

Ratios are WCAG 2.x contrast against white unless noted, computed by `contrastRatio` in `src/lib/a11y/contrast.ts`. `src/lib/a11y/contrast.test.ts` reads the variables from `globals.css` and fails when a text pair drops below 4.5:1 (7:1 in high contrast) or a control boundary below 3:1.

| Token                 | Hex       | Use                                                    | Contrast                                |
| --------------------- | --------- | ------------------------------------------------------ | --------------------------------------- |
| `primary`             | `#2462ad` | buttons, links, active nav, focus ring                 | 6.13:1 on white, 5.71:1 on surface      |
| `primary-hover`       | `#1d508d` | hover and pressed state of primary                     | 8.13:1                                  |
| `navy`                | `#0f4a91` | headings, footer background                            | 8.72:1 (white text on navy 8.72:1)      |
| `highlight` (crimson) | `#d10a52` | sparingly: "Nowe" badge, highlight, match score accent | 5.42:1                                  |
| `foreground`          | `#1a1a1a` | body text                                              | 17.4:1                                  |
| `muted-foreground`    | `#4d4d4d` | secondary text                                         | 8.45:1                                  |
| `muted` / `secondary` | `#f5f7fa` | cards, alternating sections (surface)                  | n/a                                     |
| `accent`              | `#e8f0fa` | hover backgrounds, with `accent-foreground` `#0f4a91`  | 7.6:1 (navy text on accent)             |
| `success`             | `#1e7f3c` | status                                                 | 5.05:1                                  |
| `warning`             | `#b45309` | status                                                 | 5.02:1                                  |
| `destructive`         | `#b91c1c` | errors                                                 | 6.47:1                                  |
| `input`               | `#6b7280` | form-control and outline-button borders                | 4.83:1 (WCAG 1.4.11 needs at least 3:1) |
| `border`              | `#d5dbe3` | decorative dividers only                               | n/a                                     |

Crimson is `highlight`, not `accent`: shadcn uses `accent` for hover backgrounds. Status is never conveyed by colour alone; pair it with an icon and text.

The screen design and Polish copy rules live in [docs/design/STYLE.md](docs/design/STYLE.md).

`components.json` retains the shadcn CLI icon setting. After each `npx shadcn@latest add`, replace emitted lucide imports with `@heroicons/react`; the ESLint restriction catches missed imports.

Typography pairs Source Serif 4 (600/700) for headings with Source Sans 3 (400/600) for body text, both self-hosted through `next/font/google` (`latin` and `latin-ext`) at an 18 px base (`html { font-size: 112.5% }`) with line-height 1.6 and navy headings.

### Font size and high contrast

Both settings sit in the "Ustawienia dostępności" toolbar at the top of the header and persist in `localStorage`.

- **Font size.** `A` / `A+` / `A++` set `data-font-size` on `<html>` to `default`, `large` or `largest`, which scales the root font size to 100%, 115% or 130% of the base. Spacing and control heights are in `rem`, so they scale too. An inline script in `<head>` applies the stored value before first paint (key `hubmi-font-size`); `parseFontSize` in `src/lib/a11y/preferences.ts` falls back to `default` for unknown values.
- **High contrast.** `next-themes` sets `data-theme` on `<html>` to `default` or `high-contrast` (key `hubmi-theme`) and applies it before first paint. The `[data-theme="high-contrast"]` block swaps the variables to a black background, white text, yellow (`#ffff00`) links and focus ring, and white borders.

Focus is a 3 px solid outline in `--ring` with a 2 px offset on every `:focus-visible` element. With "reduce motion" enabled in the OS, animations, transitions and smooth scrolling are turned off.

### Manual test checklist

- [ ] First Tab on any page shows "Przejdź do treści"; Enter moves focus to `<main>`.
- [ ] Tab through header, page and footer: every stop shows the 3 px focus ring, in order, with no trap.
- [ ] At 360 px the header shows "Menu"; it opens with Enter, Esc closes it, focus returns to the button, and following a link closes it.
- [ ] At 320 px there is no horizontal scroll; at 200% browser zoom nothing is clipped.
- [ ] `A+` / `A++` and "Wysoki kontrast" apply, survive a reload and do not flash the default on load.
- [ ] With OS "reduce motion" on, the mobile menu opens without animation.
- [ ] Lighthouse Accessibility is at least 95 and axe reports no serious or critical issues on `/`, `/match` and `/accessibility`, in both themes.
- [ ] A screen reader (NVDA or VoiceOver) announces landmarks, the current page in the nav and the pressed state of the toolbar buttons.

## Before you open a PR

```bash
npm run format && npm run lint && npm run typecheck && npm test && npm run build
```

The same commands run in GitHub Actions on every pull request to `main`.

## How to work

- One branch per issue, based on `main`.
- Open a pull request back to `main`. Do not push directly to `main`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`.
- Keep secrets out of git. Commit `.env.example` only. `.env` and `.env*.local` are ignored.
- Until the database is ready, build UI against `src/lib/mocks`.
