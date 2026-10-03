"use client";
import { VoiceFieldInput } from "@/components/voice/voice-field-input";
import { appendTranscript } from "@/lib/voice/append";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, startTransition } from "react";
import { startConversation } from "@/app/(public)/messages/actions";
import { getMockStore } from "@/lib/messages/mock-store";
import { startConversationSchema } from "@/lib/messages/schemas";
import { DemoBanner } from "./messages-workspace";
import type { ConversationKind } from "@/types";
export function NewMessageForm({
  demo,
  experts,
  subject,
  innovationId,
  ideaId,
  initialKind,
}: {
  demo: boolean;
  experts: { id: string; displayName: string }[];
  subject: string;
  innovationId?: string;
  ideaId?: string;
  initialKind: ConversationKind;
}) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState(initialKind);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl text-heading">Napisz wiadomość</h1>
      {demo && <DemoBanner />}
      {(innovationId || ideaId) && (
        <p className="border bg-muted p-4">
          Rozmowa dotyczy:{" "}
          <Link
            className="text-primary underline"
            href={
              innovationId ? `/knowledge/${innovationId}` : `/ideas/${ideaId}`
            }
          >
            {subject || "Zobacz kontekst"}
          </Link>
        </p>
      )}
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const result = startConversationSchema.safeParse({
            kind,
            subject: form.get("subject"),
            body: form.get("body"),
            recipient: form.get("recipient") || undefined,
            innovationId,
            ideaId,
          });
          if (!result.success) {
            setError(
              "Sprawdź temat, wiadomość i odbiorcę. Temat może mieć 200 znaków, a wiadomość 4000.",
            );
            return;
          }
          setBusy(true);
          setError("");
          startTransition(async () => {
            try {
              const id = demo
                ? getMockStore().start(result.data)
                : await startConversation(result.data);
              router.push(`/messages/${id}`);
            } catch {
              setError(
                "Nie udało się rozpocząć rozmowy. Sprawdź odbiorcę i spróbuj ponownie.",
              );
              setBusy(false);
            }
          });
        }}
      >
        <fieldset>
          <legend className="font-semibold">Do kogo piszesz?</legend>
          {(["ask_rops", "ask_expert", "partnership"] as const).map(
            (value, i) => (
              <label key={value} className="flex min-h-11 items-center gap-3">
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => setKind(value)}
                />
                {["Napisz do ROPS", "Zapytaj eksperta", "Szukam partnera"][i]}
              </label>
            ),
          )}
        </fieldset>
        {kind === "ask_expert" && (
          <label className="block">
            Ekspert (opcjonalnie)
            <select
              name="recipient"
              className="mt-2 min-h-11 w-full border border-input p-2"
            >
              <option value="">Wszyscy eksperci</option>
              {experts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind === "partnership" && (
          <label className="block">
            Odbiorca
            {demo ? (
              <select
                name="recipient"
                className="mt-2 min-h-11 w-full border border-input p-2"
              >
                <option value="demo-cus">CUS w Gminie Przykładowej</option>
              </select>
            ) : (
              <>
                <input
                  name="recipient"
                  required
                  className="mt-2 min-h-11 w-full border border-input p-2"
                  aria-describedby="recipient-hint"
                />
                <span id="recipient-hint" className="block text-sm">
                  Wpisz identyfikator konta partnera przekazany przez tę osobę.
                </span>
              </>
            )}
          </label>
        )}
        <label className="block">
          Temat
          <input
            name="subject"
            required
            maxLength={200}
            defaultValue={subject}
            className="mt-2 min-h-11 w-full border border-input p-3"
            aria-describedby={error ? "new-error" : undefined}
          />
        </label>
        <label className="block">
          Twoja wiadomość
          <textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            maxLength={4000}
            className="mt-2 min-h-40 w-full border border-input p-3"
            aria-describedby={error ? "new-error" : undefined}
          />
        </label>
        <VoiceFieldInput
          getValue={() => body}
          onChange={(_value, text) =>
            setBody(
              (current) => appendTranscript(current, text, 4000) ?? current,
            )
          }
          limit={4000}
          disabled={busy}
        />
        {error && (
          <p id="new-error" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="min-h-11 bg-primary px-6 py-2 text-primary-foreground"
        >
          {busy ? "Wysyłamy…" : "Wyślij"}
        </button>
      </form>
    </div>
  );
}
