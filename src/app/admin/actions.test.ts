import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDemoStore } from "@/lib/admin/demo-store";

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  revalidatePath: vi.fn(),
  after: vi.fn(),
  saveInnovation: vi.fn(),
}));
vi.mock("@/lib/auth/admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/admin")>()),
  getAdminAccess: mocks.access,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/lib/ai/models", () => ({ hasOpenAI: false, REASON_MODEL: "test" }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: false,
  createClient: async () => null,
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => null }));

import {
  closeProblemAction,
  recomputeEmbeddingsAction,
  reviewIdeaAction,
  saveInnovationAction,
  setInnovationStatusAction,
  summarizeTrendsAction,
} from "./actions";

const form = {
  title: "Kawiarenka naprawcza",
  summary: "Wolontariusze naprawiają sprzęt z mieszkańcami.",
  description:
    "Raz w miesiącu w świetlicy wolontariusze pomagają naprawić drobny sprzęt domowy.",
  category: "Aktywizacja",
  targetGroup: "Mieszkańcy małych miejscowości",
  region: "",
  tags: "naprawa, sąsiedztwo",
  videoUrl: "",
  imageUrl: "",
  status: "draft",
};

const calls = {
  saveInnovation: () => saveInnovationAction(null, form),
  setInnovationStatus: () =>
    setInnovationStatusAction("inn-telecare", "archived"),
  recomputeEmbeddings: () => recomputeEmbeddingsAction(),
  reviewIdea: () => reviewIdeaAction("idea-mobility-library", "Dziękujemy"),
  closeProblem: () => closeProblemAction("mock-problem-02", ""),
  summarizeTrends: () => summarizeTrendsAction("30"),
};

beforeEach(() => {
  vi.clearAllMocks();
  resetDemoStore();
});

describe("admin server actions", () => {
  it.each(["preview", "denied"])(
    "refuse every action in %s mode and change nothing",
    async (mode) => {
      mocks.access.mockResolvedValue({ mode, user: null });
      const store = resetDemoStore();
      const before = JSON.stringify(store);
      for (const [name, call] of Object.entries(calls)) {
        const result = await call();
        expect(result.ok, name).toBe(false);
        expect(result.message, name).toMatch(/tylko administrator ROPS/);
      }
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
      expect(JSON.stringify(store)).toBe(before);
    },
  );

  describe("in demo mode (in-memory copy)", () => {
    beforeEach(() =>
      mocks.access.mockResolvedValue({ mode: "demo", user: null }),
    );

    it("creates and archives innovations and revalidates public pages", async () => {
      const store = resetDemoStore();
      const created = await saveInnovationAction(null, form);
      expect(created).toMatchObject({
        ok: true,
        message: "Dodano innowację w wersji demonstracyjnej.",
      });
      expect(
        store.innovations.find(({ id }) => id === created.id),
      ).toMatchObject({
        title: "Kawiarenka naprawcza",
        tags: ["naprawa", "sąsiedztwo"],
        status: "draft",
      });
      expect(
        await setInnovationStatusAction("inn-telecare", "archived"),
      ).toEqual({
        ok: true,
        message: "Zarchiwizowano innowację.",
      });
      expect(
        store.innovations.find(({ id }) => id === "inn-telecare")?.status,
      ).toBe("archived");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/knowledge");
      expect(mocks.after).not.toHaveBeenCalled();
    });

    it("rejects invalid input before touching data", async () => {
      expect(
        (
          await saveInnovationAction(null, {
            ...form,
            videoUrl: "http://youtube.com/x",
          })
        ).ok,
      ).toBe(false);
      expect(
        (await setInnovationStatusAction("inn-telecare", "deleted")).ok,
      ).toBe(false);
      expect((await reviewIdeaAction("", "note")).ok).toBe(false);
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("reviews ideas, closes problems and fills missing vectors", async () => {
      const store = resetDemoStore();
      expect(
        (await reviewIdeaAction("idea-mobility-library", "  Dziękujemy  ")).ok,
      ).toBe(true);
      expect(store.ideas[0]).toMatchObject({
        status: "reviewed",
        reviewNote: "Dziękujemy",
      });
      expect((await closeProblemAction("mock-problem-02", "")).ok).toBe(true);
      expect(store.problems[1]).toMatchObject({
        status: "closed",
        adminNote: null,
      });
      const missing = store.innovations.filter(
        ({ hasEmbedding }) => !hasEmbedding,
      ).length;
      expect((await recomputeEmbeddingsAction()).message).toBe(
        `Przeliczono ${missing} innowacje w wersji demonstracyjnej.`,
      );
      expect(store.innovations.every(({ hasEmbedding }) => hasEmbedding)).toBe(
        true,
      );
    });

    it("returns a deterministic summary without an OpenAI key", async () => {
      const result = await summarizeTrendsAction("all");
      expect(result).toMatchObject({ ok: true, source: "fallback" });
      expect(result.text).toContain(
        "Najwięcej zgłoszeń dotyczyło kategorii Samotność (11)",
      );
    });
  });
});
