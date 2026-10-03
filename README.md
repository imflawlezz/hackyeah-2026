# HubMI.pl

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

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Fill in `.env.local` when you wire Supabase or the assistant. The app boots without those values: `hasSupabase` is false and the match API uses local mocks. `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to the browser.

| Script              | Purpose                    |
| ------------------- | -------------------------- |
| `npm run dev`       | Local development          |
| `npm run build`     | Production build           |
| `npm run start`     | Serve the production build |
| `npm run lint`      | ESLint, including jsx-a11y |
| `npm run typecheck` | Next.js route types, then `tsc --noEmit` |
| `npm test`          | Vitest                     |
| `npm run format`    | Prettier                   |

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

## Database

Supabase (Postgres, Frankfurt `eu-central-1`) with pgvector. Keys live in `.env.local` and the team password manager, never in git.

To set up a fresh project, open the Supabase SQL Editor and run, in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/seed/seed.sql` (22 fictional demo innovations, 8 categories; safe to re-run)

| Table         | Who can read            | Who can write                          |
| ------------- | ----------------------- | -------------------------------------- |
| `innovations` | everyone, including anonymous | admin                             |
| `problems`    | author, admin           | signed-in users insert their own; admin |
| `ideas`       | author, admin           | signed-in users insert their own; admin |
| `feedback`    | author, admin           | signed-in users insert their own; admin |
| `profiles`    | owner, admin            | owner (not `role`); admin              |

A profile row is created automatically for every new auth user with role `resident`. To make someone an admin, run `update profiles set role = 'admin' where id = '<user id>';` in the SQL Editor.

### Column mapping

Columns are the snake_case form of the fields in `src/types` (`targetGroup` ↔ `target_group`, `createdAt` ↔ `created_at`, and so on). The exceptions:

| Database                              | `src/types`                 | Note                                         |
| ------------------------------------- | --------------------------- | -------------------------------------------- |
| `ideas.essence`                       | `Idea.summary`              | different name, same field                   |
| `innovations.summary`, `region`       | not in `Innovation` yet     | nullable                                     |
| `innovations.embedding`, `problems.embedding` | not exposed          | `vector(1536)`, server-side only             |
| `id`                                  | `id: string`                | uuid in the database, slugs in the mocks     |

### Matching

`match_innovations(query_embedding vector(1536), match_count int default 5)` returns innovation rows plus `similarity` (cosine, 1 = closest), best first. From the app: `supabase.rpc("match_innovations", { query_embedding, match_count })`.

The seed leaves `embedding` empty, and rows without an embedding are skipped, so the function returns nothing until the embed job has run. To check it on a fresh database without storing fake vectors, run this; it fills in throwaway vectors, queries, and rolls back:

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

## How to work

- One branch per issue, based on `main`.
- Open a pull request back to `main`. Do not push directly to `main`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`.
- Keep secrets out of git. Commit `.env.example` only. `.env` and `.env*.local` are ignored.
- Until the database is ready, build UI against `src/lib/mocks`.
