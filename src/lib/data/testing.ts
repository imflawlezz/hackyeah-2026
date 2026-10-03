import {
  feedbackEntries as mockFeedback,
  innovationTests as mockTests,
  testSlotsTaken as mockSlotsTaken,
} from "@/lib/mocks/testing";
import { innovations as mockInnovations } from "@/lib/mocks/innovations";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient, hasSupabase } from "@/lib/supabase/server";
import {
  EMPTY_SUMMARY,
  type FeedbackScores,
  summarizeFeedback,
} from "@/lib/testing/summary";
import type { FeedbackSummary, InnovationTest } from "@/types";

/** A test as the public pages show it. */
export type OpenTest = InnovationTest & {
  innovationTitle: string;
  innovationCategory: string;
  slotsLeft: number;
};

type TestRow = {
  id: string;
  innovation_id: string;
  title: string;
  description: string;
  municipality: string;
  starts_at: string;
  ends_at: string;
  slots: number;
  status: "open" | "closed";
  created_at: string;
  // PostgREST returns a to-one embed as an object, older clients as an array.
  innovations?:
    | { title: string; category: string }
    | { title: string; category: string }[]
    | null;
};

type SummaryRow = {
  count: number | string;
  avg_rating: number | string | null;
  rating_1: number | string;
  rating_2: number | string;
  rating_3: number | string;
  rating_4: number | string;
  rating_5: number | string;
  avg_ease: number | string | null;
  recommend_share: number | string | null;
};

const TEST_COLUMNS =
  "id, innovation_id, title, description, municipality, starts_at, ends_at, slots, status, created_at, innovations ( title, category )";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function toInnovationTest(row: TestRow): InnovationTest {
  return {
    id: row.id,
    innovationId: row.innovation_id,
    title: row.title,
    description: row.description,
    municipality: row.municipality,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    slots: row.slots,
    status: row.status,
    createdAt: row.created_at,
  };
}

function nullableNumber(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}

/** Postgres numerics and bigints arrive as strings. */
export function toFeedbackSummary(row: SummaryRow): FeedbackSummary {
  return {
    count: Number(row.count),
    avgRating: nullableNumber(row.avg_rating),
    distribution: {
      1: Number(row.rating_1),
      2: Number(row.rating_2),
      3: Number(row.rating_3),
      4: Number(row.rating_4),
      5: Number(row.rating_5),
    },
    avgEase: nullableNumber(row.avg_ease),
    recommendShare: nullableNumber(row.recommend_share),
  };
}

function mockOpenTests(innovationId?: string): OpenTest[] {
  return mockTests
    .filter(
      (test) =>
        test.status === "open" &&
        (innovationId === undefined || test.innovationId === innovationId),
    )
    .map((test) => {
      const innovation = mockInnovations.find(
        ({ id }) => id === test.innovationId,
      );
      return {
        ...test,
        innovationTitle: innovation?.title ?? test.title,
        innovationCategory: innovation?.category ?? "",
        slotsLeft: Math.max(0, test.slots - (mockSlotsTaken[test.id] ?? 0)),
      };
    })
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

async function queryOpenTests(
  innovationId?: string,
): Promise<OpenTest[] | null> {
  // Outside the try block: createClient() reads cookies, which is how Next.js
  // learns the route must be rendered on request.
  const client = await createClient();
  if (!client) return null;
  try {
    let query = client
      .from("innovation_tests")
      .select(TEST_COLUMNS)
      .eq("status", "open");
    if (innovationId) query = query.eq("innovation_id", innovationId);
    const { data, error } = await query.order("starts_at");
    if (error || !data) {
      console.warn("Tests fallback to mocks", { cause: "query failed" });
      return null;
    }
    const rows = data as unknown as TestRow[];
    return await Promise.all(
      rows.map(async (row) => {
        const { data: taken, error: slotsError } = await client.rpc(
          "test_slots_taken",
          { p_test_id: row.id },
        );
        if (slotsError) {
          console.warn("Slots unavailable", { cause: "rpc failed" });
        }
        const innovation = Array.isArray(row.innovations)
          ? row.innovations[0]
          : row.innovations;
        return {
          ...toInnovationTest(row),
          innovationTitle: innovation?.title ?? row.title,
          innovationCategory: innovation?.category ?? "",
          slotsLeft: Math.max(0, row.slots - (Number(taken) || 0)),
        };
      }),
    );
  } catch {
    console.warn("Tests fallback to mocks", { cause: "query threw" });
    return null;
  }
}

/** Open tests with the innovation they belong to and the slots left, soonest first. */
export async function listOpenTests(): Promise<OpenTest[]> {
  if (!hasSupabase) return mockOpenTests();
  // An empty list is a real answer (no open tests); only a failure, such as
  // the migration not being applied yet, falls back to the mocks.
  return (await queryOpenTests()) ?? mockOpenTests();
}

/** Open tests of one innovation. Slug ids belong to the mocks. */
export async function getTestsForInnovation(
  innovationId: string,
): Promise<OpenTest[]> {
  if (!hasSupabase || !isUuid(innovationId)) {
    return mockOpenTests(innovationId);
  }
  return (await queryOpenTests(innovationId)) ?? [];
}

/** Scores of the mock opinions for one innovation, for the local summary. */
export function getMockFeedbackScores(innovationId: string): FeedbackScores[] {
  return mockFeedback
    .filter((entry) => entry.innovationId === innovationId)
    .map(({ rating, easeOfUse, wouldRecommend }) => ({
      rating,
      easeOfUse,
      wouldRecommend,
    }));
}

/** Aggregates only. Comes from the innovation_feedback_summary function or the mocks. */
export async function getFeedbackSummary(
  innovationId: string,
): Promise<FeedbackSummary> {
  if (!hasSupabase || !isUuid(innovationId)) {
    return summarizeFeedback(getMockFeedbackScores(innovationId));
  }
  const client = await createClient();
  if (!client) return EMPTY_SUMMARY;
  try {
    const { data, error } = await client.rpc("innovation_feedback_summary", {
      p_innovation_id: innovationId,
    });
    const row = (Array.isArray(data) ? data[0] : data) as SummaryRow | null;
    if (error || !row) {
      console.warn("Feedback summary unavailable", { cause: "rpc failed" });
      return EMPTY_SUMMARY;
    }
    return toFeedbackSummary(row);
  } catch {
    console.warn("Feedback summary unavailable", { cause: "rpc threw" });
    return EMPTY_SUMMARY;
  }
}

/**
 * Ids of the tests the signed-in user has already signed up for, read with
 * their own RLS client. Empty in demo mode (sign-ups live in the browser) and
 * when nobody is signed in.
 */
export async function getMySignupTestIds(): Promise<string[]> {
  if (!hasSupabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const client = await createClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from("test_signups")
      .select("test_id")
      .eq("user_id", user.id);
    if (error) {
      console.warn("Sign-ups unavailable", { code: error.code });
      return [];
    }
    return (data ?? []).map((row: { test_id: string }) => row.test_id);
  } catch {
    console.warn("Sign-ups unavailable", { cause: "query threw" });
    return [];
  }
}
