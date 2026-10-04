import "@testing-library/jest-dom/vitest";

// Tests must never reach a real Supabase project or OpenAI, even when the
// shell exports real keys (for example on a developer box with .env values
// loaded). Modules read these at import time, and setup files run before any
// test file is imported, so clearing them here makes every client fall back
// to its mock or "not configured" path.
for (const name of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "OPENAI_API_KEY",
  "EMBED_SECRET",
  "DEMO_USER_PASSWORD",
  "DEMO_LOGIN_ENABLED",
]) {
  delete process.env[name];
}
