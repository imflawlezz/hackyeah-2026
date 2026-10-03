import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  transcribe: vi.fn(),
  configured: true,
  user: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/ai/transcribe", () => ({ transcribeAudio: mocks.transcribe }));
vi.mock("@/lib/ai/models", () => ({
  get hasOpenAI() {
    return mocks.configured;
  },
}));
import { POST } from "./route";
import { MAX_AUDIO_BYTES, MAX_BODY_BYTES } from "@/lib/voice/upload";
let ip = 0;
const valid = new Uint8Array([
  0x1a,
  0x45,
  0xdf,
  0xa3,
  ...new TextEncoder().encode("webm A_OPUS"),
]);
function request(
  audio: Blob | string | null = new Blob([valid], { type: "audio/webm" }),
  address = String(++ip),
) {
  const form = new FormData();
  if (audio !== null) form.set("audio", audio);
  return new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: form,
    headers: { "x-forwarded-for": address },
  });
}
beforeEach(() => {
  mocks.transcribe.mockReset().mockResolvedValue("Szukam wsparcia.");
  mocks.configured = true;
  mocks.user.mockReset().mockResolvedValue({ id: `user-${++ip}` });
});
it("returns the provider transcript unchanged", async () => {
  mocks.transcribe.mockResolvedValue("  słowa\n użytkownika  ");
  expect(await (await POST(request())).json()).toEqual({
    text: "  słowa\n użytkownika  ",
  });
});
it.each([null, "text", new Blob([], { type: "audio/webm" })])(
  "rejects missing or empty files before the provider",
  async (audio) => {
    expect((await POST(request(audio))).status).toBe(400);
    expect(mocks.transcribe).not.toHaveBeenCalled();
  },
);
it("rejects false audio MIME declarations", async () => {
  expect(
    (await POST(request(new Blob(["not audio"], { type: "audio/webm" }))))
      .status,
  ).toBe(415);
  expect(mocks.transcribe).not.toHaveBeenCalled();
});
it("rejects oversized files", async () => {
  expect(
    (
      await POST(
        request(
          new Blob([new Uint8Array(MAX_AUDIO_BYTES + 1)], {
            type: "audio/webm",
          }),
        ),
      )
    ).status,
  ).toBe(413);
  expect(mocks.transcribe).not.toHaveBeenCalled();
});
it("bounds streamed consumption without Content-Length and cancels early", async () => {
  const cancel = vi.fn();
  const body = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(MAX_BODY_BYTES));
      c.enqueue(new Uint8Array(1));
    },
    cancel,
  });
  const req = new Request("http://localhost/api/transcribe", {
    method: "POST",
    body,
    duplex: "half",
    headers: {
      "content-type": "multipart/form-data; boundary=a",
      "x-forwarded-for": String(++ip),
    },
  } as RequestInit);
  expect((await POST(req)).status).toBe(413);
  expect(cancel).toHaveBeenCalled();
  expect(mocks.transcribe).not.toHaveBeenCalled();
});
it("supports MP4 with matching signature and MIME", async () => {
  const bytes = new Uint8Array([
    0,
    0,
    0,
    24,
    ...new TextEncoder().encode("ftypisom0000mp42"),
  ]);
  expect(
    (await POST(request(new Blob([bytes], { type: "audio/mp4" })))).status,
  ).toBe(200);
});
it("reports missing configuration without fictional text", async () => {
  mocks.configured = false;
  expect((await POST(request())).status).toBe(503);
  expect(mocks.transcribe).not.toHaveBeenCalled();
});
it("hides provider failures", async () => {
  mocks.transcribe.mockRejectedValue(new Error("secret provider detail"));
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).not.toContain("secret");
});
it("limits signed-in users across IP addresses with Retry-After", async () => {
  const address = String(++ip);
  for (let i = 0; i < 5; i++) await POST(request(undefined, `${address}-${i}`));
  mocks.transcribe.mockClear();
  const response = await POST(request(undefined, address));
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("60");
  expect(mocks.transcribe).not.toHaveBeenCalled();
});

it("rejects anonymous requests before consuming uploads or calling the provider", async () => {
  mocks.user.mockResolvedValue(null);
  const req = request();
  const response = await POST(req);
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({
    error: "Zaloguj się, aby korzystać z wprowadzania głosowego.",
  });
  expect(req.bodyUsed).toBe(false);
  expect(mocks.transcribe).not.toHaveBeenCalled();
});
it("keeps separate quotas for users sharing an IP", async () => {
  const address = String(++ip);
  for (let i = 0; i < 5; i++) await POST(request(undefined, address));
  mocks.user.mockResolvedValue({ id: "other-" + ++ip });
  expect((await POST(request(undefined, address))).status).toBe(200);
});
