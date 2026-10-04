// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { useVoiceInput } from "./use-voice-input";
import { VoiceFieldInput } from "@/components/voice/voice-field-input";
import { MatchForm } from "@/components/match/match-form";

let last: Recorder;
class Recorder {
  static isTypeSupported = vi.fn(() => true);
  state = "inactive";
  mimeType = "audio/webm;codecs=opus";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    // Keep the latest mock instance available for lifecycle assertions.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    last = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    // Deliver final data before the stop event, as browsers do.
    this.ondataavailable?.({
      data: new Blob(["final audio"], { type: this.mimeType }),
    });
    this.onstop?.();
  }
}
let track: ReturnType<typeof vi.fn>;
let microphone: ReturnType<typeof vi.fn>;
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.useFakeTimers();
  track = vi.fn();
  microphone = vi
    .fn()
    .mockResolvedValue({ getTracks: () => [{ stop: track }] });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: microphone },
  });
  Recorder.isTypeSupported.mockReturnValue(true);
  vi.stubGlobal("MediaRecorder", Recorder);
  fetcher = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ text: "Dyktowane słowa" }),
  });
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function start(result: { current: ReturnType<typeof useVoiceInput> }) {
  await act(async () => {
    await result.current.start();
  });
}
async function stop(result: { current: ReturnType<typeof useVoiceInput> }) {
  await act(async () => {
    result.current.stop();
  });
}
it("requests permission only on action and handles permission denial", async () => {
  microphone.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
  const { result } = renderHook(() => useVoiceInput(vi.fn()));
  expect(microphone).not.toHaveBeenCalled();
  await start(result);
  expect(result.current.state).toBe("error");
  expect(result.current.status).toContain("Nie mamy dostępu");
  expect(fetcher).not.toHaveBeenCalled();
});
it("handles unsupported browsers without requesting the microphone", async () => {
  Recorder.isTypeSupported.mockReturnValue(false);
  const { result } = renderHook(() => useVoiceInput(vi.fn()));
  await start(result);
  expect(result.current.status).toContain("nie obsługuje");
  expect(microphone).not.toHaveBeenCalled();
});
it("includes final data, stops tracks, clears timers and inserts once", async () => {
  const callback = vi.fn();
  const { result } = renderHook(() => useVoiceInput(callback));
  await start(result);
  await stop(result);
  expect(track).toHaveBeenCalled();
  expect(callback).toHaveBeenCalledExactlyOnceWith("Dyktowane słowa");
  expect(fetcher.mock.calls[0][1].body.get("audio").size).toBeGreaterThan(0);
  expect(vi.getTimerCount()).toBe(0);
});
it("stops automatically at 60 seconds", async () => {
  const { result } = renderHook(() => useVoiceInput(vi.fn()));
  await start(result);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(last.state).toBe("inactive");
  expect(track).toHaveBeenCalled();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("prevents duplicate starts and stops", async () => {
  const { result } = renderHook(() => useVoiceInput(vi.fn()));
  await act(async () => {
    await Promise.all([result.current.start(), result.current.start()]);
  });
  await act(async () => {
    result.current.stop();
    result.current.stop();
  });
  expect(microphone).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("cancels recording without uploading", async () => {
  const callback = vi.fn();
  const { result } = renderHook(() => useVoiceInput(callback));
  await start(result);
  act(() => result.current.cancel());
  expect(track).toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
  expect(callback).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
it("cancels transcription and ignores a late response even after a new recording", async () => {
  let resolve!: (value: unknown) => void;
  fetcher.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const callback = vi.fn();
  const { result } = renderHook(() => useVoiceInput(callback));
  await start(result);
  await stop(result);
  const signal = fetcher.mock.calls[0][1].signal;
  act(() => result.current.cancel());
  expect(signal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  await start(result);
  await act(async () => {
    resolve({ ok: true, json: async () => ({ text: "stale" }) });
  });
  expect(callback).not.toHaveBeenCalled();
  await stop(result);
  expect(callback).toHaveBeenCalledExactlyOnceWith("Dyktowane słowa");
});
it("releases a microphone permission result arriving after cancellation", async () => {
  let resolve!: (value: unknown) => void;
  microphone.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const { result } = renderHook(() => useVoiceInput(vi.fn()));
  act(() => {
    void result.current.start();
  });
  act(() => result.current.cancel());
  await act(async () => {
    resolve({ getTracks: () => [{ stop: track }] });
  });
  expect(track).toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
});
it("cleans microphone and timers on unmount", async () => {
  const { result, unmount } = renderHook(() => useVoiceInput(vi.fn()));
  await start(result);
  unmount();
  expect(track).toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
  expect(fetcher).not.toHaveBeenCalled();
});
it("aborts pending uploads on unmount and ignores late results", async () => {
  let resolve!: (value: unknown) => void;
  fetcher.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const callback = vi.fn();
  const { result, unmount } = renderHook(() => useVoiceInput(callback));
  await start(result);
  await stop(result);
  const signal = fetcher.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => {
    resolve({ ok: true, json: async () => ({ text: "late" }) });
  });
  expect(callback).not.toHaveBeenCalled();
});
it("does not insert empty transcription", async () => {
  fetcher.mockResolvedValue({ ok: true, json: async () => ({ text: "  " }) });
  const callback = vi.fn();
  const { result } = renderHook(() => useVoiceInput(callback));
  await start(result);
  await stop(result);
  expect(callback).not.toHaveBeenCalled();
  expect(result.current.status).toContain("Nie rozpoznaliśmy");
});
it("preserves edits made during transcription on /match without submitting", async () => {
  let resolve!: (value: unknown) => void;
  fetcher.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const search = vi.fn();
  render(
    <MatchForm
      signedIn
      defaultValues={{ problem: "Istniejący opis", category: "" }}
      loading={false}
      onSearch={search}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Wprowadź głosowo" }));
  });
  expect(screen.getByText("Nagrywamy…")).toHaveAttribute("aria-live", "polite");
  for (const name of ["Zatrzymaj nagrywanie", "Anuluj"])
    expect(screen.getByRole("button", { name })).toHaveAttribute(
      "type",
      "button",
    );
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Zatrzymaj nagrywanie" }),
    );
  });
  fireEvent.change(screen.getByLabelText("Opis problemu", { exact: false }), {
    target: { value: "Nowa ręczna edycja" },
  });
  await act(async () => {
    resolve({ ok: true, json: async () => ({ text: "Moje słowa" }) });
  });
  expect(screen.getByLabelText("Opis problemu", { exact: false })).toHaveValue(
    "Nowa ręczna edycja\nMoje słowa",
  );
  expect(search).not.toHaveBeenCalled();
});
it("preserves an overflowing field and exposes the entire transcript separately", async () => {
  function Field() {
    const [value, setValue] = useState("12345");
    return (
      <>
        <textarea
          aria-label="Pole"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <VoiceFieldInput getValue={() => value} onChange={setValue} limit={5} />
      </>
    );
  }
  render(<Field />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Wprowadź głosowo" }));
  });
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Zatrzymaj nagrywanie" }),
    );
  });
  expect(screen.getByLabelText("Pole")).toHaveValue("12345");
  expect(screen.getByLabelText("Rozpoznany tekst do skrócenia")).toHaveValue(
    "Dyktowane słowa",
  );
});

it("disables logged-out dictation while preserving typing", () => {
  render(
    <MatchForm
      signedIn={false}
      defaultValues={{ problem: "", category: "" }}
      loading={false}
      onSearch={vi.fn()}
    />,
  );
  const button = screen.getByRole("button", { name: "Wprowadź głosowo" });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(screen.getByRole("link", { name: "Zaloguj się" })).toHaveAttribute(
    "href",
    "/login?next=%2Fmatch",
  );
  const field = screen.getByLabelText("Opis problemu", { exact: false });
  fireEvent.change(field, { target: { value: "Wpisany opis problemu" } });
  expect(field).toHaveValue("Wpisany opis problemu");
  expect(fetcher).not.toHaveBeenCalled();
});
