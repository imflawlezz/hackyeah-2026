"use client";
import { VoiceFieldInput } from "@/components/voice/voice-field-input";

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
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import {
  ErrorSummary,
  RequiredFieldsNote,
  RequiredMark,
  useFocusErrorSummary,
} from "@/components/forms/error-summary";
import { Textarea } from "@/components/ui/textarea";
import {
  draftToIdea,
  EMPTY_IDEA_DRAFT,
  fieldLabel,
  IDEA_STEPS,
  ideaToDraftValues,
  validateIdeaStep,
  type IdeaDraftValues,
} from "@/lib/ideas/draft";
import { STAGE_LABEL } from "@/lib/ideas/labels";
import {
  LOCAL_DRAFT_KEY,
  readLocalIdea,
  writeLocalIdea,
} from "@/lib/ideas/storage";

const BROWSER_NOTICE =
  "Pomysł jest zapisany tylko w tej przeglądarce. Zaloguj się, żeby wysłać go do Hubu.";

function subscribe() {
  return () => {};
}

/** Existing draft the author is editing; absent for a new idea. */
export type WizardDraft = { id: string; values: IdeaDraftValues };

const LAST_STEP = IDEA_STEPS.length - 1;

/** validateIdeaStep checks every field except these two; stage always has a value. */
function isRequiredIdeaField(field: keyof IdeaDraftValues): boolean {
  return field !== "municipality";
}

export function IdeaWizard({
  call,
  signedIn,
  initialDraft,
  localDraftId,
}: {
  call: GrantCall | null;
  signedIn: boolean;
  /** A database draft owned by the signed-in user. */
  initialDraft?: WizardDraft;
  /** A draft kept in this browser (demo mode or signed out). */
  localDraftId?: string;
}) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipFocus = useRef(true);
  const fieldRefs = useRef(new Map<string, HTMLElement>());
  const localRaw = useSyncExternalStore(
    subscribe,
    () => {
      if (!localDraftId) return "";
      const idea = readLocalIdea(localDraftId);
      return idea?.status === "draft" ? JSON.stringify(idea) : "";
    },
    () => "",
  );
  const localDraft: WizardDraft | undefined =
    localDraftId && localRaw
      ? {
          id: localDraftId,
          values: ideaToDraftValues(JSON.parse(localRaw) as Idea),
        }
      : undefined;
  const editing = initialDraft ?? localDraft;
  // A new idea starts empty at step 1; an edited draft opens at the summary,
  // where it can be checked and sent.
  const stored = editing
    ? { step: LAST_STEP, values: editing.values }
    : { step: 0, values: EMPTY_IDEA_DRAFT };
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
  const [stepAttempts, setStepAttempts] = useState(0);
  const summaryErrors = error
    ? [{ fieldId: `idea-${error.field}`, message: error.message }]
    : [];
  const summaryRef = useFocusErrorSummary(
    stepAttempts,
    summaryErrors.length > 0,
  );
  const [saving, setSaving] = useState(false);
  const [newId, setNewId] = useState<string>();
  // Saving or sending an edited draft always updates that row, never inserts.
  const savedId = newId ?? editing?.id;

  useEffect(() => {
    // Older versions autosaved a half-filled form here and reopened it at the
    // last step on every visit; that copy is no longer used.
    try {
      window.localStorage.removeItem(LOCAL_DRAFT_KEY);
    } catch {
      /* Storage may be blocked; nothing to clean up then. */
    }
  }, []);

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
      // Gov.pl forms: focus moves to the error summary, which links the field.
      setStepAttempts((count) => count + 1);
      return;
    }
    setError(null);
    changeStep(Math.min(step + 1, IDEA_STEPS.length - 1));
  }

  /** Validate on blur: show this field's problem, or clear it once fixed. */
  function validateOnBlur(field: keyof IdeaDraftValues) {
    const issue = validateIdeaStep(step, values);
    if (issue?.field === field) setError(issue);
    else
      setError((currentError) =>
        currentError?.field === field ? null : currentError,
      );
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
    const result = await saveIdea({
      ...idea,
      id: savedId?.startsWith("local-") ? undefined : savedId,
    });
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    if (result.storage === "browser") {
      writeLocalIdea(idea);
      setNewId(id);
      setNotice(BROWSER_NOTICE);
      return;
    }
    // Remember the row so a second click updates it instead of inserting.
    setNewId(result.id);
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
          {current.fields.length === 1 &&
          isRequiredIdeaField(current.fields[0]) ? (
            <RequiredMark />
          ) : null}
        </h2>
        {current.review ? null : <RequiredFieldsNote />}
        {stepAttempts > 0 && error ? (
          <ErrorSummary ref={summaryRef} errors={summaryErrors} />
        ) : null}
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
              onBlur={() => validateOnBlur(field)}
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
      className="flex max-w-2xl flex-col gap-2.5"
    >
      <h3 id="review-heading" className="text-xl text-heading">
        Podsumowanie
      </h3>
      <dl className="flex flex-col gap-2">
        <div>
          <dt className="font-semibold">Tytuł</dt>
          <dd>{values.title || "Nie podano."}</dd>
        </div>
        <div>
          <dt className="font-semibold">Dla kogo</dt>
          <dd>{values.targetGroup}</dd>
        </div>
        <div>
          <dt className="font-semibold">Istota</dt>
          <dd>{values.summary}</dd>
        </div>
        <div>
          <dt className="font-semibold">Etap</dt>
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
  onBlur,
}: {
  field: keyof IdeaDraftValues;
  value: string;
  error: { field: keyof IdeaDraftValues; message: string } | null;
  labelledBy?: string;
  inputRef: (node: HTMLElement | null) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const id = `idea-${field}`;
  const invalid = error?.field === field;
  const describedBy = invalid ? `${id}-error` : undefined;
  const label = fieldLabel(field);
  const required = isRequiredIdeaField(field);
  const labelText = (
    <>
      {label}
      {required ? <RequiredMark /> : null}
    </>
  );

  if (field === "stage") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{labelText}</Label>
        <NativeSelect
          id={id}
          aria-required="true"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          ref={(node) => inputRef(node)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        >
          <option value="idea">Pomysł</option>
          <option value="prototype">Prototyp</option>
          <option value="pilot">Pilotaż</option>
        </NativeSelect>
        {invalid && error ? (
          <p id={`${id}-error`} role="alert">
            {error.message}
          </p>
        ) : null}
      </div>
    );
  }

  const shared = {
    id,
    value,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    "aria-labelledby": labelledBy,
    "aria-required": required || undefined,
    onBlur,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  };

  return (
    <div className="flex flex-col gap-2">
      {labelledBy ? null : <Label htmlFor={id}>{labelText}</Label>}
      {field === "title" || field === "municipality" ? (
        <Input
          autoComplete="off"
          {...shared}
          ref={(node) => inputRef(node)}
          maxLength={field === "title" ? 160 : 120}
        />
      ) : (
        <Textarea
          autoComplete="off"
          {...shared}
          ref={(node) => inputRef(node)}
          maxLength={2000}
          className="min-h-28"
        />
      )}
      <VoiceFieldInput
        getValue={() => value}
        onChange={onChange}
        limit={field === "title" ? 160 : field === "municipality" ? 120 : 2000}
      />
      {invalid ? (
        <p id={`${id}-error`} role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
