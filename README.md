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
src/app/api/               match (AI with mock fallback), assistant (501), embed
src/components/ui/         shadcn/ui
src/components/layout/     skip link, header, footer
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

## Matchmaking API

`POST /api/match` accepts `{ "problem": "samotni seniorzy na wsi", "category": "Seniorzy", "limit": 5 }`.
The trimmed problem must contain 3–2000 characters; category is optional, and the positive integer limit defaults to 5 and is capped at 10.
The response stays a bare `MatchResult[]`, for example:

```json
[
  {
    "innovation": {
      "id": "example-club",
      "title": "Klub seniora",
      "description": "Wspólne spotkania seniorów na wsi.",
      "category": "Seniorzy",
      "targetGroup": "Seniorzy na wsi",
      "tags": ["seniorzy", "spotkania"],
      "createdAt": "2026-10-03T00:00:00.000Z"
    },
    "score": 0.88,
    "reason": "Wspólne spotkania mogą pomóc ograniczyć samotność."
  }
]
```

This illustrative response uses fictional innovation data. Scores are in [0, 1], rounded to two decimals.
AI scores use cosine similarity; mock scores are divided by the highest score in the returned set, so the top mock result scores 1.
`X-Match-Source: ai | mock` identifies the source. Missing Supabase/OpenAI configuration, embedding or RPC failures, empty search results, and search timeouts fall back to local mocks (possibly an empty array) with HTTP 200.
Reason-generation failures keep AI matches and use Polish template reasons. Embeddings time out after 4 seconds, reasons after 6 seconds, and the entire search has a 7.5-second budget.
Invalid requests return Polish HTTP 400 errors. The best-effort per-instance IP limiter allows 20 requests per minute and then returns HTTP 429; production needs a shared store and trusted proxy configuration.

```bash
curl -i -X POST http://localhost:3000/api/match \
  -H 'content-type: application/json' \
  -d '{"problem":"samotni seniorzy na wsi"}'
```

For AI search, configure Supabase and `OPENAI_API_KEY`, apply the schema and `match_innovations` RPC from #4, and embed the seed data.
Search uses `text-embedding-3-small` (1536 dimensions) and at most one `gpt-4o-mini` call for the entire result set, keeping cost low; the mock path makes no paid AI calls.

Set server-only `SUPABASE_SERVICE_ROLE_KEY` and a nonempty `EMBED_SECRET` in `.env.local` to enable `POST /api/embed`.
Send the secret in `x-embed-secret`; absent/wrong secrets return 401, and missing provider configuration returns 503.
The body `{}` embeds only rows with null embeddings, `{ "all": true }` recomputes all rows, and `{ "ids": ["innovation-id"] }` recomputes selected rows (up to 500 IDs). Processing uses batches of 50 and returns `{ "count": 50 }` on success.
Completed writes remain if a later batch fails; rerun `{}` to resume missing embeddings. GET returns 405.

Alternatively, run `npm run embed:innovations` from the repository root. The script loads `.env.local`, resolves `@/` through `tsx`, prints completed counts, and exits nonzero on failure.
It embeds only missing vectors and does not require `EMBED_SECRET`. Never expose `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `EMBED_SECRET` in client code.

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
