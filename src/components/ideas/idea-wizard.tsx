"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { GrantCall, Idea } from "@/types";
import { saveIdea } from "@/app/(public)/ideas/actions";
import { GrantDraftPanel } from "@/components/ideas/grant-draft-panel";
import { IdeaWorkspace } from "@/components/ideas/idea-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  draftToIdea,
  EMPTY_IDEA_DRAFT,
  fieldLabel,
  IDEA_STEPS,
  validateIdeaStep,
  type IdeaDraftValues,
} from "@/lib/ideas/draft";
import { STAGE_LABEL } from "@/lib/ideas/labels";
import { LOCAL_DRAFT_KEY, writeLocalIdea } from "@/lib/ideas/storage";

const BROWSER_NOTICE =
  "Pomysł jest zapisany tylko w tej przeglądarce. Zaloguj się, żeby wysłać go do Hubu.";

function subscribe() {
  return () => {};
}

function parseDraft(raw: string): { step: number; values: IdeaDraftValues } {
  if (!raw) return { step: 0, values: EMPTY_IDEA_DRAFT };
  try {
    const saved = JSON.parse(raw) as {
      step?: number;
      values?: Partial<IdeaDraftValues>;
    };
    return {
      step:
        typeof saved.step === "number"
          ? Math.min(Math.max(saved.step, 0), IDEA_STEPS.length - 1)
          : 0,
      values: { ...EMPTY_IDEA_DRAFT, ...saved.values },
    };
  } catch {
    return { step: 0, values: EMPTY_IDEA_DRAFT };
  }
}

export function IdeaWizard({
  call,
  signedIn,
}: {
  call: GrantCall | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipFocus = useRef(true);
  const fieldRefs = useRef(new Map<string, HTMLElement>());
  const stored = parseDraft(
    useSyncExternalStore(
      subscribe,
      () => window.localStorage.getItem(LOCAL_DRAFT_KEY) ?? "",
      () => "",
    ),
  );
  const client = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [edits, setEdits] = useState<{
    step: number;
    values: IdeaDraftValues;
  } | null>(null);
  const step = edits?.step ?? stored.step;
  const values = edits?.values ?? stored.values;
  const [error, setError] = useState<{
    field: keyof IdeaDraftValues;
    message: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string>();

  useEffect(() => {
    if (!client) return;
    window.localStorage.setItem(
      LOCAL_DRAFT_KEY,
      JSON.stringify({ step, values }),
    );
  }, [client, step, values]);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const current = IDEA_STEPS[step];
  const preview = draftToIdea(values, "draft", savedId ?? "local-preview");

  function update(field: keyof IdeaDraftValues, value: string) {
    setEdits((current) => {
      const base = current ?? { step: stored.step, values: stored.values };
      return {
        step: base.step,
        values: { ...base.values, [field]: value },
      };
    });
    setError((currentError) =>
      currentError?.field === field ? null : currentError,
    );
  }

  function changeStep(next: number) {
    setEdits((current) => {
      const base = current ?? { step: stored.step, values: stored.values };
      return { ...base, step: next };
    });
  }

  function goNext() {
    const issue = validateIdeaStep(step, values);
    if (issue) {
      setError(issue);
      fieldRefs.current.get(issue.field)?.focus();
      return;
    }
    setError(null);
    changeStep(Math.min(step + 1, IDEA_STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    changeStep(Math.max(step - 1, 0));
  }

  async function finish(status: Idea["status"]) {
    const issue = validateIdeaStep(step, values);
    if (issue) {
      setError(issue);
      fieldRefs.current.get(issue.field)?.focus();
      return;
    }
    setSaving(true);
    setFormError("");
    const id = savedId ?? `local-${crypto.randomUUID()}`;
    const idea = draftToIdea(values, status, id);
    const result = await saveIdea({ ...idea, id: savedId });
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    if (result.storage === "browser") {
      writeLocalIdea(idea);
      setSavedId(id);
      setNotice(BROWSER_NOTICE);
      return;
    }
    router.push(`/ideas/${result.id}`);
  }

  return (
    <IdeaWorkspace idea={preview}>
      <div className="flex flex-col gap-6">
        <p>
          Krok {step + 1} z {IDEA_STEPS.length}
        </p>
        <ol className="flex flex-wrap gap-2">
          {IDEA_STEPS.map((item, index) => (
            <li
              key={item.title}
              aria-current={index === step ? "step" : undefined}
              className={
                index === step
                  ? "border border-border px-2 py-1 font-semibold underline"
                  : "border border-border px-2 py-1"
              }
            >
              <span className="sr-only">{item.title}</span>
              <span aria-hidden="true">{index + 1}</span>
            </li>
          ))}
        </ol>
        <h2
          id="idea-step-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl text-heading outline-none"
        >
          {current.title}
        </h2>
        <div className="flex max-w-2xl flex-col gap-4">
          {current.fields.map((field) => (
            <Field
              key={field}
              field={field}
              value={values[field]}
              error={error}
              labelledBy={
                current.fields.length === 1 ? "idea-step-heading" : undefined
              }
              inputRef={(node) => {
                if (node) fieldRefs.current.set(field, node);
                else fieldRefs.current.delete(field);
              }}
              onChange={(value) => update(field, value)}
            />
          ))}
        </div>
        {current.review ? (
          <Review values={values} browserOnly={!signedIn || Boolean(notice)} />
        ) : null}
        {formError ? <p role="alert">{formError}</p> : null}
        <div className="flex flex-wrap gap-2">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              Wstecz
            </Button>
          ) : null}
          {step < IDEA_STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Dalej
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void finish("draft")}
              >
                Zapisz szkic
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void finish("submitted")}
              >
                Wyślij do Hubu
              </Button>
            </>
          )}
        </div>
        {current.review && call ? (
          <GrantDraftPanel call={call} idea={preview} signedIn={signedIn} />
        ) : null}
      </div>
    </IdeaWorkspace>
  );
}

