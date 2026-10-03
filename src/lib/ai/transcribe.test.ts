import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./models", () => ({
  hasOpenAI: true,
  TRANSCRIPTION_MODEL: "gpt-4o-mini-transcribe",
}));
import { transcribeAudio } from "./transcribe";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const file = new File(["audio"], "recording.webm", { type: "audio/webm" });
it("uses Polish, the specified model and a bounded signal without a rewriting prompt", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-only");
  const fetcher = vi
    .fn()
    .mockResolvedValue(Response.json({ text: "  moje słowa  " }));
  vi.stubGlobal("fetch", fetcher);
  expect(await transcribeAudio(file)).toBe("  moje słowa  ");
  const options = fetcher.mock.calls[0][1];
  expect(options.body.get("language")).toBe("pl");
  expect(options.body.get("model")).toBe("gpt-4o-mini-transcribe");
  expect(options.body.get("prompt")).toBeNull();
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
it("does not call the provider without a key", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(transcribeAudio(file)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it("rejects provider failures", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-only");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("internal", { status: 500 })),
  );
  await expect(transcribeAudio(file)).rejects.toThrow("Transcription failed");
});
it("aborts the provider at the deadline", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-only");
  const signal = AbortSignal.abort();
  const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, options) => {
      options.signal.throwIfAborted();
    }),
  );
  await expect(transcribeAudio(file)).rejects.toThrow();
  expect(timeout).toHaveBeenCalledWith(20_000);
  timeout.mockRestore();
});
