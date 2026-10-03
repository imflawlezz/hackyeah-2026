import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_GRANT_CALL_ID } from "@/lib/mocks";

const mocks = vi.hoisted(() => ({ openAI: false, generate: vi.fn() }));

vi.mock("@/lib/ai/models", () => ({
  REASON_MODEL: "gpt-4o-mini",
  get hasOpenAI() {
    return mocks.openAI;
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: false,
  createClient: vi.fn(),
}));
vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return { ...actual, generateText: mocks.generate };
});

let POST: typeof import("./route").POST;

function request(body: unknown, ip = "192.0.2.20", raw = false) {
  return new Request("http://localhost/api/ideas/grant-draft", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: raw ? String(body) : JSON.stringify(body),
  });
}

const idea = {
  title: "Wypożyczalnia",
  summary: "Świetlica pożycza balkoniki na dwa tygodnie.",
  targetGroup: "Seniorzy w gminie Gdów",
  canvas: { problem: "Brakuje sprzętu na czas rehabilitacji." },
};

beforeEach(async () => {
  vi.resetModules();
  mocks.openAI = false;
  mocks.generate.mockReset();
  POST = (await import("./route")).POST;
});

describe("POST /api/ideas/grant-draft", () => {
  it("returns one template section per required section without a key", async () => {
    const response = await POST(request({ callId: DEMO_GRANT_CALL_ID, idea }));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Draft-Source")).toBe("template");
    const payload = (await response.json()) as {
      sections: { key: string; heading: string; body: string }[];
    };
    expect(payload.sections.map((section) => section.key)).toEqual([
      "problem",
      "rozwiązanie",
      "odbiorcy",
      "harmonogram",
      "budżet",
    ]);
    expect(
      payload.sections.find((section) => section.key === "harmonogram")?.body,
    ).toContain("[uzupełnij:");
    expect(
      payload.sections.find((section) => section.key === "budżet")?.body,
    ).toContain("[uzupełnij:");
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("rejects invalid input", async () => {
    expect((await POST(request("{", "192.0.2.21", true))).status).toBe(400);
    expect((await POST(request({ idea }, "192.0.2.22"))).status).toBe(400);
    expect(
      (await POST(request({ callId: "closed-call", idea }, "192.0.2.23")))
        .status,
    ).toBe(400);
    expect(
      (
        await POST(
          request(
            { callId: DEMO_GRANT_CALL_ID, idea: { summary: "a".repeat(4001) } },
            "192.0.2.24",
          ),
        )
      ).status,
    ).toBe(400);
  });

  it("returns 429 after five drafts from one address", async () => {
    const ip = "192.0.2.25";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(
        (await POST(request({ callId: DEMO_GRANT_CALL_ID, idea }, ip))).status,
      ).toBe(200);
    }
    const blocked = await POST(
      request({ callId: DEMO_GRANT_CALL_ID, idea }, ip),
    );
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({
      error: "Za dużo zapytań. Spróbuj ponownie za minutę.",
    });
  });
});