function Review({
  values,
  browserOnly,
}: {
  values: IdeaDraftValues;
  browserOnly: boolean;
}) {
  return (
    <section
      aria-labelledby="review-heading"
      className="flex max-w-2xl flex-col gap-3"
    >
      <h3 id="review-heading" className="text-xl text-heading">
        Podsumowanie
      </h3>
      <dl className="flex flex-col gap-2">
        <div>
          <dt className="font-medium">Tytuł</dt>
          <dd>{values.title || "Nie podano."}</dd>
        </div>
        <div>
          <dt className="font-medium">Dla kogo</dt>
          <dd>{values.targetGroup}</dd>
        </div>
        <div>
          <dt className="font-medium">Istota</dt>
          <dd>{values.summary}</dd>
        </div>
        <div>
          <dt className="font-medium">Etap</dt>
          <dd>{STAGE_LABEL[values.stage]}</dd>
        </div>
      </dl>
      {browserOnly ? <p role="status">{BROWSER_NOTICE}</p> : null}
    </section>
  );
}

function Field({
  field,
  value,
  error,
  labelledBy,
  inputRef,
  onChange,
}: {
  field: keyof IdeaDraftValues;
  value: string;
  error: { field: keyof IdeaDraftValues; message: string } | null;
  labelledBy?: string;
  inputRef: (node: HTMLElement | null) => void;
  onChange: (value: string) => void;
}) {
  const id = `idea-${field}`;
  const invalid = error?.field === field;
  const describedBy = invalid ? `${id}-error` : undefined;
  const label = fieldLabel(field);

  if (field === "stage") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{label}</Label>
        <select
          id={id}
          ref={(node) => inputRef(node)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 border border-border bg-background px-3"
        >
          <option value="idea">Pomysł</option>
          <option value="prototype">Prototyp</option>
          <option value="pilot">Pilotaż</option>
        </select>
      </div>
    );
  }

  const shared = {
    id,
    value,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    "aria-labelledby": labelledBy,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  };

  return (
    <div className="flex flex-col gap-2">
      {labelledBy ? null : <Label htmlFor={id}>{label}</Label>}
      {field === "title" || field === "municipality" ? (
        <Input
          {...shared}
          ref={(node) => inputRef(node)}
          maxLength={field === "title" ? 160 : 120}
        />
      ) : (
        <Textarea
          {...shared}
          ref={(node) => inputRef(node)}
          maxLength={2000}
          className="min-h-28"
        />
      )}
      {invalid ? (
        <p id={`${id}-error`} role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
