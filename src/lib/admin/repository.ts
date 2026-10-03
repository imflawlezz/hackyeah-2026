import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { AdminAccess } from "@/lib/auth/admin";
import { getDemoStore } from "@/lib/admin/demo-store";
import {
  isUnmet,
  UNMET_SCORE_THRESHOLD,
  type TrendProblem,
} from "@/lib/admin/trends";
import type {
  AdminIdea,
  AdminInnovation,
  AdminProblem,
} from "@/lib/admin/types";
import {
  ADMIN_IDEA_COLUMNS,
  ADMIN_INNOVATION_COLUMNS,
  ADMIN_PROBLEM_COLUMNS,
  toAdminIdea,
  toAdminInnovation,
  toAdminProblem,
  type AdminIdeaRow,
  type AdminInnovationRow,
  type AdminProblemRow,
} from "@/lib/data/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Server code only. Raw problem and idea texts are read only for admin and demo
// modes; preview mode gets published innovations and aggregates.

export const MIGRATION_NOTICE =
  "Baza nie ma jeszcze zmian z migracji 0006. Uruchom plik supabase/migrations/0006_admin_moderation.sql w SQL Editor projektu HubMI. Do tego czasu statusy i moderacja nie zapisują się.";
export const LOAD_ERROR =
  "Nie udało się wczytać danych z bazy. Odśwież stronę za chwilę.";

const LEGACY_INNOVATION_COLUMNS =
  "id, title, summary, description, category, target_group, region, tags, video_url, image_url, created_at";
const LEGACY_PROBLEM_COLUMNS = "id, description, category, status, created_at";
const LEGACY_IDEA_COLUMNS =
  "id, title, essence, target_group, stage, status, created_at";
const TREND_COLUMNS = "category, created_at, status, best_score, description";
const LEGACY_TREND_COLUMNS = "category, created_at, status, description";
const TREND_ROW_LIMIT = 5000;
const DAY_MS = 86_400_000;

export type Loaded<T> = { data: T; notice: string | null };

function isMissingColumn(error: PostgrestError | null): boolean {
  return Boolean(
    error &&
    (error.code === "42703" ||
      error.code === "PGRST204" ||
      /column .* does not exist/i.test(error.message)),
  );
}

/** Runs `query(columns)`; on a pre-0006 schema retries with `legacyColumns`. */
async function selectRows<Row>(
  query: (
    columns: string,
  ) => PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  columns: string,
  legacyColumns: string | null,
): Promise<Loaded<Row[]> & { failed: boolean }> {
  const first = await query(columns);
  if (!first.error) {
    return { data: (first.data ?? []) as Row[], notice: null, failed: false };
  }
  if (legacyColumns && isMissingColumn(first.error)) {
    const second = await query(legacyColumns);
    if (!second.error) {
      return {
        data: (second.data ?? []) as Row[],
        notice: MIGRATION_NOTICE,
        failed: false,
      };
    }
  }
  return { data: [], notice: LOAD_ERROR, failed: true };
}

async function missingEmbeddingIds(
  client: SupabaseClient,
): Promise<Set<string>> {
  const { data } = await client
    .from("innovations")
    .select("id")
    .is("embedding", null);
  return new Set((data ?? []).map((row: { id: string }) => row.id));
}

async function readInnovations(
  client: SupabaseClient,
  publishedOnly: boolean,
): Promise<Loaded<AdminInnovation[]>> {
  const result = await selectRows<AdminInnovationRow>(
    (columns) => {
      const query = client.from("innovations").select(columns).order("title");
      return publishedOnly && columns === ADMIN_INNOVATION_COLUMNS
        ? query.eq("status", "published")
        : query;
    },
    ADMIN_INNOVATION_COLUMNS,
    LEGACY_INNOVATION_COLUMNS,
  );
  if (result.failed) return { data: [], notice: result.notice };
  const missing = await missingEmbeddingIds(client);
  return {
    data: result.data.map((row) =>
      toAdminInnovation(row, !missing.has(row.id)),
    ),
    notice: result.notice,
  };
}

