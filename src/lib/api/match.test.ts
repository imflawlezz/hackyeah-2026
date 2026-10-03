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
    const results = mockMatch(request);
    const fetchMock = stubFetch(
      jsonResponse(results, { headers: { "X-Match-Source": "mock" } }),
    );
    const controller = new AbortController();

    const response = await fetchMatches(request, controller.signal);

    expect(response).toEqual({ results, source: "mock" });
    expect(fetchMock).toHaveBeenCalledWith("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  });

  it("reads the ai source and defaults to unknown without the header", async () => {
    stubFetch(jsonResponse([], { headers: { "X-Match-Source": "AI" } }));
    await expect(fetchMatches(request)).resolves.toEqual({
      results: [],
      source: "ai",
    });

    stubFetch(jsonResponse([]));
    await expect(fetchMatches(request)).resolves.toEqual({
      results: [],
      source: "unknown",
    });
  });

  it("throws the server's Polish message on 400", async () => {
    stubFetch(
      jsonResponse(
        { error: "Żądanie nie spełnia kontraktu MatchRequest." },
        { status: 400 },
      ),
    );

    const error = await fetchMatches(request).catch((caught) => caught);

    expect(error).toBeInstanceOf(MatchApiError);
    expect(error.message).toBe("Żądanie nie spełnia kontraktu MatchRequest.");
    expect(error.status).toBe(400);
  });

  it("falls back to the generic message when the error body is not JSON", async () => {
    stubFetch(new Response("Internal Server Error", { status: 500 }));

    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);
  });

  it("rejects a payload that does not match the MatchResult contract", async () => {
    stubFetch(jsonResponse([{ innovation: { id: "x" }, score: "high" }]));

    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);
  });

  it("rejects a non-array payload", async () => {
    stubFetch(jsonResponse({ results: [] }));

    await expect(fetchMatches(request)).rejects.toThrow(GENERIC_MATCH_ERROR);
  });
});
