import { describe, expect, it } from "vitest";
import { feedbackEntries } from "@/lib/mocks/testing";
import { feedbackSummarySchema } from "@/lib/validators";
import {
  formatDateRange,
  formatDecimal,
  formatShare,
  opinionsText,
  slotsLeftText,
  testsText,
} from "./format";
import { parseFeedback, parseSignups } from "./local-store";
import {
  FEEDBACK_FORM_DEFAULTS,
  feedbackFormSchema,
  SIGNUP_FORM_DEFAULTS,
  signupFormSchema,
  TEXT_MAX_LENGTH,
} from "./schemas";
import { EMPTY_SUMMARY, summarizeFeedback } from "./summary";

describe("plural helpers", () => {
  it("counts free slots: miejsce, miejsca, miejsc", () => {
    expect(slotsLeftText(1)).toBe("Zostało 1 miejsce");
    expect(slotsLeftText(3)).toBe("Zostały 3 miejsca");
    expect(slotsLeftText(5)).toBe("Zostało 5 miejsc");
    expect(slotsLeftText(12)).toBe("Zostało 12 miejsc");
    expect(slotsLeftText(22)).toBe("Zostały 22 miejsca");
    expect(slotsLeftText(0)).toBe("Brak wolnych miejsc");
    expect(slotsLeftText(-1)).toBe("Brak wolnych miejsc");
  });

  it("counts opinions: opinia, opinie, opinii", () => {
    expect(opinionsText(1)).toBe("1 opinia");
    expect(opinionsText(2)).toBe("2 opinie");
    expect(opinionsText(5)).toBe("5 opinii");
    expect(opinionsText(12)).toBe("12 opinii");
    expect(opinionsText(24)).toBe("24 opinie");
    expect(opinionsText(0)).toBe("0 opinii");
  });

  it("counts tests: test, testy, testów", () => {
    expect(testsText(1)).toBe("1 test");
    expect(testsText(3)).toBe("3 testy");
    expect(testsText(5)).toBe("5 testów");
    expect(testsText(0)).toBe("0 testów");
  });
});

describe("number and date formatting", () => {
  it("uses a decimal comma and one decimal place", () => {
    expect(formatDecimal(4.2)).toBe("4,2");
    expect(formatDecimal(4)).toBe("4,0");
    expect(formatDecimal(3.88)).toBe("3,9");
  });

  it("formats a share as a whole percentage", () => {
    expect(formatShare(0.75)).toBe("75%");
    expect(formatShare(0.7778)).toBe("78%");
    expect(formatShare(1)).toBe("100%");
    expect(formatShare(0)).toBe("0%");
  });

  it("formats a date range in Polish", () => {
    expect(formatDateRange("2026-10-15", "2026-11-30")).toBe(
      "15 października – 30 listopada 2026",
    );
    expect(formatDateRange("2026-12-01", "2027-01-15")).toBe(
      "1 grudnia 2026 – 15 stycznia 2027",
    );
    // Database timestamps and bad input.
    expect(formatDateRange("2026-11-02T00:00:00+00:00", "2026-12-13")).toBe(
      "2 listopada – 13 grudnia 2026",
    );
    expect(formatDateRange("soon", "2026-12-13")).toBe("");
  });
});

describe("summarizeFeedback", () => {
  it("returns the empty summary for no opinions", () => {
    expect(summarizeFeedback([])).toEqual(EMPTY_SUMMARY);
  });

  it("computes the average, distribution, ease and recommend share", () => {
    const summary = summarizeFeedback([
      { rating: 5, easeOfUse: 4, wouldRecommend: true },
      { rating: 4, easeOfUse: 5, wouldRecommend: true },
      { rating: 4, wouldRecommend: false },
      { rating: 2, easeOfUse: 3, wouldRecommend: true },
      { rating: 5, easeOfUse: 4 },
    ]);
    expect(summary).toEqual({
      count: 5,
      avgRating: 4,
      distribution: { 1: 0, 2: 1, 3: 0, 4: 2, 5: 2 },
      avgEase: 4,
      // Three "yes" out of the four who answered.
      recommendShare: 0.75,
    });
    expect(feedbackSummarySchema.safeParse(summary).success).toBe(true);
  });

  it("rounds averages to two decimals", () => {
    const summary = summarizeFeedback([
      { rating: 5 },
      { rating: 4 },
      { rating: 4 },
    ]);
    expect(summary.avgRating).toBe(4.33);
    expect(summary.avgEase).toBeNull();
    expect(summary.recommendShare).toBeNull();
  });

  it("gives the mock telecare opinions a believable summary", () => {
    const summary = summarizeFeedback(
      feedbackEntries.filter(
        ({ innovationId }) => innovationId === "inn-telecare",
      ),
    );
    expect(summary.count).toBe(8);
    expect(summary.avgRating).toBe(4);
    expect(summary.recommendShare).toBe(0.75);
  });
});

