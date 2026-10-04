"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { fromIdea } from "@/lib/data/ideas";
import { createClient, hasSupabase } from "@/lib/supabase/server";

const optionalCanvasField = z.preprocess(
  (value) => (typeof value === "string" && !value.trim() ? undefined : value),
  z.string().trim().min(3).max(2000).optional(),
);
const saveIdeaSchema = z.object({
  id: z.string().max(80).optional(),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(2000),
  targetGroup: z.string().trim().min(3).max(500),
  stage: z.enum(["idea", "prototype", "pilot"]),
  status: z.enum(["draft", "submitted"]),
  municipality: z.string().trim().max(120).optional(),
  canvas: z
    .object({
      problem: z.preprocess(
        (value) =>
          typeof value === "string" && !value.trim() ? undefined : value,
        z.string().trim().min(10).max(2000).optional(),
      ),
      solution: optionalCanvasField,
      novelty: optionalCanvasField,
      resources: optionalCanvasField,
      partners: optionalCanvasField,
      risks: optionalCanvasField,
      successMeasures: optionalCanvasField,
    })
    .default({}),
});

const saveGrantDraftSchema = z.object({
  ideaId: z.string().uuid(),
  callId: z.string().uuid(),
  sections: z
    .array(
      z.object({
        key: z.string().max(80),
        heading: z.string().max(200),
        body: z.string().max(4000),
      }),
    )
    .min(1)
    .max(12),
});

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveIdea(
  input: unknown,
): Promise<
  | { ok: true; storage: "database"; id: string }
  | { ok: true; storage: "browser" }
  | { ok: false; error: string }
> {
  const parsed = saveIdeaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Uzupełnij wymagane pola fiszki." };
  }

  const user = await getCurrentUser();
  if (!user || !hasSupabase) return { ok: true, storage: "browser" };

  const supabase = await createClient();
  if (!supabase) return { ok: true, storage: "browser" };

  const payload = fromIdea({
    ...parsed.data,
    canvas: Object.fromEntries(
      Object.entries(parsed.data.canvas).filter(([, value]) => value),
    ),
  });
  const existingId =
    parsed.data.id && UUID.test(parsed.data.id) ? parsed.data.id : null;

  if (existingId) {
    // RLS lets the author update only their own draft; a draft can become
    // "submitted" in place, so sending never creates a second row.
    const { data: updated, error } = await supabase
      .from("ideas")
      .update(payload)
      .eq("id", existingId)
      .eq("author_id", user.id)
      .select("id");
    if (error || !updated?.length) {
      console.warn("Idea update failed", { code: error?.code ?? "no rows" });
      return {
        ok: false,
        error:
          "Nie udało się zapisać szkicu. Sprawdź, czy pomysł jest nadal szkicem.",
      };
    }
    // Admins are notified by the notify_idea_status trigger.
    return { ok: true, storage: "database", id: existingId };
  }

  const { data, error } = await supabase
    .from("ideas")
    .insert({ ...payload, author_id: user.id })
    .select("id")
    .single();
  if (error || !data?.id) {
    console.warn("Idea insert failed", { code: error?.code });
    return {
      ok: false,
      error: "Nie udało się wysłać pomysłu. Spróbuj ponownie za chwilę.",
    };
  }
  return { ok: true, storage: "database", id: String(data.id) };
}

export async function saveGrantDraft(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = saveGrantDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Szkic wniosku jest niekompletny." };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Zaloguj się, żeby zapisać szkic wniosku." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      error: "Baza jest niedostępna. Skopiuj tekst albo pobierz plik.",
    };
  }
  const { error } = await supabase.from("grant_drafts").upsert(
    {
      idea_id: parsed.data.ideaId,
      call_id: parsed.data.callId,
      author_id: user.id,
      content: { sections: parsed.data.sections },
    },
    { onConflict: "idea_id,call_id" },
  );
  if (error) {
    console.warn("Grant draft save failed", { code: error.code });
    return {
      ok: false,
      error: "Nie udało się zapisać szkicu wniosku. Spróbuj ponownie.",
    };
  }
  return { ok: true };
}
