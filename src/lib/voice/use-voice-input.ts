"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO_BYTES } from "./upload";

export type VoiceInputState =
  "idle" | "requesting" | "recording" | "transcribing" | "error";
const failure =
  "Nie udało się rozpoznać mowy. Spróbuj ponownie lub wpisz tekst.";
const formats = ["audio/webm;codecs=opus", "audio/mp4"];

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [status, setStatus] = useState("");
  const callback = useRef(onTranscript);
  useEffect(() => {
    callback.current = onTranscript;
  }, [onTranscript]);
  const session = useRef(0);
  const active = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const uploadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function release() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }
  function dispose() {
    session.current += 1;
    if (uploadTimer.current) clearTimeout(uploadTimer.current);
    uploadTimer.current = null;
    controller.current?.abort();
    controller.current = null;
    const recording = recorder.current;
    recorder.current = null;
    if (recording && recording.state !== "inactive") recording.stop();
    release();
    active.current = false;
  }
  useEffect(() => () => dispose(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function cancel() {
    dispose();
    setState("idle");
    setStatus("Nagranie anulowane. Możesz wpisać tekst.");
  }
  function stop() {
    const recording = recorder.current;
    if (!recording || recording.state !== "recording") return;
    setState("transcribing");
    setStatus("Rozpoznajemy mowę…");
    recording.stop();
    release();
  }
  async function start() {
    if (active.current) return;
    active.current = true;
    const id = ++session.current;
    setStatus("");
    setState("requesting");
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error("unsupported");
      const mimeType = formats.find((format) =>
        MediaRecorder.isTypeSupported(format),
      );
      if (!mimeType) throw new Error("unsupported");
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (id !== session.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const recording = new MediaRecorder(media, {
        mimeType,
        audioBitsPerSecond: 64_000,
      });
      recorder.current = recording;
      const chunks: Blob[] = [];
      let size = 0;
      recording.ondataavailable = (event) => {
        if (id !== session.current || !event.data.size) return;
        size += event.data.size;
        if (size > MAX_AUDIO_BYTES) {
          dispose();
          setState("error");
          setStatus(
            "Nagranie jest za duże. Nagraj krótszą wypowiedź lub wpisz tekst.",
          );
          return;
        }
        chunks.push(event.data);
      };
      recording.onerror = () => {
        if (id !== session.current) return;
        dispose();
        setState("error");
        setStatus(failure);
      };
      recording.onstop = async () => {
        if (id !== session.current) return;
        release();
        setState("transcribing");
        setStatus("Rozpoznajemy mowę…");
        const abort = new AbortController();
        controller.current = abort;
        const deadline = setTimeout(() => abort.abort(), 25_000);
        uploadTimer.current = deadline;
        try {
          const actualMime = recording.mimeType.split(";")[0];
          if (!["audio/webm", "audio/mp4"].includes(actualMime))
            throw new Error(failure);
          const audio = new Blob(chunks, { type: actualMime });
          if (!audio.size) throw new Error(failure);
          const form = new FormData();
          form.set(
            "audio",
            audio,
            actualMime === "audio/mp4" ? "recording.m4a" : "recording.webm",
          );
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
            signal: abort.signal,
          });
          const data = await response.json();
          if (id !== session.current) return;
          if (!response.ok)
            throw new Error(
              response.status === 503
                ? "Wprowadzanie głosowe jest teraz niedostępne. Możesz wpisać tekst."
                : failure,
            );
          if (typeof data.text !== "string") throw new Error(failure);
          if (data.text.trim()) {
            callback.current(data.text);
            setStatus("Tekst został rozpoznany. Sprawdź go przed wysłaniem.");
          } else
            setStatus(
              "Nie rozpoznaliśmy słów. Spróbuj ponownie lub wpisz tekst.",
            );
          setState("idle");
        } catch (error) {
          if (id !== session.current) return;
          setState("error");
          setStatus(
            error instanceof Error &&
              error.message ===
                "Wprowadzanie głosowe jest teraz niedostępne. Możesz wpisać tekst."
              ? error.message
              : failure,
          );
        } finally {
          clearTimeout(deadline);
          if (id === session.current) {
            uploadTimer.current = null;
            controller.current = null;
            recorder.current = null;
            active.current = false;
          }
        }
      };
      recording.start(1000);
      timer.current = setTimeout(stop, 60_000);
      setState("recording");
      setStatus("Nagrywamy…");
    } catch (error) {
      if (id !== session.current) return;
      dispose();
      setState("error");
      setStatus(
        error instanceof Error && error.message === "unsupported"
          ? "Ta przeglądarka nie obsługuje nagrywania. Możesz wpisać tekst."
          : error &&
              typeof error === "object" &&
              "name" in error &&
              error.name === "NotAllowedError"
            ? "Nie mamy dostępu do mikrofonu. Zezwól na dostęp w przeglądarce lub wpisz tekst."
            : "Mikrofon jest niedostępny. Sprawdź podłączenie lub wpisz tekst.",
      );
    }
  }
  return { state, status, start, stop, cancel };
}
