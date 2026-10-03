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
  const count = await backfillInnovations(client, {}, (count) =>
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
