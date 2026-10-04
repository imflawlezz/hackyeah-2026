# HubMI.pl

![CI](https://github.com/imflawlezz/hackyeah-2026/actions/workflows/ci.yml/badge.svg)

Prototype of the Małopolska Social Innovation Hub. The platform connects residents, local governments, experts, and the ROPS Kraków team.

Production: https://hubml-hackyeah2026-ab.vercel.app (Vercel functions in `dub1` Dublin, next to the database).

| Module (challenge brief)       | Route                         | What works                                                                                                          |
| ------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| I. Social matchmaking          | `/match`, `POST /api/match`   | embeddings + pgvector, keyword rerank, Polish reasons from the model; keyword mock when AI is unavailable           |
| II. Knowledge base             | `/knowledge`                  | regional challenges, innovation library, materials linking to rops.krakow.pl                                        |
| II. Need trends (admin only)   | `/admin/trends`               | problems from `/match` aggregated by category and week                                                              |
| III. Idea creator              | `/ideas`, `/ideas/new`        | idea card + Social Innovation Canvas wizard, drafts, AI assistant, grant application generator while a call is open |
| IV. Innovation tester          | `/test`                       | sign-up for tests (slots enforced in the database), ratings and feedback                                            |
| V. Communication               | `/messages`, `/notifications` | conversations with ROPS, experts and partners; notifications with Realtime                                          |
| VI. Admin panel                | `/admin`                      | overview, idea moderation, innovation CRUD (draft / published / archived), trends                                   |
| VII. Innovation middleman (AI) | `/institutions`               | institution profile → candidate innovations → implementation plan with costs, risks and KPIs                        |

Accessibility target: WCAG 2.1 AA. Interface copy is Polish. Code, file names, and URLs are English.

Voice input for match, idea and message forms uses server-side Polish transcription with `OPENAI_API_KEY`. Typing always remains available. See [voice input setup, limits and verification](docs/voice-input.md).

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
| `npm run demo:users`   | Create the four demo accounts in Supabase |
| `npm run format`       | Prettier, write changes                   |
| `npm run format:check` | Prettier, fail when files need formatting |

## Folder map

```text
src/app/(public)/          match, knowledge, ideas, test, messages, institutions, accessibility
src/app/(auth)/login/      sign-in
src/app/admin/             admin panel
src/app/api/               match (AI with mock fallback), institutions (candidates, plan), assistant (streams AI replies; template reply without OPENAI_API_KEY), ideas/grant-draft, embed
src/components/ui/         shadcn/ui
src/components/layout/     skip link, header, footer, accessibility toolbar
src/lib/supabase/          browser, server and admin clients
src/lib/auth/              roles, route access, session helpers, form schemas
src/components/auth/       sign-in and sign-up forms
src/proxy.ts               session refresh and route protection
src/lib/ai/                embeddings, batch backfill, Polish match reasons, prompts
src/lib/match/             match service, keyword rerank, score display
src/lib/notifications/     shared notification store (RLS client + Realtime, or browser demo store)
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

Supabase (Postgres 17, Ireland `eu-west-1`) with pgvector. `vercel.json` pins the Vercel functions to `dub1` (Dublin) so database round trips stay in the same region. Keys live in `.env.local` and the team password manager, never in git.

To set up a fresh project, open the Supabase SQL Editor and run, in order:

1. `supabase/migrations/0001_init.sql` (tables, RLS, `match_innovations`)
2. `supabase/migrations/0002_auth_profiles.sql` (sign-up role and municipality on profiles; safe to re-run)
3. `supabase/seed/seed.sql` (22 fictional demo innovations, 8 categories; safe to re-run)
4. `supabase/migrations/0003_ideas_canvas.sql` (idea canvas, demo grant call)
5. `supabase/migrations/0004_innovation_testing.sql` (innovation tester; idempotent, seeds 3 fictional tests)
6. `supabase/migrations/0005_messages_notifications.sql` (conversations, messages, notifications, triggers, Realtime publication)
7. `supabase/migrations/0006_admin_moderation.sql` (innovation status, problem scores, idea review fields, `problem_trends`)

Then, from the repo root with `.env.local` filled in:

8. `npm run embed:innovations` embeds innovations that have no vector yet (needs `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`). Add `-- --all` to re-embed every row, which is required whenever `innovationEmbeddingText` in `src/lib/ai/embeddings.ts` changes.
9. `npm run demo:users` creates the four demo accounts (see [Demo accounts](#demo-accounts)).
10. In the Supabase dashboard, set the auth URLs (see [Auth URL configuration](#auth-url-configuration)).

| Table                       | Who can read                                   | Who can write                                                                                 |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `innovations`               | everyone: `published` rows only; admin: all    | admin                                                                                         |
| `problems`                  | author, admin                                  | signed-in users insert their own; admin; the server (service role) after each `/match` search |
| `ideas`                     | author; anyone can read submitted and reviewed | signed-in users insert their own and update drafts; admin                                     |
| `feedback`                  | author, admin                                  | signed-in users insert their own; admin                                                       |
| `innovation_tests`          | everyone, including anonymous                  | admin                                                                                         |
| `test_signups`              | owner, admin                                   | signed-in users sign themselves up while the test is open and has free slots; admin           |
| `profiles`                  | owner, admin                                   | owner (not `role`); admin                                                                     |
| `grant_calls`               | everyone, including anonymous                  | admin                                                                                         |
| `grant_drafts`              | author, admin                                  | author; admin                                                                                 |
| `conversations`             | participants, admin                            | start_conversation RPC; admin                                                                 |
| `conversation_participants` | participants, admin                            | owner updates last_read_at; admin                                                             |
| `messages`                  | participants, admin                            | participants insert with their own author_id; admin                                           |
| `notifications`             | owner, admin                                   | owner updates read_at; database triggers create notifications                                 |

After `0006`, `innovations.status` is `draft`, `published` (default) or `archived`. Drafts and archived rows are hidden from public pages and, because `match_innovations` runs with the caller's rights, from matching too.

`0006` also adds `problems.best_score` (top raw cosine similarity, `null` for mock matches), `problems.source` (`ai` or `mock`), `problems.admin_note`, and `ideas.review_note`, `reviewed_at`, `reviewed_by`. `problem_trends(p_days, p_unmet_score)` returns problems per category and week with an `unmet_count`; RLS limits it to admins.

Notifications (`/notifications` and the header bell) come from one shared store in `src/lib/notifications/`. For a signed-in user it reads their rows with the RLS browser client, marks them read with `update(read_at)` and refreshes on Postgres Changes. A signed-out visitor sees a sign-in prompt when Supabase is configured. Without Supabase, the store falls back to the browser demo store. Messages use the signed-in user's RLS client and Postgres Changes, following the [Supabase Realtime guide](https://supabase.com/docs/guides/realtime/postgres-changes). With no signed-in user, three fictional conversations and two notifications are stored only in this browser and synchronized across tabs with BroadcastChannel. Demo identities are fictional. Partnership conversations remain private; there is no public partnership board.

A profile row is created automatically for every new auth user. The role and municipality come from the sign-up form, but the trigger accepts only `resident`, `jst` and `expert`; anything else, including `admin`, becomes `resident`. To make someone an admin, run `update profiles set role = 'admin' where id = '<user id>';` in the SQL Editor.

Feedback rows and sign-ups stay private, so public pages read numbers only, through two functions anyone may call: `innovation_feedback_summary(p_innovation_id)` (count, averages, rating distribution, recommend share) and `test_slots_taken(p_test_id)`. A `before insert` trigger on `test_signups` rejects a sign-up to a closed or full test (`TEST_CLOSED`, `TEST_FULL`), which the app turns into Polish messages.

### Column mapping

Columns are the snake_case form of the fields in `src/types` (`targetGroup` ↔ `target_group`, `createdAt` ↔ `created_at`, and so on). The exceptions:

| Database                                                                               | `src/types`                    | Note                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `ideas.essence`                                                                        | `Idea.summary`                 | different name, same field                                     |
| `ideas.canvas`                                                                         | `Idea.canvas`                  | jsonb                                                          |
| `ideas.municipality`                                                                   | `Idea.municipality`            | optional                                                       |
| `feedback.ease_of_use`, `would_recommend`, `what_worked`, `what_to_improve`, `test_id` | `Feedback.easeOfUse`, …        | optional, added in `0004`                                      |
| `test_signups.user_id`                                                                 | `TestSignup.userId`            | defaults to the signed-in user                                 |
| `innovations.summary`, `region`                                                        | `Innovation.summary`, `region` | optional; also in `AdminInnovation` (`src/lib/admin/types.ts`) |
| `innovations.status`, `updated_at`                                                     | `AdminInnovation`              | from `0006`                                                    |
| `problems.best_score`, `source`, `admin_note`                                          | `AdminProblem`                 | from `0006`; mappers in `src/lib/data/admin.ts`                |
| `innovations.embedding`, `problems.embedding`                                          | not exposed                    | `vector(1536)`, server-side only                               |
| `id`                                                                                   | `id: string`                   | uuid in the database, slugs in the mocks                       |

### Matching

`match_innovations(query_embedding vector(1536), match_count int default 5)` returns innovation rows plus `similarity` (cosine, 1 = closest), best first. From the app: `supabase.rpc("match_innovations", { query_embedding, match_count })`.

`src/lib/match/service.ts` asks for at least 15 nearest rows and reranks them in `src/lib/match/rerank.ts`: +0.06 when the problem's wording points to the innovation's category (stems such as "wózk", "samotn", "smartfon") and +0.015 per word shared with the title, tags or target group (at most +0.045). Similarities for short Polish texts sit close together, so this small, explainable boost decides between near ties. The stored `problems.best_score` stays the raw similarity.

Each innovation is embedded as labelled text (`Tytuł`, `Obszar` with a plain-language description of the category, `Dla kogo`, `Słowa kluczowe`, `Streszczenie`, `Opis`); see `innovationEmbeddingText`. When no AI is available, `mockMatch` scores keywords and themes, and `normalizeMockScores` maps the points onto an absolute scale capped at 95%, so results are never all shown as 100%.

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

## Authentication and roles

Supabase Auth with e-mail and password. Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` the app runs in demo mode: sign-in is disabled, every module is open and the header shows "Wersja demonstracyjna". `NEXT_PUBLIC_*` values are inlined at build time, so after changing them in Vercel, redeploy.

### Auth URL configuration

Sign-up confirmation links go to `${origin}/auth/callback?next=…`, where `origin` is the site the visitor signed up on. In Supabase → Authentication → URL Configuration:

- **Site URL**: the production URL, `https://hubml-hackyeah2026-ab.vercel.app`.
- **Redirect URLs**: `https://hubml-hackyeah2026-ab.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`, and a wildcard for Vercel previews if you test sign-up there (for example `https://*-<team-slug>.vercel.app/auth/callback`).

A callback URL that is not on the list makes Supabase fall back to the Site URL, and the visitor lands on `/login?error=callback`.

| Role       | Label in the UI             | How you get it                 |
| ---------- | --------------------------- | ------------------------------ |
| `resident` | Mieszkaniec lub organizacja | sign-up (default)              |
| `jst`      | Samorząd (JST)              | sign-up                        |
| `expert`   | Ekspert                     | sign-up                        |
| `admin`    | Administrator ROPS          | promoted by hand in SQL Editor |

Route access is defined in `src/lib/auth/access.ts` and enforced in `src/proxy.ts`, which also refreshes the session cookies:

| Route                      | Who can open it    | Otherwise                              |
| -------------------------- | ------------------ | -------------------------------------- |
| `/admin`, `/admin/*`       | admins             | `/login?next=…` or `/?error=forbidden` |
| `/messages`, `/messages/*` | any signed-in user | `/login?next=…`                        |
| `/ideas/new`               | any signed-in user | `/login?next=…`                        |
| everything else            | everyone           |                                        |

The proxy is a first check, not the security boundary. `src/app/admin/layout.tsx` and `src/app/(public)/messages/layout.tsx` repeat the check on the server, and row level security decides what each user can read and write.

In server code, use the helpers from `src/lib/auth/session.ts`:

- `getCurrentUser()` returns `{ id, email, profile }` or `null` (always `null` in demo mode).
- `requireUser(next?)` redirects logged-out visitors to `/login?next=…`.
- `requireRole(roles, next?)` also redirects the wrong role to `/?error=forbidden`.
- `isAdmin(user)`.

A role sent by the browser is never trusted: `sanitizeSignupRole` in `src/lib/auth/roles.ts` and the `handle_new_user` trigger apply the same rule. `POST /api/embed` accepts the `x-embed-secret` header or a signed-in admin session.

### Demo accounts

`npm run demo:users` creates four fictional accounts with confirmed e-mails and sets their roles, including `admin`, through the service role. It needs `SUPABASE_SERVICE_ROLE_KEY` and `DEMO_USER_PASSWORD` (at least 8 characters) in `.env.local`. The password is shared in the team password manager, never in git. Existing accounts are skipped, so the script is safe to re-run.

| E-mail                   | Role       |
| ------------------------ | ---------- |
| `resident@hubmi.example` | `resident` |
| `jst@hubmi.example`      | `jst`      |
| `expert@hubmi.example`   | `expert`   |
| `admin@hubmi.example`    | `admin`    |

## Design system and accessibility

The UI follows the visual language of [Design System Gov.pl](https://aplikacje.gov.pl/app/govpl-front-styleguide/) through the [govpl-design skill](.agents/skills/govpl-design/SKILL.md). The theme lives in `src/app/globals.css` as CSS variables mapped to Tailwind classes (`bg-primary`, `text-muted-foreground`, `bg-warning`, `bg-navy`). Components use those classes only and never hardcode hex values. The screen design and Polish copy rules live in [docs/design/STYLE.md](docs/design/STYLE.md).

### Palette

Ratios are WCAG 2.x contrast against white unless noted, computed by `contrastRatio` in `src/lib/a11y/contrast.ts`. `src/lib/a11y/contrast.test.ts` reads the variables from `globals.css`, checks that they match the Gov.pl values, and fails when a text pair drops below 4.5:1 (7:1 in high contrast) or a control boundary or status colour below 3:1.

| Token                          | Hex       | Gov.pl name   | Use                                             | Contrast                       |
| ------------------------------ | --------- | ------------- | ----------------------------------------------- | ------------------------------ |
| `primary`, `ring`              | `#0052a5` | primary       | buttons, links, active nav, focus ring          | 7.64:1, 6.76:1 on surface      |
| `primary-hover`                | `#006cd7` | primary-light | hover                                           | 5.09:1 (white text on it)      |
| `navy`                         | `#00468d` | navy          | pressed buttons, footer background              | 9.29:1 (white text on navy)    |
| `foreground`, `heading`        | `#1b1b1b` | text          | body text and headings                          | 17.22:1                        |
| `muted-foreground`             | `#656565` | gray-700      | secondary text                                  | 5.83:1, 5.16:1 on surface      |
| `input`                        | `#767676` | gray-600      | form-control and outline-button borders         | 4.54:1 (WCAG 1.4.11 needs 3:1) |
| `border`                       | `#dadada` | gray-200      | decorative dividers only                        | n/a                            |
| `muted`, `secondary`, `accent` | `#f1f1f1` | gray-100      | surfaces, hover backgrounds                     | n/a                            |
| `destructive`, `highlight`     | `#a7162d` | danger-dark   | errors, irreversible actions, one emphasis      | 7.51:1                         |
| `success`                      | `#598527` | success       | icons, borders, chart bars; never text          | 4.37:1 (3:1 for non-text)      |
| `warning`                      | `#eba828` | warning       | background only, with `warning-foreground` text | 8.34:1 (`#1b1b1b` on warning)  |

Status is never conveyed by colour alone; pair it with an icon and text. Warning yellow is never text or an icon on white.

`components.json` retains the shadcn CLI icon setting. After each `npx shadcn@latest add`, replace emitted lucide imports with `@heroicons/react`; the ESLint restriction catches missed imports.

Typography uses Open Sans only (400, 600, 700), self-hosted through `next/font/google` (`latin` and `latin-ext`). The base is 16 px on desktop and 14 px below 700 px, with the Gov.pl scale 40 / 32 / 28 / 24 / 20 / 16 / 14 / 12 px mapped onto Tailwind's `text-4xl` … `text-xs`. Body line-height is 1.5 and headings 1.25. On mobile, Tailwind's `--spacing` is compensated so spacing and 44 px targets keep their pixel size.

### Font size and high contrast

Both settings sit in the "Ustawienia dostępności" toolbar at the top of the header and persist in `localStorage`.

- **Font size.** `A` / `A+` / `A++` set `data-font-size` on `<html>` to `default`, `large` or `largest`, which scales the root font size to 100%, 115% or 130% of the base (16 px desktop, 14 px mobile). Spacing and control heights are in `rem`, so they scale too. An inline script in `<head>` applies the stored value before first paint (key `hubmi-font-size`); `parseFontSize` in `src/lib/a11y/preferences.ts` falls back to `default` for unknown values.
- **High contrast.** `next-themes` sets `data-theme` on `<html>` to `default` or `high-contrast` (key `hubmi-theme`) and applies it before first paint. The `[data-theme="high-contrast"]` block swaps the variables to a black background, white text, yellow (`#ffff00`) links and focus ring, and white borders, and sets `color-scheme: dark`. Gov.pl has no high-contrast palette; this one is ours.

Focus is a 3 px solid outline in `--ring` with a 2 px offset on every `:focus-visible` element. With "reduce motion" enabled in the OS, animations, transitions and smooth scrolling are turned off.

### Manual test checklist

- [ ] First Tab on any page shows "Przejdź do treści głównej"; Enter moves focus to `<main>`.
- [ ] Tab through header, page and footer: every stop shows the 3 px focus ring, in order, with no trap.
- [ ] At 360 px the header shows "Menu"; it opens with Enter, Esc closes it, focus returns to the button, and following a link closes it.
- [ ] At 320 px there is no horizontal scroll; at 200% browser zoom nothing is clipped.
- [ ] `A+` / `A++` and "Wysoki kontrast" apply, survive a reload and do not flash the default on load.
- [ ] With OS "reduce motion" on, the mobile menu opens without animation.
- [ ] Every form shows "* pole wymagane"; submitting it empty moves focus to the error summary, and each link in it focuses its field.
- [ ] Each view has at most one filled primary button.
- [ ] Lighthouse Accessibility is at least 95 and axe reports no serious or critical issues on every route, in both themes.
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