describe("signupFormSchema", () => {
  const valid = {
    ...SIGNUP_FORM_DEFAULTS,
    availability: "evening",
    consent: true,
  };

  it("accepts the minimum: availability and consent", () => {
    expect(signupFormSchema.parse(valid)).toEqual({
      motivation: undefined,
      availability: "evening",
      accessibilityNeeds: undefined,
      consent: true,
    });
  });

  it("trims optional text", () => {
    const parsed = signupFormSchema.parse({
      ...valid,
      motivation: "  Opiekuję się mamą.  ",
      accessibilityNeeds: "   ",
    });
    expect(parsed.motivation).toBe("Opiekuję się mamą.");
    expect(parsed.accessibilityNeeds).toBeUndefined();
  });

  it("asks for availability and consent in Polish", () => {
    const result = signupFormSchema.safeParse(SIGNUP_FORM_DEFAULTS);
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(
      result.error!.issues.map((issue) => [issue.path[0], issue.message]),
    );
    expect(messages.availability).toBe("Wybierz, kiedy możesz wziąć udział.");
    expect(messages.consent).toMatch(/^Zaznacz zgodę na kontakt/);
  });

  it("rejects an unknown availability and text over the limit", () => {
    expect(
      signupFormSchema.safeParse({ ...valid, availability: "night" }).success,
    ).toBe(false);
    expect(
      signupFormSchema.safeParse({
        ...valid,
        motivation: "a".repeat(TEXT_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(
      signupFormSchema.safeParse({
        ...valid,
        motivation: "a".repeat(TEXT_MAX_LENGTH),
      }).success,
    ).toBe(true);
  });
});

describe("feedbackFormSchema", () => {
  it("requires only the rating", () => {
    expect(
      feedbackFormSchema.parse({ ...FEEDBACK_FORM_DEFAULTS, rating: "4" }),
    ).toEqual({
      rating: 4,
      easeOfUse: undefined,
      wouldRecommend: undefined,
      whatWorked: undefined,
      whatToImprove: undefined,
      comment: undefined,
      testId: undefined,
    });
    const result = feedbackFormSchema.safeParse(FEEDBACK_FORM_DEFAULTS);
    expect(result.success).toBe(false);
    expect(result.error!.issues[0]!.message).toBe("Wybierz ocenę od 1 do 5.");
  });

  it("converts radio strings to numbers and booleans", () => {
    const parsed = feedbackFormSchema.parse({
      rating: "5",
      easeOfUse: "3",
      wouldRecommend: "no",
      whatWorked: " Stała pora rozmowy. ",
      whatToImprove: "",
      comment: "",
      testId: "test-telecare-nowy-targ",
    });
    expect(parsed).toMatchObject({
      rating: 5,
      easeOfUse: 3,
      wouldRecommend: false,
      whatWorked: "Stała pora rozmowy.",
      testId: "test-telecare-nowy-targ",
    });
    expect(
      feedbackFormSchema.parse({
        ...FEEDBACK_FORM_DEFAULTS,
        rating: "1",
        wouldRecommend: "yes",
      }).wouldRecommend,
    ).toBe(true);
  });

  it("treats an emptied radio group (null) like nothing chosen, in Polish", () => {
    const missing = feedbackFormSchema.safeParse({
      ...FEEDBACK_FORM_DEFAULTS,
      rating: null,
    });
    expect(missing.error!.issues.map(({ message }) => message)).toEqual([
      "Wybierz ocenę od 1 do 5.",
    ]);
    expect(
      feedbackFormSchema.parse({
        ...FEEDBACK_FORM_DEFAULTS,
        rating: "4",
        easeOfUse: null,
        wouldRecommend: null,
      }),
    ).toMatchObject({
      rating: 4,
      easeOfUse: undefined,
      wouldRecommend: undefined,
    });
    const signup = signupFormSchema.safeParse({
      ...SIGNUP_FORM_DEFAULTS,
      availability: null,
      consent: true,
    });
    expect(signup.error!.issues.map(({ message }) => message)).toEqual([
      "Wybierz, kiedy możesz wziąć udział.",
    ]);
    expect(
      feedbackFormSchema.safeParse({
        ...FEEDBACK_FORM_DEFAULTS,
        rating: "4",
        wouldRecommend: "maybe",
      }).success,
    ).toBe(false);
  });

  it("rejects ratings outside 1 to 5 and text over the limit", () => {
    for (const rating of ["0", "6", "4.5", "five", "45"]) {
      expect(
        feedbackFormSchema.safeParse({ ...FEEDBACK_FORM_DEFAULTS, rating })
          .success,
      ).toBe(false);
    }
    expect(
      feedbackFormSchema.safeParse({
        ...FEEDBACK_FORM_DEFAULTS,
        rating: "4",
        easeOfUse: "9",
      }).success,
    ).toBe(false);
    expect(
      feedbackFormSchema.safeParse({
        ...FEEDBACK_FORM_DEFAULTS,
        rating: "4",
        comment: "a".repeat(TEXT_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});

describe("local store parsing", () => {
  it("ignores anything that is not a well-formed entry", () => {
    expect(parseSignups('["a", 3, null, "b"]')).toEqual(["a", "b"]);
    expect(parseSignups("not json")).toEqual([]);
    expect(parseSignups('{"a":1}')).toEqual([]);
    expect(
      parseFeedback(
        JSON.stringify([
          {
            innovationId: "inn-telecare",
            rating: 5,
            easeOfUse: 4,
            wouldRecommend: true,
          },
          { innovationId: "inn-telecare", rating: 9 },
          { rating: 4 },
          {
            innovationId: "inn-telecare",
            rating: 3,
            easeOfUse: "x",
            wouldRecommend: "yes",
          },
          "junk",
        ]),
      ),
    ).toEqual([
      {
        innovationId: "inn-telecare",
        rating: 5,
        easeOfUse: 4,
        wouldRecommend: true,
      },
      {
        innovationId: "inn-telecare",
        rating: 3,
        easeOfUse: undefined,
        wouldRecommend: undefined,
      },
    ]);
  });
});