export async function listInnovations(
  access: AdminAccess,
): Promise<Loaded<AdminInnovation[]>> {
  if (access.mode === "demo") {
    return { data: [...getDemoStore().innovations], notice: null };
  }
  const client = await createClient();
  if (!client || access.mode === "denied")
    return { data: [], notice: LOAD_ERROR };
  // Preview uses the visitor's RLS client, which only sees published rows after 0006.
  return readInnovations(client, access.mode === "preview");
}

export async function getInnovation(
  access: AdminAccess,
  id: string,
): Promise<Loaded<AdminInnovation | null>> {
  if (access.mode === "demo") {
    return {
      data: getDemoStore().innovations.find((item) => item.id === id) ?? null,
      notice: null,
    };
  }
  if (access.mode !== "admin") return { data: null, notice: null };
  const client = await createClient();
  if (!client) return { data: null, notice: LOAD_ERROR };
  const result = await selectRows<AdminInnovationRow>(
    (columns) =>
      client.from("innovations").select(columns).eq("id", id).limit(1),
    ADMIN_INNOVATION_COLUMNS,
    LEGACY_INNOVATION_COLUMNS,
  );
  const row = result.data[0];
  if (!row) return { data: null, notice: result.notice };
  const missing = await missingEmbeddingIds(client);
  return {
    data: toAdminInnovation(row, !missing.has(row.id)),
    notice: result.notice,
  };
}

