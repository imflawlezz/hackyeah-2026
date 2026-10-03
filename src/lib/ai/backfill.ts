import type { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts, innovationEmbeddingText } from "./embeddings";
import { EMBEDDING_DIMENSIONS } from "./models";
import { toInnovation } from "@/lib/data/innovations";

export async function backfillInnovations(
  client: SupabaseClient,
  options: { ids?: string[]; all?: boolean } = {},
  onProgress?: (count: number) => void,
): Promise<number> {
  if (options.ids?.length === 0) return 0;
  let count = 0;
  let cursor: string | undefined;
  while (true) {
    let query = client.from("innovations").select("*").order("id").limit(50);
    if (options.ids) query = query.in("id", options.ids);
    if (!options.all && !options.ids) query = query.is("embedding", null);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query.abortSignal(
      AbortSignal.timeout(10_000),
    );
    if (error) throw new Error("Nie udało się pobrać innowacji.");
    if (!data?.length) return count;
    const embeddings = await embedTexts(
      data.map((row) =>
        innovationEmbeddingText({ ...toInnovation(row), summary: row.summary }),
      ),
    );
    if (
      embeddings.length !== data.length ||
      embeddings.some(
        (vector) =>
          vector.length !== EMBEDDING_DIMENSIONS ||
          vector.some((value) => !Number.isFinite(value)),
      )
    ) {
      throw new Error("Niepoprawne wektory innowacji.");
    }
    const writes = await Promise.all(
      data.map((row, index) =>
        client
          .from("innovations")
          .update({ embedding: embeddings[index] })
          .eq("id", row.id)
          .abortSignal(AbortSignal.timeout(10_000)),
      ),
    );
    if (writes.some(({ error }) => error))
      throw new Error("Nie udało się zapisać wektorów innowacji.");
    count += data.length;
    onProgress?.(count);
    cursor = data[data.length - 1].id;
  }
}
