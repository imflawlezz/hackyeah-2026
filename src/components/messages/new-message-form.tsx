"use client";
import { VoiceFieldInput } from "@/components/voice/voice-field-input";
import { appendTranscript } from "@/lib/voice/append";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, startTransition } from "react";
import { startConversation } from "@/app/(public)/messages/actions";
import {
  CHALLENGE_SUBJECT,
  clearChallengeDraft,
  readChallengeDraft,
} from "@/lib/match/challenge-draft";
import { getMockStore } from "@/lib/messages/mock-store";
import { startConversationSchema } from "@/lib/messages/schemas";
import { DemoBanner } from "./messages-workspace";
import type { ConversationKind } from "@/types";
import {
  ErrorSummary,
  RequiredFieldsNote,
  RequiredMark,
  errorItems,
  useFocusErrorSummary,
} from "@/components/forms/error-summary";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FieldError } from "@/components/testing/fields";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<"recipient" | "subject" | "body", string>>;

/** Per-field checks for the error summary; the schema still runs on submit. */
function fieldMessage(
  name: keyof FieldErrors,
  value: string,
  recipientRequired: boolean,
): string | undefined {
  const text = value.trim();
  if (name === "recipient") {
    return recipientRequired && !text
      ? "Wpisz identyfikator konta partnera."
      : undefined;
  }
  if (name === "subject") {
    if (!text) return "Wpisz temat wiadomości.";
    return text.length > 200
      ? "Temat może mieć najwyżej 200 znaków."
      : undefined;
  }
  if (!text) return "Wpisz treść wiadomości.";
  return text.length > 4000
    ? "Wiadomość może mieć najwyżej 4000 znaków."
    : undefined;
}

// sessionStorage does not change while the form is open.
const subscribeToNothing = () => () => {};

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
  const fromMatch = subject === CHALLENGE_SUBJECT && !innovationId && !ideaId;
  // "Zgłoś nowe wyzwanie" on /match leaves the problem description in
  // sessionStorage, so it never travels in the URL. It fills the message until
  // the visitor edits it.
  const draft = useSyncExternalStore(
    subscribeToNothing,
    () => (fromMatch ? readChallengeDraft() : ""),
    () => "",
  );
  const [typed, setTyped] = useState<string | null>(null);
  const body = typed ?? draft;
  const setBody = (next: string | ((current: string) => string)) =>
    setTyped((current) =>
      typeof next === "function" ? next(current ?? draft) : next,
    );
  const [kind, setKind] = useState(initialKind);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitCount, setSubmitCount] = useState(0);
  const router = useRouter();
  const recipientRequired = kind === "partnership" && !demo;
  const summaryErrors = errorItems([
    ["new-recipient", fieldErrors.recipient],
    ["new-subject", fieldErrors.subject],
    ["new-body", fieldErrors.body],
  ]);
  const summaryRef = useFocusErrorSummary(
    submitCount,
    summaryErrors.length > 0,
  );

  function validateField(name: keyof FieldErrors, value: string) {
    setFieldErrors((current) => ({
      ...current,
      [name]: fieldMessage(name, value, recipientRequired),
    }));
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[{ href: "/messages", label: "Wiadomości" }]}
        current="Napisz wiadomość"
      />
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
        noValidate
        aria-label="Nowa wiadomość"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const nextErrors: FieldErrors = {
            recipient: fieldMessage(
              "recipient",
              String(form.get("recipient") ?? ""),
              recipientRequired,
            ),
            subject: fieldMessage(
              "subject",
              String(form.get("subject") ?? ""),
              recipientRequired,
            ),
            body: fieldMessage(
              "body",
              String(form.get("body") ?? ""),
              recipientRequired,
            ),
          };
          setFieldErrors(nextErrors);
          setSubmitCount((count) => count + 1);
          if (Object.values(nextErrors).some(Boolean)) return;
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
              if (fromMatch) clearChallengeDraft();
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
        {submitCount > 0 && (
          <ErrorSummary ref={summaryRef} errors={summaryErrors} />
        )}
        <RequiredFieldsNote />
        <fieldset>
          <legend className="font-semibold">
            Do kogo piszesz?
            <RequiredMark />
          </legend>
          {(["ask_rops", "ask_expert", "partnership"] as const).map(
            (value, i) => (
              <label key={value} className="flex min-h-11 items-center gap-2.5">
                <Radio
                  name="kind"
                  value={value}
                  required
                  checked={kind === value}
                  onChange={() => setKind(value)}
                />
                {["Napisz do ROPS", "Zapytaj eksperta", "Szukam partnera"][i]}
              </label>
            ),
          )}
        </fieldset>
        {kind === "ask_expert" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="new-recipient" className="font-semibold">
              Ekspert
            </label>
            <NativeSelect id="new-recipient" name="recipient">
              <option value="">Wszyscy eksperci</option>
              {experts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        {kind === "partnership" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="new-recipient" className="font-semibold">
              Odbiorca
              <RequiredMark />
            </label>
            {demo ? (
              <NativeSelect
                id="new-recipient"
                name="recipient"
                aria-required="true"
              >
                <option value="demo-cus">CUS w Gminie Przykładowej</option>
              </NativeSelect>
            ) : (
              <>
                <span id="recipient-hint" className="block text-sm">
                  Wpisz identyfikator konta partnera przekazany przez tę osobę.
                </span>
                <Input
                  id="new-recipient"
                  name="recipient"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  aria-required="true"
                  aria-invalid={fieldErrors.recipient ? true : undefined}
                  aria-describedby={cn(
                    "recipient-hint",
                    fieldErrors.recipient && "new-recipient-error",
                  )}
                  onBlur={(e) => validateField("recipient", e.target.value)}
                />
                <FieldError
                  id="new-recipient-error"
                  message={fieldErrors.recipient}
                />
              </>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="new-subject" className="font-semibold">
            Temat
            <RequiredMark />
          </label>
          <Input
            id="new-subject"
            name="subject"
            type="text"
            autoComplete="off"
            aria-required="true"
            maxLength={200}
            defaultValue={subject}
            aria-invalid={fieldErrors.subject ? true : undefined}
            aria-describedby={
              fieldErrors.subject ? "new-subject-error" : undefined
            }
            onBlur={(e) => validateField("subject", e.target.value)}
          />
          <FieldError id="new-subject-error" message={fieldErrors.subject} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="new-body" className="font-semibold">
            Twoja wiadomość
            <RequiredMark />
          </label>
          <Textarea
            autoComplete="off"
            id="new-body"
            name="body"
            aria-required="true"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            aria-invalid={fieldErrors.body ? true : undefined}
            aria-describedby={fieldErrors.body ? "new-body-error" : undefined}
            onBlur={(e) => validateField("body", e.target.value)}
            className="field-sizing-fixed min-h-40"
          />
          <FieldError id="new-body-error" message={fieldErrors.body} />
        </div>
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
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-sm bg-primary px-6 py-2 text-primary-foreground hover:bg-primary-hover active:bg-navy"
        >
          {busy ? "Wysyłamy…" : "Wyślij"}
        </button>
      </form>
    </div>
  );
}
