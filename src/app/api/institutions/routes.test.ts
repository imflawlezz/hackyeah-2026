import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ruralProfile, validDraft } from "@/lib/institutions/fixtures";
import { mockMatch } from "@/lib/mocks";
import { implementationPlanSchema } from "@/lib/validators";

const mocks = vi.hoisted(() => ({
  hasOpenAI: false,
  generate: vi.fn(),
  match: vi.fn(),
}));
vi.mock("@/lib/ai/models", () => ({
  REASON_MODEL: "test-model",
  get hasOpenAI() {
    return mocks.hasOpenAI;
  },
}));
vi.mock("@/lib/ai/middleman", () => ({ generatePlanDraft: mocks.generate }));
vi.mock("@/lib/match/service", () => ({ matchProblem: mocks.match }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: false,
  createClient: vi.fn(),
}));
import { POST as postCandidates } from "./candidates/route";
import { POST as postPlan } from "./plan/route";

let ipCounter = 0;
/** A fresh address per request, so tests do not share a rate-limit bucket. */
function request(path: string, body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return new Request(`http://localhost/api/institutions/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const planBody = { profile: ruralProfile, innovationId: "inn-telecare" };
const warn = vi.spyOn(console, "warn");

beforeEach(() => {
  mocks.hasOpenAI = false;
  warn.mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/institutions/plan", () => {
  it("returns the template plan without an OpenAI key", async () => {
    const response = await postPlan(request("plan", planBody));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Plan-Source")).toBe("template");
    const { plan, innovation } = await response.json();
    expect(implementationPlanSchema.safeParse(plan).success).toBe(true);
    expect(plan).toMatchObject({
      source: "template",
      innovationId: "inn-telecare",
      totalMinPln: 10_000,
      totalMaxPln: 50_000,
    });
    expect(innovation.title).toBe("Teleopieka sąsiedzka");
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("returns the AI plan when the draft passes the checks", async () => {
    mocks.hasOpenAI = true;
    mocks.generate.mockResolvedValue(validDraft);

    const response = await postPlan(request("plan", planBody));

    expect(response.headers.get("X-Plan-Source")).toBe("ai");
    const { plan } = await response.json();
    expect(plan).toMatchObject({
      source: "ai",
      title: "Teleopieka sąsiedzka w gminie",
      totalMinPln: 10_000,
      totalMaxPln: 25_000,
    });
    expect(mocks.generate).toHaveBeenCalledTimes(1);
    const [profile, innovation, signal] = mocks.generate.mock.calls[0]!;
    expect(profile).toEqual(ruralProfile);
    expect(innovation.id).toBe("inn-telecare");
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects AI output with inconsistent totals, retries once, then falls back", async () => {
    mocks.hasOpenAI = true;
    mocks.generate.mockResolvedValue({ ...validDraft, totalMaxPln: 90_000 });

    const response = await postPlan(request("plan", planBody));

    expect(mocks.generate).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Plan-Source")).toBe("template");
    const { plan } = await response.json();
    expect(plan.source).toBe("template");
    expect(plan.totalMaxPln).toBe(
      plan.costs.reduce(
        (sum: number, row: { maxPln: number }) => sum + row.maxPln,
        0,
      ),
    );
    expect(warn).toHaveBeenCalledWith("Plan draft rejected", {
      attempt: 1,
      reason: "totals do not match cost rows",
    });
  });

  it("uses the second attempt when the retry is consistent", async () => {
    mocks.hasOpenAI = true;
    mocks.generate
      .mockResolvedValueOnce({ ...validDraft, assumptions: [] })
      .mockResolvedValueOnce(validDraft);

    const response = await postPlan(request("plan", planBody));

    expect(mocks.generate).toHaveBeenCalledTimes(2);
    expect(response.headers.get("X-Plan-Source")).toBe("ai");
  });

  it("does not retry when the first attempt used up the time for one", async () => {
    mocks.hasOpenAI = true;
    vi.useFakeTimers();
    try {
      mocks.generate.mockImplementation(async () => {
        vi.advanceTimersByTime(9_000);
        return { ...validDraft, totalMaxPln: 90_000 };
      });

      const response = await postPlan(request("plan", planBody));

      expect(mocks.generate).toHaveBeenCalledTimes(1);
      expect(response.headers.get("X-Plan-Source")).toBe("template");
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to the template when generation throws", async () => {
    mocks.hasOpenAI = true;
    mocks.generate.mockRejectedValue(new Error("upstream unavailable"));

    const response = await postPlan(request("plan", planBody));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Plan-Source")).toBe("template");
  });

  it.each([
    ["a body that is not JSON", "{not json"],
    ["a missing profile", { innovationId: "inn-telecare" }],
    ["a missing innovation id", { profile: ruralProfile }],
    [
      "an invalid profile",
      { ...planBody, profile: { ...ruralProfile, need: "krótko" } },
    ],
    [
      "an unknown budget band",
      { ...planBody, profile: { ...ruralProfile, budgetBand: "huge" } },
    ],
  ])("answers 400 with a Polish message for %s", async (_name, body) => {
    const response = await postPlan(request("plan", body));

    expect(response.status).toBe(400);
    const { error } = await response.json();
    expect(error).toMatch(/^Nie udało się odczytać/);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("answers 404 for an unknown innovation", async () => {
    const response = await postPlan(
      request("plan", { ...planBody, innovationId: "inn-missing" }),
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe(
      "Nie znaleźliśmy tej innowacji. Wybierz inną z listy.",
    );
  });

  it("limits one address to 5 plans per minute", async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 6; index++) {
      const response = await postPlan(request("plan", planBody, "203.0.113.7"));
      statuses.push(response.status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);

    const blocked = await postPlan(request("plan", planBody, "203.0.113.7"));
    expect(blocked.headers.get("Retry-After")).toBe("60");
    expect((await blocked.json()).error).toMatch(/Spróbuj ponownie za minutę/);
    // Another address is not affected.
    expect((await postPlan(request("plan", planBody))).status).toBe(200);
  });

  it("does not log what the institution wrote", async () => {
    mocks.hasOpenAI = true;
    mocks.generate.mockRejectedValue(new Error("boom"));
    await postPlan(request("plan", planBody));
    expect(JSON.stringify(warn.mock.calls)).not.toContain("Seniorzy");
  });
});

describe("POST /api/institutions/candidates", () => {
  const { innovationId: _unused, ...profile } = {
    ...ruralProfile,
    innovationId: undefined,
  };
  void _unused;

  beforeEach(() => {
    mocks.match.mockResolvedValue({
      results: mockMatch({ problem: "samotni seniorzy telefon", limit: 3 }),
      source: "mock",
    });
  });

  it("matches a Polish problem text built from the profile and returns three candidates", async () => {
    const response = await postCandidates(request("candidates", profile));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Match-Source")).toBe("mock");
    const body = await response.json();
    expect(body.source).toBe("mock");
    expect(body.candidates).toHaveLength(3);
    expect(body.candidates[0].innovation.title).toBeTruthy();

    expect(mocks.match).toHaveBeenCalledTimes(1);
    const [{ problem, limit }] = mocks.match.mock.calls[0]!;
    expect(limit).toBe(3);
    expect(problem).toContain(ruralProfile.need);
    expect(problem).toContain("samotni seniorzy z przysiółków");
    expect(problem).toContain("Gmina, gmina wiejska");
    expect(problem).toContain("Brak transportu publicznego");
    // An institution profile is not a resident's need, so it is not stored.
    expect(mocks.match.mock.calls[0]![1]?.record).not.toBe(true);
  });

  it("passes the AI source through", async () => {
    mocks.match.mockResolvedValue({ results: [], source: "ai" });
    const response = await postCandidates(request("candidates", profile));
    expect(response.headers.get("X-Match-Source")).toBe("ai");
    expect(await response.json()).toEqual({ candidates: [], source: "ai" });
  });

  it("answers 400 for an invalid profile without matching", async () => {
    for (const body of ["{", { ...profile, need: "krótko" }, {}]) {
      const response = await postCandidates(request("candidates", body));
      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/^Nie udało się odczytać/);
    }
    expect(mocks.match).not.toHaveBeenCalled();
  });

  it("limits one address to 20 requests per minute", async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 21; index++) {
      const response = await postCandidates(
        request("candidates", profile, "203.0.113.8"),
      );
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 20).every((status) => status === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
  });
});
