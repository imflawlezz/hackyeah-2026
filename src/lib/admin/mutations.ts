import type { PostgrestError } from "@supabase/supabase-js";
import type { AdminAccess } from "@/lib/auth/admin";
import { backfillInnovations } from "@/lib/ai/backfill";
import { hasOpenAI } from "@/lib/ai/models";
import { getDemoStore } from "@/lib/admin/demo-store";
import type { InnovationInput } from "@/lib/admin/innovation-schema";
import { MIGRATION_NOTICE } from "@/lib/admin/repository";
import type { ActionResult, InnovationStatus } from "@/lib/admin/types";
import { toInnovationRow } from "@/lib/data/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Server code only. Callers (server actions) check access before calling; the
// database writes go through the admin's RLS client (is_admin() policies).

type WriteAccess = AdminAccess & { mode: "admin" | "demo" };

const pluralRules = new Intl.PluralRules("pl");

/** "1 innowację", "3 innowacje", "22 innowacje", "5 innowacji" (accusative). */
export function innovationsAccusative(count: number): string {
  const category = pluralRules.select(count);
  const noun =
    category === "one"
      ? "innowację"
      : category === "few"
        ? "innowacje"
        : "innowacji";
  return `${count} ${noun}`;
}

function failure(error: PostgrestError | null, fallback: string): ActionResult {
  const missingColumn =
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    /column .* does not exist/i.test(error?.message ?? "");
  return { ok: false, message: missingColumn ? MIGRATION_NOTICE : fallback };
}

const NOT_SAVED = "Nie udało się zapisać zmian. Spróbuj ponownie za chwilę.";
const NOT_FOUND = "Nie znaleźliśmy tego wpisu. Odśwież stronę.";

export async function saveInnovation(
  access: WriteAccess,
  id: string | null,
  input: InnovationInput,
): Promise<ActionResult & { id?: string }> {
  if (access.mode === "demo") {
    const store = getDemoStore();
    const now = new Date().toISOString();
    const fields = {
      ...input,
      region: input.region ?? "",
      videoUrl: input.videoUrl ?? undefined,
      imageUrl: input.imageUrl ?? undefined,
    };
    if (id) {
      const index = store.innovations.findIndex((item) => item.id === id);
      if (index === -1) return { ok: false, message: NOT_FOUND };
      store.innovations[index] = {
        ...store.innovations[index],
        ...fields,
        updatedAt: now,
      };
      return {
        ok: true,
        id,
        message: "Zapisano zmiany w wersji demonstracyjnej.",
      };
    }
    const newId = `demo-${crypto.randomUUID()}`;
    store.innovations.push({
      id: newId,
      ...fields,
      hasEmbedding: false,
      createdAt: now,
      updatedAt: now,
    });
    return {
      ok: true,
      id: newId,
      message: "Dodano innowację w wersji demonstracyjnej.",
    };
  }

  const client = await createClient();
  if (!client) return { ok: false, message: NOT_SAVED };
  const row = toInnovationRow(input);
  const { data, error } = id
    ? await client.from("innovations").update(row).eq("id", id).select("id")
    : await client.from("innovations").insert(row).select("id");
  if (error) return failure(error, NOT_SAVED);
  const savedId = (data as { id: string }[] | null)?.[0]?.id;
  if (!savedId) return { ok: false, message: NOT_FOUND };
  return {
    ok: true,
    id: savedId,
    message: id ? "Zapisano zmiany." : "Dodano innowację.",
  };
}

/** Re-embeds one row in the background; never throws. */
export async function reembedInnovation(id: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin || !hasOpenAI) return;
  try {
    await backfillInnovations(admin, { ids: [id] });
  } catch {
    console.warn("Innovation re-embedding failed");
  }
}

const STATUS_MESSAGES: Record<InnovationStatus, string> = {
  published: "Opublikowano innowację.",
  draft: "Przeniesiono innowację do szkiców.",
  archived: "Zarchiwizowano innowację.",
};

