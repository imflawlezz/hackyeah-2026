import { loadEnvConfig } from "@next/env";

// Fictional demo accounts. The password comes from DEMO_USER_PASSWORD and is
// never committed.
const DEMO_USERS = [
  {
    email: "resident@hubmi.example",
    displayName: "Anna Przykładowa",
    role: "resident",
    municipality: "Nowy Sącz",
  },
  {
    email: "jst@hubmi.example",
    displayName: "Jan Testowy",
    role: "jst",
    municipality: "Wieliczka",
  },
  {
    email: "expert@hubmi.example",
    displayName: "Ewa Wzorcowa",
    role: "expert",
    municipality: null,
  },
  {
    email: "admin@hubmi.example",
    displayName: "Administrator ROPS (demo)",
    role: "admin",
    municipality: "Kraków",
  },
] as const;

async function main() {
  loadEnvConfig(process.cwd());
  // Load environment before modules capture configuration.
  const { createAdminClient } = await import("../src/lib/supabase/admin");

  const password = process.env.DEMO_USER_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      "Set DEMO_USER_PASSWORD (at least 8 characters) in .env.local.",
    );
  }
  const client = createAdminClient();
  if (!client) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const { data: existing, error: listError } =
    await client.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error("Could not list existing users.");
  const idByEmail = new Map(
    existing.users.map((user) => [user.email?.toLowerCase(), user.id]),
  );

  for (const demo of DEMO_USERS) {
    let id = idByEmail.get(demo.email);
    if (id) {
      console.log(`Skipped ${demo.email}: already exists.`);
    } else {
      const { data, error } = await client.auth.admin.createUser({
        email: demo.email,
        password,
        email_confirm: true,
        user_metadata: { display_name: demo.displayName },
      });
      if (error || !data.user) {
        throw new Error(`Could not create ${demo.email}.`);
      }
      id = data.user.id;
      console.log(`Created ${demo.email}.`);
    }

    // The sign-up trigger never grants admin, and before 0002 it ignores the
    // role entirely, so the service role sets the profile fields here.
    const { error: profileError } = await client
      .from("profiles")
      .update({
        role: demo.role,
        display_name: demo.displayName,
        municipality: demo.municipality,
      })
      .eq("id", id);
    if (profileError) {
      throw new Error(`Could not set the profile for ${demo.email}.`);
    }
  }

  console.log(`Done: ${DEMO_USERS.length} demo accounts are ready.`);
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Creating demo users failed.",
  );
  process.exitCode = 1;
});
