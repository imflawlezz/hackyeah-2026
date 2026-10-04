import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMatches,
  GENERIC_MATCH_ERROR,
  MatchApiError,
} from "@/lib/api/match";
import { mockMatch } from "@/lib/mocks";

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(
  body: unknown,
  init: ResponseInit & { headers?: Record<string, string> } = {},
) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchMatches", () => {
  const request = { problem: "samotni seniorzy na wsi", category: "Samotność" };

  it("posts the request and returns validated results with the source", async () => {
    const results = mockMatch(request).map((result, index) => ({
      ...result,
      tier: index === 0 ? ("match" as const) : ("related" as const),
    }));
    const fetchMock = stubFetch(
      jsonResponse(
        { results, noGoodMatch: false },
        { headers: { "X-Match-Source": "mock" } },
      ),
    );
    const controller = new AbortController();

    const response = await fetchMatches(request, controller.signal);

    expect(response).toEqual({ results, noGoodMatch: false, source: "mock" });
    expect(fetchMock).toHaveBeenCalledWith("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  });

  it("reads the ai source and defaults to unknown without the header", async () => {
    const empty = { results: [], noGoodMatch: true };
    stubFetch(jsonResponse(empty, { headers: { "X-Match-Source": "AI" } }));
    await expect(fetchMatches(request)).resolves.toEqual({
      ...empty,
      source: "ai",
    });

    stubFetch(jsonResponse(empty));
    await expect(fetchMatches(request)).resolves.toEqual({
      ...empty,
      source: "unknown",
    });
  });

  it("throws the server's Polish message on 400", async () => {
    stubFetch(
      jsonResponse(
        {
          error:
            "Nie udało się odczytać opisu lub kategorii. Sprawdź formularz i spróbuj ponownie.",
        },
        { status: 400 },
      ),
    );

    const error = await fetchMatches(request).catch((caught) => caught);

    expect(error).toBeInstanceOf(MatchApiError);
    expect(error.message).toBe(
      "Nie udało się odczytać opisu lub kategorii. Sprawdź formularz i spróbuj ponownie.",
    );
    expect(error.status).toBe(400);
  });

  it("falls back to the generic message when the error body is not JSON", async () => {
    stubFetch(new Response("Internal Server Error", { status: 500 }));

    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);
  });

  it("rejects a payload that does not match the MatchResult contract", async () => {
    stubFetch(
      jsonResponse({
        results: [{ innovation: { id: "x" }, score: "high" }],
        noGoodMatch: false,
      }),
    );

    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);
  });

  it("rejects a result without a tier or with an unknown one", async () => {
    const [result] = mockMatch(request);
    stubFetch(jsonResponse({ results: [result], noGoodMatch: false }));
    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);

    stubFetch(
      jsonResponse({
        results: [{ ...result, tier: "weak" }],
        noGoodMatch: false,
      }),
    );
    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);
  });

  it("rejects a payload without noGoodMatch and the old bare array", async () => {
    stubFetch(jsonResponse({ results: [] }));
    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);

    stubFetch(jsonResponse([]));
    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);
  });
});