export async function setInnovationStatus(
  access: WriteAccess,
  id: string,
  status: InnovationStatus,
): Promise<ActionResult> {
  if (access.mode === "demo") {
    const item = getDemoStore().innovations.find((entry) => entry.id === id);
    if (!item) return { ok: false, message: NOT_FOUND };
    item.status = status;
    item.updatedAt = new Date().toISOString();
    return { ok: true, message: STATUS_MESSAGES[status] };
  }
  const client = await createClient();
  if (!client) return { ok: false, message: NOT_SAVED };
  const { data, error } = await client
    .from("innovations")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) return failure(error, NOT_SAVED);
  if (!data?.length) return { ok: false, message: NOT_FOUND };
  return { ok: true, message: STATUS_MESSAGES[status] };
}

export async function recomputeMissingEmbeddings(
  access: WriteAccess,
): Promise<ActionResult> {
  if (access.mode === "demo") {
    const missing = getDemoStore().innovations.filter(
      ({ hasEmbedding }) => !hasEmbedding,
    );
    for (const item of missing) item.hasEmbedding = true;
    return {
      ok: true,
      message: missing.length
        ? `Przeliczono ${innovationsAccusative(missing.length)} w wersji demonstracyjnej.`
        : "Wszystkie innowacje mają już wektory.",
    };
  }
  const admin = createAdminClient();
  if (!admin || !hasOpenAI) {
    return {
      ok: false,
      message:
        "Brakuje klucza OpenAI albo klucza serwisowego Supabase na serwerze. Dodaj je do zmiennych środowiskowych.",
    };
  }
  try {
    const count = await backfillInnovations(admin, {});
    return {
      ok: true,
      message: count
        ? `Przeliczono ${innovationsAccusative(count)}.`
        : "Wszystkie innowacje mają już wektory.",
    };
  } catch {
    console.warn("Innovation embedding backfill failed");
    return {
      ok: false,
      message: "Nie udało się przeliczyć wektorów. Spróbuj ponownie za chwilę.",
    };
  }
}

export async function reviewIdea(
  access: WriteAccess,
  id: string,
  note: string,
): Promise<ActionResult> {
  const message = "Oznaczono pomysł jako przejrzany.";
  if (access.mode === "demo") {
    const idea = getDemoStore().ideas.find((entry) => entry.id === id);
    if (!idea) return { ok: false, message: NOT_FOUND };
    idea.status = "reviewed";
    idea.reviewNote = note || null;
    return { ok: true, message };
  }
  const client = await createClient();
  if (!client) return { ok: false, message: NOT_SAVED };
  const { data, error } = await client.rpc("review_idea", {
    p_idea_id: id,
    p_note: note || null,
  });
  if (error?.code === "PGRST202") {
    return {
      ok: false,
      message:
        "Baza nie ma jeszcze zmian z migracji 0007. Poproś administratora o zastosowanie migracji odpowiedzi ROPS.",
    };
  }
  if (error) return failure(error, NOT_SAVED);
  if (!data) return { ok: false, message: NOT_FOUND };
  return { ok: true, message };
}

export async function closeProblem(
  access: WriteAccess,
  id: string,
  note: string,
): Promise<ActionResult> {
  const message = "Zamknięto zgłoszenie.";
  if (access.mode === "demo") {
    const problem = getDemoStore().problems.find((entry) => entry.id === id);
    if (!problem) return { ok: false, message: NOT_FOUND };
    problem.status = "closed";
    problem.adminNote = note || null;
    return { ok: true, message };
  }
  const client = await createClient();
  if (!client) return { ok: false, message: NOT_SAVED };
  const { data, error } = await client
    .from("problems")
    .update({ status: "closed", admin_note: note || null })
    .eq("id", id)
    .select("id");
  if (error) return failure(error, NOT_SAVED);
  if (!data?.length) return { ok: false, message: NOT_FOUND };
  return { ok: true, message };
}
