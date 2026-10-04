import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "./admin";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createAdminClient", () => {
  it("has no service role key in tests, so nothing can write to a real project", () => {
    // vitest.setup.ts clears these even when the shell exports real values.
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    expect(createAdminClient()).toBeNull();
  });

  it("builds a client only when both the URL and the key are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    expect(createAdminClient()).toBeNull();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    expect(createAdminClient()).not.toBeNull();
  });
});
