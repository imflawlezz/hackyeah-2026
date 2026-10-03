import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FEEDBACK_FORM_DEFAULTS,
  FEEDBACK_MESSAGES,
  SIGNUP_FORM_DEFAULTS,
  SIGNUP_MESSAGES,
} from "@/lib/testing/schemas";

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  user: vi.fn(),
  insert: vi.fn(),
  rpc: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: true,
  createClient: mocks.client,
}));
import { signUpForTest, submitFeedback } from "./actions";

const TEST_ID = "00000000-0000-4000-8000-000000000101";
const INNOVATION_ID = "00000000-0000-4000-8000-000000000012";
const signup = {
  ...SIGNUP_FORM_DEFAULTS,
  availability: "morning",
  consent: true,
};
const feedback = {
  ...FEEDBACK_FORM_DEFAULTS,
  rating: "5",
  wouldRecommend: "yes",
};

const from = vi.fn();
const warn = vi.spyOn(console, "warn");

beforeEach(() => {
  warn.mockImplementation(() => {});
  mocks.user.mockResolvedValue({
    id: "user-1",
    email: "tester@hubmi.example",
    profile: null,
  });
  mocks.insert.mockResolvedValue({ error: null });
  from.mockReturnValue({ insert: mocks.insert });
  mocks.client.mockResolvedValue({ from, rpc: mocks.rpc });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("signUpForTest", () => {
  it("inserts the sign-up for the current user and reports success", async () => {
    const result = await signUpForTest(TEST_ID, {
      ...signup,
      motivation: " Opiekuję się mamą. ",
    });

    expect(result).toEqual({ ok: true, message: SIGNUP_MESSAGES.success });
    expect(from).toHaveBeenCalledWith("test_signups");
    // user_id and status are left to the database default and trigger.
    expect(mocks.insert).toHaveBeenCalledWith({
      test_id: TEST_ID,
      motivation: "Opiekuję się mamą.",
      availability: "morning",
      accessibility_needs: null,
    });
    expect(mocks.revalidate).toHaveBeenCalled();
  });

  it.each([
    [
      "a full test",
      { code: "P0001", message: "TEST_FULL" },
      SIGNUP_MESSAGES.full,
    ],
    [
      "a closed test",
      { code: "P0001", message: "TEST_CLOSED" },
      SIGNUP_MESSAGES.closed,
    ],
    [
      "a second sign-up",
      { code: "23505", message: "duplicate key" },
      SIGNUP_MESSAGES.duplicate,
    ],
    [
      "an unknown error",
      { code: "XX000", message: "boom" },
      SIGNUP_MESSAGES.failed,
    ],
  ])("explains %s in Polish", async (_name, error, message) => {
    mocks.insert.mockResolvedValue({ error });
    expect(await signUpForTest(TEST_ID, signup)).toEqual({
      ok: false,
      message,
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("says the full-test message exactly as the issue words it", () => {
    expect(SIGNUP_MESSAGES.full).toBe("Brak wolnych miejsc w tym teście.");
  });

  it("asks a signed-out visitor to sign in without touching the database", async () => {
    mocks.user.mockResolvedValue(null);
    expect(await signUpForTest(TEST_ID, signup)).toEqual({
      ok: false,
      message: SIGNUP_MESSAGES.signedOut,
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an invalid form or a malformed test id before any request", async () => {
    for (const [id, form] of [
      [TEST_ID, SIGNUP_FORM_DEFAULTS],
      [TEST_ID, { ...signup, consent: false }],
      ["test-telecare-nowy-targ", signup],
      [TEST_ID, null],
    ] as const) {
      expect(await signUpForTest(id, form)).toEqual({
        ok: false,
        message: SIGNUP_MESSAGES.invalid,
      });
    }
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("does not log what the user typed", async () => {
    mocks.insert.mockResolvedValue({
      error: { code: "XX000", message: "boom" },
    });
    await signUpForTest(TEST_ID, { ...signup, motivation: "Sekret rodzinny" });
    expect(JSON.stringify(warn.mock.calls)).not.toContain("Sekret");
  });
});

describe("submitFeedback", () => {
  it("stores the opinion with the new columns and returns the fresh summary", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          count: 1,
          avg_rating: "5.00",
          rating_1: 0,
          rating_2: 0,
          rating_3: 0,
          rating_4: 0,
          rating_5: 1,
          avg_ease: "4.00",
          recommend_share: "1.0000",
        },
      ],
      error: null,
    });

    const result = await submitFeedback(INNOVATION_ID, {
      ...feedback,
      easeOfUse: "4",
      whatWorked: "Stała pora.",
      testId: TEST_ID,
    });

    expect(from).toHaveBeenCalledWith("feedback");
    expect(mocks.insert).toHaveBeenCalledWith({
      innovation_id: INNOVATION_ID,
      test_id: TEST_ID,
      rating: 5,
      ease_of_use: 4,
      would_recommend: true,
      what_worked: "Stała pora.",
      what_to_improve: null,
      comment: null,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("innovation_feedback_summary", {
      p_innovation_id: INNOVATION_ID,
    });
    expect(result).toEqual({
      ok: true,
      message: FEEDBACK_MESSAGES.success,
      summary: {
        count: 1,
        avgRating: 5,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        avgEase: 4,
        recommendShare: 1,
      },
    });
  });

  it("rejects a missing rating, a slug id and a malformed test id", async () => {
    for (const [id, form] of [
      [INNOVATION_ID, FEEDBACK_FORM_DEFAULTS],
      ["inn-telecare", feedback],
      [INNOVATION_ID, { ...feedback, testId: "not-a-uuid" }],
    ] as const) {
      expect(await submitFeedback(id, form)).toEqual({
        ok: false,
        message: FEEDBACK_MESSAGES.invalid,
      });
    }
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("asks a signed-out visitor to sign in", async () => {
    mocks.user.mockResolvedValue(null);
    expect(await submitFeedback(INNOVATION_ID, feedback)).toEqual({
      ok: false,
      message: FEEDBACK_MESSAGES.signedOut,
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("reports a database error without throwing", async () => {
    mocks.insert.mockResolvedValue({
      error: { code: "42501", message: "rls" },
    });
    expect(await submitFeedback(INNOVATION_ID, feedback)).toEqual({
      ok: false,
      message: FEEDBACK_MESSAGES.failed,
    });
  });
});
