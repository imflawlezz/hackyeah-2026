import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ insert: vi.fn(), user: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: true,
  createClient: async () => ({ from: () => ({ insert: mocks.insert }) }),
}));
import { saveIdea } from "./actions";
const base = {
  title: "Pomysł sąsiedzki",
  summary: "Pomagamy seniorom w codziennych sprawach.",
  targetGroup: "Seniorzy",
  stage: "idea",
  status: "submitted",
};
beforeEach(() => {
  mocks.user.mockResolvedValue({ id: "author" });
  mocks.insert.mockReturnValue({
    select: () => ({
      single: async () => ({ data: { id: "saved" }, error: null }),
    }),
  });
  mocks.insert.mockClear();
});
describe("saveIdea", () => {
  it.each([
    undefined,
    {},
    { problem: "   " },
    { problem: "Seniorzy potrzebują pomocy." },
    { solution: "Plan", risks: "   " },
  ])(
    "accepts empty or partial canvas and stores only nonempty fields",
    async (canvas) => {
      expect(await saveIdea({ ...base, canvas })).toEqual({
        ok: true,
        storage: "database",
        id: "saved",
      });
      expect(mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "submitted",
          canvas: Object.fromEntries(
            Object.entries(canvas ?? {}).filter(([, value]) => value.trim()),
          ),
        }),
      );
    },
  );
  it("rejects accidentally short implementation text", async () => {
    expect(
      await saveIdea({ ...base, canvas: { solution: "ab" } }),
    ).toMatchObject({ ok: false });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
