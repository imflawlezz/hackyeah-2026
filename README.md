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
src/app/(public)/          match, knowledge, ideas, test, messages, institutions
src/app/(auth)/login/      sign-in
src/app/admin/             admin panel
src/app/api/               match (mock), assistant (501), embed (501)
src/components/ui/         shadcn/ui
src/components/layout/     skip link, header, footer
src/lib/supabase/          browser and server clients
src/lib/ai/                AI helpers (empty for now)
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
