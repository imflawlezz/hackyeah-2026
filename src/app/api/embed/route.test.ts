import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  backfill: vi.fn(),
  configured: false,
  user: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.user,
  isAdmin: (user: { profile?: { role?: string } | null } | null) =>
    user?.profile?.role === "admin",
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/lib/ai/models", () => ({
  get hasOpenAI() {
    return mocks.configured;
  },
}));
vi.mock("@/lib/ai/backfill", () => ({ backfillInnovations: mocks.backfill }));
import { GET, POST } from "./route";

function request(secret?: string, body: unknown = {}) {
  return new Request("http://localhost/api/embed", {
    method: "POST",
    body: JSON.stringify(body),
    headers: secret ? { "x-embed-secret": secret } : {},
  });
}
beforeEach(() => {
  vi.stubEnv("EMBED_SECRET", "test-only-secret");
  mocks.configured = false;
  mocks.admin.mockReset().mockReturnValue(null);
  mocks.backfill.mockReset();
  mocks.user.mockReset().mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());

it("rejects absent, wrong and unconfigured secrets", async () => {
  expect((await POST(request())).status).toBe(401);
  expect((await POST(request("wrong"))).status).toBe(401);
  vi.stubEnv("EMBED_SECRET", "");
  expect((await POST(request("test-only-secret"))).status).toBe(401);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it("accepts a signed-in admin session without the secret", async () => {
  mocks.configured = true;
  const client = {};
  mocks.admin.mockReturnValue(client);
  mocks.backfill.mockResolvedValue(3);
  mocks.user.mockResolvedValue({
    id: "admin-id",
    email: "admin@hubmi.example",
    profile: { role: "admin" },
  });
  const response = await POST(request(undefined, { all: true }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ count: 3 });
  expect(mocks.backfill).toHaveBeenCalledWith(client, { all: true });
});
it("rejects signed-in users who are not admins", async () => {
  mocks.user.mockResolvedValue({
    id: "resident-id",
    email: "resident@hubmi.example",
    profile: { role: "resident" },
  });
  expect((await POST(request())).status).toBe(401);
  mocks.user.mockResolvedValue({
    id: "no-profile",
    email: "x@hubmi.example",
    profile: null,
  });
  expect((await POST(request())).status).toBe(401);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it("does not read the session when the secret is valid", async () => {
  await POST(request("test-only-secret"));
  expect(mocks.user).not.toHaveBeenCalled();
});
it("returns 503 when providers are not configured", async () => {
  expect((await POST(request("test-only-secret"))).status).toBe(503);
});
it("passes selected IDs to the backfill and returns its count", async () => {
  mocks.configured = true;
  const client = {};
  mocks.admin.mockReturnValue(client);
  mocks.backfill.mockResolvedValue(2);
  const response = await POST(
    request("test-only-secret", { ids: ["one", "two"] }),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ count: 2 });
  expect(mocks.backfill).toHaveBeenCalledWith(client, { ids: ["one", "two"] });
});
it("rejects invalid options and handles backfill failures", async () => {
  mocks.configured = true;
  mocks.admin.mockReturnValue({});
  expect((await POST(request("test-only-secret", { all: "yes" }))).status).toBe(
    400,
  );
  mocks.backfill.mockRejectedValue(new Error("Unavailable"));
  expect((await POST(request("test-only-secret"))).status).toBe(503);
});
it("does not allow GET", () => {
  expect(GET().status).toBe(405);
});
