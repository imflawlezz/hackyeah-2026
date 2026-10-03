import { afterEach, describe, expect, it, vi } from "vitest";
import { innovationTestSchema } from "@/lib/validators";

const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: false,
  createClient: mocks.client,
}));
import {
  getFeedbackSummary,
  getTestsForInnovation,
  listOpenTests,
  toFeedbackSummary,
  toInnovationTest,
} from "./testing";

afterEach(() => {
  vi.clearAllMocks();
});

describe("without Supabase", () => {
  it("lists the three mock tests with innovation data and slots left", async () => {
    const tests = await listOpenTests();
    expect(tests).toHaveLength(3);
    expect(tests.map(({ municipality }) => municipality)).toEqual([
      "Wieliczka",
      "Nowy Targ",
      "Tarnów",
    ]);
    expect(tests[1]).toMatchObject({
      innovationId: "inn-telecare",
      innovationTitle: "Teleopieka sąsiedzka",
      innovationCategory: "Samotność",
      slots: 20,
      slotsLeft: 1,
    });
    for (const test of tests) {
      expect(innovationTestSchema.safeParse(test).success).toBe(true);
    }
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("finds the tests of one innovation by slug", async () => {
    const tests = await getTestsForInnovation("inn-telecare");
    expect(tests.map(({ id }) => id)).toEqual(["test-telecare-nowy-targ"]);
    expect(await getTestsForInnovation("inn-one-night")).toEqual([]);
    expect(await getTestsForInnovation("nope")).toEqual([]);
  });

  it("summarises the mock opinions", async () => {
    expect(await getFeedbackSummary("inn-telecare")).toEqual({
      count: 8,
      avgRating: 4,
      distribution: { 1: 0, 2: 1, 3: 1, 4: 3, 5: 3 },
      avgEase: 4,
      recommendShare: 0.75,
    });
    expect((await getFeedbackSummary("inn-one-night")).count).toBe(0);
    expect(mocks.client).not.toHaveBeenCalled();
  });
});

describe("row mapping", () => {
  it("maps a test row to camelCase", () => {
    expect(
      toInnovationTest({
        id: "t",
        innovation_id: "i",
        title: "Tytuł",
        description: "Opis",
        municipality: "Wieliczka",
        starts_at: "2026-10-15",
        ends_at: "2026-11-30",
        slots: 12,
        status: "open",
        created_at: "2026-10-03T08:00:00+00:00",
      }),
    ).toEqual({
      id: "t",
      innovationId: "i",
      title: "Tytuł",
      description: "Opis",
      municipality: "Wieliczka",
      startsAt: "2026-10-15",
      endsAt: "2026-11-30",
      slots: 12,
      status: "open",
      createdAt: "2026-10-03T08:00:00+00:00",
    });
  });

  it("turns Postgres numerics (strings) into numbers and keeps nulls", () => {
    expect(
      toFeedbackSummary({
        count: 5,
        avg_rating: "4.00",
        rating_1: 0,
        rating_2: 1,
        rating_3: 0,
        rating_4: 2,
        rating_5: "2",
        avg_ease: "3.88",
        recommend_share: "0.7500",
      }),
    ).toEqual({
      count: 5,
      avgRating: 4,
      distribution: { 1: 0, 2: 1, 3: 0, 4: 2, 5: 2 },
      avgEase: 3.88,
      recommendShare: 0.75,
    });
    expect(
      toFeedbackSummary({
        count: 0,
        avg_rating: null,
        rating_1: 0,
        rating_2: 0,
        rating_3: 0,
        rating_4: 0,
        rating_5: 0,
        avg_ease: null,
        recommend_share: null,
      }),
    ).toMatchObject({ count: 0, avgRating: null, recommendShare: null });
  });
});
