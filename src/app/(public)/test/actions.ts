"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { getFeedbackSummary, isUuid } from "@/lib/data/testing";
import { createClient } from "@/lib/supabase/server";
import {
  FEEDBACK_MESSAGES,
  feedbackFormSchema,
  SIGNUP_MESSAGES,
  signupFormSchema,
} from "@/lib/testing/schemas";
import type { FeedbackSummary } from "@/types";

export type SignupResult =
  { ok: true; message: string } | { ok: false; message: string };

export type FeedbackResult =
  | { ok: true; message: string; summary: FeedbackSummary }
  | { ok: false; message: string };

const UNIQUE_VIOLATION = "23505";

function signupError(error: { code?: string; message?: string }): string {
  if (error.code === UNIQUE_VIOLATION) return SIGNUP_MESSAGES.duplicate;
  // Raised by the guard_test_signup trigger.
  if (error.message?.includes("TEST_FULL")) return SIGNUP_MESSAGES.full;
  if (error.message?.includes("TEST_CLOSED")) return SIGNUP_MESSAGES.closed;
  if (error.message?.includes("TEST_NOT_FOUND")) return SIGNUP_MESSAGES.closed;
  return SIGNUP_MESSAGES.failed;
}

/** Signs the current user up through their own RLS client; the database enforces slots and duplicates. */
export async function signUpForTest(
  testId: string,
  form: unknown,
): Promise<SignupResult> {
  const parsed = signupFormSchema.safeParse(form);
  if (!parsed.success || !isUuid(testId)) {
    return { ok: false, message: SIGNUP_MESSAGES.invalid };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: SIGNUP_MESSAGES.signedOut };
  const client = await createClient();
  if (!client) return { ok: false, message: SIGNUP_MESSAGES.failed };

  try {
    const { error } = await client.from("test_signups").insert({
      test_id: testId,
      motivation: parsed.data.motivation ?? null,
      availability: parsed.data.availability,
      accessibility_needs: parsed.data.accessibilityNeeds ?? null,
    });
    if (error) {
      console.warn("Test sign-up rejected", { code: error.code });
      return { ok: false, message: signupError(error) };
    }
  } catch {
    console.warn("Test sign-up failed", { cause: "request threw" });
    return { ok: false, message: SIGNUP_MESSAGES.failed };
  }

  revalidatePath("/test", "layout");
  return { ok: true, message: SIGNUP_MESSAGES.success };
}

/** Stores an opinion as the current user and returns the refreshed public summary. */
export async function submitFeedback(
  innovationId: string,
  form: unknown,
): Promise<FeedbackResult> {
  const parsed = feedbackFormSchema.safeParse(form);
  if (!parsed.success || !isUuid(innovationId)) {
    return { ok: false, message: FEEDBACK_MESSAGES.invalid };
  }
  const { data } = parsed;
  if (data.testId && !isUuid(data.testId)) {
    return { ok: false, message: FEEDBACK_MESSAGES.invalid };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: FEEDBACK_MESSAGES.signedOut };
  const client = await createClient();
  if (!client) return { ok: false, message: FEEDBACK_MESSAGES.failed };

  try {
    const { error } = await client.from("feedback").insert({
      innovation_id: innovationId,
      test_id: data.testId ?? null,
      rating: data.rating,
      ease_of_use: data.easeOfUse ?? null,
      would_recommend: data.wouldRecommend ?? null,
      what_worked: data.whatWorked ?? null,
      what_to_improve: data.whatToImprove ?? null,
      comment: data.comment ?? null,
    });
    if (error) {
      console.warn("Feedback rejected", { code: error.code });
      return { ok: false, message: FEEDBACK_MESSAGES.failed };
    }
  } catch {
    console.warn("Feedback failed", { cause: "request threw" });
    return { ok: false, message: FEEDBACK_MESSAGES.failed };
  }

  revalidatePath("/test", "layout");
  return {
    ok: true,
    message: FEEDBACK_MESSAGES.success,
    summary: await getFeedbackSummary(innovationId),
  };
}