export async function listCategories(access: AdminAccess): Promise<string[]> {
  const { data } = await listInnovations(access);
  return [...new Set(data.map(({ category }) => category))].sort((a, b) =>
    a.localeCompare(b, "pl"),
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface Overview {
  newProblems7d: number | null;
  unmetProblems7d: number | null;
  submittedIdeas: number | null;
  published: number | null;
  drafts: number | null;
  withoutEmbedding: number | null;
}

async function count(
  build: () => PromiseLike<{
    count: number | null;
    error: PostgrestError | null;
  }>,
): Promise<number | null> {
  try {
    const { count: value, error } = await build();
    return error ? null : value;
  } catch {
    return null;
  }
}

export async function getOverview(
  access: AdminAccess,
  now = new Date(),
): Promise<Loaded<Overview>> {
  const since = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  if (access.mode === "demo") {
    const store = getDemoStore();
    const recent = store.problems.filter(({ createdAt }) => createdAt >= since);
    return {
      data: {
        newProblems7d: recent.length,
        unmetProblems7d: recent.filter(isUnmet).length,
        submittedIdeas: store.ideas.filter(
          ({ status }) => status === "submitted",
        ).length,
        published: store.innovations.filter(
          ({ status }) => status === "published",
        ).length,
        drafts: store.innovations.filter(({ status }) => status === "draft")
          .length,
        withoutEmbedding: store.innovations.filter(
          ({ hasEmbedding }) => !hasEmbedding,
        ).length,
      },
      notice: null,
    };
  }
  // Preview reads counts only, through the service role, because problems and
  // ideas are admin-only under RLS. No row content leaves this function.
  const client =
    access.mode === "admin"
      ? await createClient()
      : access.mode === "preview"
        ? createAdminClient()
        : null;
  if (!client) {
    return {
      data: {
        newProblems7d: null,
        unmetProblems7d: null,
        submittedIdeas: null,
        published: null,
        drafts: null,
        withoutEmbedding: null,
      },
      notice: access.mode === "preview" ? null : LOAD_ERROR,
    };
  }
  const head = { count: "exact" as const, head: true };
  const [
    newProblems7d,
    unmetNew7d,
    submittedIdeas,
    published,
    drafts,
    withoutEmbedding,
  ] = await Promise.all([
    count(() =>
      client.from("problems").select("id", head).gte("created_at", since),
    ),
    count(() =>
      client
        .from("problems")
        .select("id", head)
        .gte("created_at", since)
        .or(`status.eq.new,best_score.lt.${UNMET_SCORE_THRESHOLD}`),
    ),
    count(() =>
      client.from("ideas").select("id", head).eq("status", "submitted"),
    ),
    count(() =>
      client.from("innovations").select("id", head).eq("status", "published"),
    ),
    count(() =>
      client.from("innovations").select("id", head).eq("status", "draft"),
    ),
    count(() =>
      client.from("innovations").select("id", head).is("embedding", null),
    ),
  ]);
  const migrated = published !== null;
  return {
    data: {
      newProblems7d,
      unmetProblems7d: unmetNew7d,
      submittedIdeas,
      published,
      drafts,
      withoutEmbedding,
    },
    notice: migrated || access.mode !== "admin" ? null : MIGRATION_NOTICE,
  };
}

// ---------------------------------------------------------------------------
// Moderation (admin and demo only)
// ---------------------------------------------------------------------------

export interface ModerationQueue {
  ideas: AdminIdea[];
  problems: AdminProblem[];
  drafts: AdminInnovation[];
}

export async function getModerationQueue(
  access: AdminAccess,
): Promise<Loaded<ModerationQueue>> {
  const empty = { ideas: [], problems: [], drafts: [] };
  if (access.mode === "demo") {
    const store = getDemoStore();
    const newestFirst = <T extends { createdAt: string }>(a: T, b: T) =>
      b.createdAt.localeCompare(a.createdAt);
    return {
      data: {
        ideas: store.ideas
          .filter(({ status }) => status === "submitted")
          .sort(newestFirst),
        problems: store.problems
          .filter(({ status }) => status === "new")
          .sort(newestFirst),
        drafts: store.innovations.filter(({ status }) => status === "draft"),
      },
      notice: null,
    };
  }
  if (access.mode !== "admin") return { data: empty, notice: null };
  const client = await createClient();
  if (!client) return { data: empty, notice: LOAD_ERROR };
  const [ideas, problems, innovations] = await Promise.all([
    selectRows<AdminIdeaRow>(
      (columns) =>
        client
          .from("ideas")
          .select(columns)
          .eq("status", "submitted")
          .order("created_at", { ascending: false })
          .limit(50),
      ADMIN_IDEA_COLUMNS,
      LEGACY_IDEA_COLUMNS,
    ),
    selectRows<AdminProblemRow>(
      (columns) =>
        client
          .from("problems")
          .select(columns)
          .eq("status", "new")
          .order("created_at", { ascending: false })
          .limit(50),
      ADMIN_PROBLEM_COLUMNS,
      LEGACY_PROBLEM_COLUMNS,
    ),
    readInnovations(client, false),
  ]);
  return {
    data: {
      ideas: ideas.data.map(toAdminIdea),
      problems: problems.data.map(toAdminProblem),
      drafts: innovations.data.filter(({ status }) => status === "draft"),
    },
    notice: ideas.notice ?? problems.notice ?? innovations.notice,
  };
}

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

type TrendRow = {
  category: string | null;
  created_at: string;
  status: AdminProblem["status"];
  best_score?: number | null;
  description: string;
};

/**
 * Problems for trend aggregation. Contains raw descriptions: callers must only
 * pass aggregates to the client, and only admin and demo may send excerpts to AI.
 */
export async function getTrendProblems(
  access: AdminAccess,
): Promise<Loaded<TrendProblem[]>> {
  if (access.mode === "demo") {
    return { data: getDemoStore().problems, notice: null };
  }
  const client =
    access.mode === "admin"
      ? await createClient()
      : access.mode === "preview"
        ? createAdminClient()
        : null;
  if (!client)
    return { data: [], notice: access.mode === "preview" ? null : LOAD_ERROR };
  const result = await selectRows<TrendRow>(
    (columns) =>
      client
        .from("problems")
        .select(columns)
        .order("created_at", { ascending: false })
        .limit(TREND_ROW_LIMIT),
    TREND_COLUMNS,
    LEGACY_TREND_COLUMNS,
  );
  return {
    data: result.data.map((row) => ({
      category: row.category,
      createdAt: row.created_at,
      status: row.status,
      bestScore: typeof row.best_score === "number" ? row.best_score : null,
      description: row.description,
    })),
    notice: access.mode === "admin" ? result.notice : null,
  };
}
