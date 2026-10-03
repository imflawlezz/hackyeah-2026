"use client";

import { FormEvent, useId, useRef, useState } from "react";
import type { Idea } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTERS = [
  "Jak sprawdzić, czy to potrzebne?",
  "Z kim mogę współpracować w gminie?",
  "Co może pójść nie tak?",
];

export function AssistantPanel({
  idea,
  showHeading = true,
}: {
  idea?: Partial<Idea>;
  showHeading?: boolean;
}) {
  const baseId = useId();
  const questionId = `${baseId}-question`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const streamedRef = useRef("");

  async function send(text?: string) {
    const content = (text ?? draft).trim();
    if (!content || pending) return;
    setError("");
    setDraft("");
    const history = [
      ...messages.map(({ role, content: body }) => ({ role, content: body })),
      { role: "user" as const, content },
    ].slice(-12);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content },
    ]);
    const controller = new AbortController();
    abortRef.current = controller;
    setPending(true);
    setStreaming("");
    streamedRef.current = "";
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, context: { idea } }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(
          payload?.error ??
            "Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.",
        );
        return;
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          streamedRef.current = full;
          setStreaming(full);
        }
      } else {
        full = await response.text();
      }
      if (full.trim()) {
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", content: full.trim() },
        ]);
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        const partial = streamedRef.current.trim();
        if (partial) {
          setMessages((current) => [
            ...current,
            { id: crypto.randomUUID(), role: "assistant", content: partial },
          ]);
        }
        return;
      }
      setError("Połączenie przerwane. Spróbuj wysłać pytanie jeszcze raz.");
    } finally {
      setStreaming("");
      setPending(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  return (
    <section
      aria-labelledby={`${baseId}-title`}
      className="flex flex-col gap-4"
    >
      <h2
        id={`${baseId}-title`}
        className={`text-xl text-heading ${showHeading ? "" : "sr-only"}`}
      >
        Asystent
      </h2>
      <p className="text-sm">
        Tekst przygotowany automatycznie. Sprawdź go przed użyciem.
      </p>
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex max-h-80 flex-col gap-3 overflow-y-auto border border-border p-3"
      >
        {messages.length ? (
          messages.map((message) => (
            <p key={message.id}>
              <span className="font-medium">
                {message.role === "user" ? "Ty" : "Asystent"}:{" "}
              </span>
              {message.content}
            </p>
          ))
        ) : (
          <p className="text-muted-foreground">
            Zadaj jedno pytanie o swój pomysł.
          </p>
        )}
      </div>
      {streaming ? (
        <p aria-hidden="true">
          <span className="font-medium">Asystent: </span>
          {streaming}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {STARTERS.map((starter) => (
          <li key={starter}>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 w-full justify-start text-left whitespace-normal"
              disabled={pending}
              onClick={() => void send(starter)}
            >
              {starter}
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Label htmlFor={questionId}>Twoje pytanie</Label>
        <Textarea
          id={questionId}
          value={draft}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            Wyślij
          </Button>
          {pending ? (
            <Button type="button" variant="outline" onClick={stop}>
              Zatrzymaj
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
