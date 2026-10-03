import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasSupabase: true,
  user: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  get hasSupabase() {
    return mocks.hasSupabase;
  },
  createClient: async () => ({ rpc: mocks.rpc }),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
import { canModerate, canWrite, resolveAdminAccess } from "./admin";

function user(role: "admin" | "resident" | null) {
  return {
    id: "user-1",
    email: "ola@hubmi.example",
    profile: role
      ? { id: "user-1", role, displayName: "Ola", createdAt: "2026-01-01" }
      : null,
  };
}

beforeEach(() => {
  mocks.hasSupabase = true;
  mocks.user.mockReset().mockResolvedValue(null);
  mocks.rpc.mockReset().mockResolvedValue({ data: false, error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("resolveAdminAccess", () => {
  it("uses demo mode without Supabase, even with the preview flag", async () => {
    mocks.hasSupabase = false;
    vi.stubEnv("ADMIN_PREVIEW", "true");
    expect(await resolveAdminAccess()).toEqual({ mode: "demo", user: null });
    expect(mocks.user).not.toHaveBeenCalled();
  });

  it("grants admin by profile role without calling is_admin", async () => {
    mocks.user.mockResolvedValue(user("admin"));
    expect((await resolveAdminAccess()).mode).toBe("admin");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("grants admin when is_admin() returns true and the profile is unreadable", async () => {
    mocks.user.mockResolvedValue(user(null));
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    expect((await resolveAdminAccess()).mode).toBe("admin");
    expect(mocks.rpc).toHaveBeenCalledWith("is_admin");
  });

  it.each([
    ["anonymous", null, "", "denied"],
    ["anonymous", null, "true", "preview"],
    ["resident", user("resident"), "", "denied"],
    ["resident", user("resident"), "true", "preview"],
    ["resident", user("resident"), "yes", "denied"],
  ] as const)(
    "%s visitor with ADMIN_PREVIEW=%j → %s",
    async (_, current, flag, mode) => {
      mocks.user.mockResolvedValue(current);
      vi.stubEnv("ADMIN_PREVIEW", flag);
      const access = await resolveAdminAccess();
      expect(access.mode).toBe(mode);
      expect(access.user).toEqual(current);
    },
  );

  it("denies when is_admin() fails", async () => {
    mocks.user.mockResolvedValue(user("resident"));
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect((await resolveAdminAccess()).mode).toBe("denied");
  });
});

describe("write and moderation permissions", () => {
  it("allows changes only for admin and the in-memory demo", () => {
    expect(
      ["admin", "preview", "demo", "denied"].map((mode) =>
        canWrite(mode as never),
      ),
    ).toEqual([true, false, true, false]);
    expect(canModerate("preview")).toBe(false);
  });
});
