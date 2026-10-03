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
    for (const section of payload.sections) {
      expect(section.body).not.toMatch(/\[|uzupełnij/i);
    }
    expect(
      payload.sections.find((section) => section.key === "harmonogram")?.body,
    ).toContain("Rozpisz działania na kolejne miesiące");
    expect(
      payload.sections.find((section) => section.key === "budżet")?.body,
    ).toMatch(/nie może przekroczyć 20\s000 zł/);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("asks the model for marked estimates and passes the call limits", async () => {
    mocks.openAI = true;
    POST = (await import("./route")).POST;
    mocks.generate.mockResolvedValue({
      output: {
        sections: [
          { key: "problem", heading: "Problem", body: "Brakuje sprzętu." },
          { key: "rozwiązanie", heading: "Rozwiązanie", body: "Pożyczamy." },
          { key: "odbiorcy", heading: "Odbiorcy", body: "Seniorzy." },
          {
            key: "harmonogram",
            heading: "Harmonogram",
            body: "Szacunek: listopad – przygotowanie, grudzień – realizacja.",
          },
          {
            key: "budżet",
            heading: "Budżet",
            body: "Szacunek: sprzęt 8000 zł, promocja 1000 zł.",
          },
        ],
      },
    });
    const response = await POST(
      request({ callId: DEMO_GRANT_CALL_ID, idea }, "192.0.2.30"),
    );
    expect(response.headers.get("X-Draft-Source")).toBe("ai");
    const call = mocks.generate.mock.calls[0]![0] as {
      system: string;
      prompt: string;
    };
    expect(call.system).toContain("Szacunek:");
    expect(call.system).not.toContain("wstawiasz [uzupełnij");
    expect(JSON.parse(call.prompt).call.maxAmountPln).toBe(20000);
    const payload = (await response.json()) as {
      sections: { key: string; body: string }[];
    };
    expect(payload.sections.find((s) => s.key === "budżet")?.body).toBe(
      "Szacunek: sprzęt 8000 zł, promocja 1000 zł.",
    );
  });

  it("removes bracket placeholders from model output", async () => {
    mocks.openAI = true;
    POST = (await import("./route")).POST;
    mocks.generate.mockResolvedValue({
      output: {
        sections: [
          {
            key: "problem",
            heading: "Problem",
            body: "Seniorzy nie mają sprzętu [uzupełnij: liczba osób] na czas rehabilitacji.",
          },
          {
            key: "harmonogram",
            heading: "Harmonogram",
            body: "[uzupełnij: daty]",
          },
        ],
      },
    });
    const response = await POST(
      request({ callId: DEMO_GRANT_CALL_ID, idea }, "192.0.2.31"),
    );
    const payload = (await response.json()) as {
      sections: { key: string; body: string }[];
    };
    for (const section of payload.sections) {
      expect(section.body).not.toMatch(/\[|uzupełnij/i);
    }
    expect(payload.sections.find((s) => s.key === "problem")?.body).toBe(
      "Seniorzy nie mają sprzętu na czas rehabilitacji.",
    );
    expect(
      payload.sections.find((s) => s.key === "harmonogram")?.body,
    ).toContain("Rozpisz działania");
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
