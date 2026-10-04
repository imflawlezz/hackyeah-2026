import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

/**
 * Read-only calibration for the match thresholds (docs/matching.md).
 * Runs each query through the embedding, the match_innovations RPC and
 * rerank(), then prints a Markdown table. It never calls POST /api/match and
 * uses the anon key, so nothing is written to the database.
 *
 * Usage: npx tsx scripts/calibrate-match.ts
 */

type Query = { expect: "match" | "none"; text: string; category?: string };

const QUERIES: Query[] = [
  // Should match a seeded innovation.
  {
    expect: "match",
    text: "Seniorzy w naszej wsi są samotni i nie mają z kim porozmawiać.",
  },
  {
    expect: "match",
    text: "Starsze osoby nie umieją korzystać ze smartfona i załatwić sprawy w urzędzie przez internet.",
  },
  {
    expect: "match",
    text: "Opiekuję się chorą mamą całą dobę i nie mam ani chwili odpoczynku.",
  },
  {
    expect: "match",
    text: "Młodzież w gminie nie ma gdzie spędzać czasu po szkole.",
  },
  {
    expect: "match",
    text: "Nastolatki w szkole mają stany lękowe i depresję, a do psychologa czeka się miesiącami.",
  },
  {
    expect: "match",
    text: "Osoby długotrwale bezrobotne nie mogą wrócić do pracy.",
  },
  {
    expect: "match",
    text: "Osoby w kryzysie bezdomności nie mają gdzie spędzić nocy zimą.",
  },
  {
    expect: "match",
    text: "Osoby niesłyszące nie mogą załatwić sprawy w urzędzie, bo nikt nie zna języka migowego.",
  },
  {
    expect: "match",
    text: "Opiekunowie rodzinni osób z demencją są wypaleni i potrzebują wsparcia.",
  },
  {
    expect: "match",
    text: "Samotna wdowa po osiemdziesiątce nie wychodzi z domu i nikt jej nie odwiedza.",
  },
  // Should not match: the library has no answer to these.
  { expect: "none", text: "Na drodze powiatowej jest dziura w jezdni." },
  {
    expect: "none",
    text: "Na dworcu kolejowym nie ma podjazdu dla wózków inwalidzkich.",
  },
  {
    expect: "none",
    text: "Rozkład jazdy autobusów nie jest dopasowany do pociągów.",
  },
  { expect: "none", text: "Śmieci nie są wywożone na czas." },
  { expect: "none", text: "Na naszej ulicy nie działa oświetlenie." },
  { expect: "none", text: "Zimą powietrze jest zatrute smogiem z pieców." },
  { expect: "none", text: "W centrum miasta brakuje miejsc parkingowych." },
  { expect: "none", text: "Po deszczu woda zalewa piwnice na osiedlu." },
  { expect: "none", text: "Dziki niszczą uprawy na polach." },
  { expect: "none", text: "Podatek od nieruchomości jest za wysoki." },
  {
    expect: "none",
    text: "W przychodni kolejka do kardiologa trwa ponad rok.",
  },
  // A relevant problem filtered to a category that does not fit it.
  {
    expect: "none",
    text: "Seniorzy w naszej wsi są samotni i nie mają z kim porozmawiać.",
    category: "Bezdomność",
  },
];

const POOL = 15;
const TOP = 5;
const fmt = (value: number) => value.toFixed(3);

async function main() {
  loadEnvConfig(process.cwd());
  // Load environment before modules capture configuration; tsx resolves the @/ alias.
  const [{ embedText }, { rerank }] = await Promise.all([
    import("../src/lib/ai/embeddings"),
    import("../src/lib/match/rerank"),
  ]);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !process.env.OPENAI_API_KEY)
    throw new Error("Configure Supabase and OpenAI in .env.local.");
  // Anon key on purpose: RLS allows it to read, not to write.
  const client = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  console.log(
    "| # | Expect | Query | Category filter | Top raw | Top reranked | Top result (category) | Top 5: raw → reranked |",
  );
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const [index, query] of QUERIES.entries()) {
    const embedding = await embedText(query.text);
    const { data, error } = await client.rpc("match_innovations", {
      query_embedding: embedding,
      match_count: POOL,
    });
    if (error || !Array.isArray(data)) throw new Error("RPC failed");
    let candidates = data.map((row) => ({
      innovation: {
        id: String(row.id),
        title: String(row.title),
        description: String(row.description ?? ""),
        category: String(row.category ?? ""),
        targetGroup: String(row.target_group ?? ""),
        tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
        createdAt: String(row.created_at ?? ""),
      },
      similarity: Number(row.similarity),
    }));
    if (query.category) {
      candidates = candidates.filter(
        ({ innovation }) => innovation.category === query.category,
      );
    }
    const ranked = rerank(query.text, candidates).slice(0, TOP);
    const top = ranked[0];
    console.log(
      `| ${[
        index + 1,
        query.expect,
        query.text,
        query.category ?? "",
        top ? fmt(top.similarity) : "",
        top ? fmt(top.score) : "",
        top ? `${top.innovation.title} (${top.innovation.category})` : "none",
        ranked
          .map(({ similarity, score }) => `${fmt(similarity)} → ${fmt(score)}`)
          .join("; "),
      ].join(" | ")} |`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(
    "Calibration failed:",
    error instanceof Error ? error.message : "unknown error",
  );
  process.exitCode = 1;
});
