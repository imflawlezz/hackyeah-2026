import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  // Load environment before modules capture configuration; tsx resolves the @/ alias.
  const [{ createAdminClient }, { hasOpenAI }, { backfillInnovations }] =
    await Promise.all([
      import("../src/lib/supabase/admin"),
      import("../src/lib/ai/models"),
      import("../src/lib/ai/backfill"),
    ]);
  const client = createAdminClient();
  if (!client || !hasOpenAI)
    throw new Error("Skonfiguruj Supabase i OpenAI w .env.local.");
  // --all re-embeds every innovation (needed after the embedding text changes);
  // without it only rows that have no vector yet are embedded.
  const all = process.argv.includes("--all");
  const count = await backfillInnovations(client, { all }, (count) =>
    console.log(`Embedded innovations: ${count}`),
  );
  console.log(`Completed: ${count} innovations.`);
}

main().catch(() => {
  console.error(
    "Embedding backfill failed. Check server configuration and database availability.",
  );
  process.exitCode = 1;
});
