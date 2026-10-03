"use client";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import {
  saveInnovationAction,
  setInnovationStatusAction,
} from "@/app/admin/actions";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ErrorSummary,
  RequiredFieldsNote,
  RequiredMark,
  useFocusErrorSummary,
  type FormErrorItem,
} from "@/components/forms/error-summary";
import {
  INNOVATION_STATUSES,
  innovationFormSchema,
  parseTags,
  type InnovationFormValues,
} from "@/lib/admin/innovation-schema";
import type { AdminInnovation } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const NEW_CATEGORY = "__new";
const FIELD_ORDER = [
  "title",
  "summary",
  "description",
  "category",
  "targetGroup",
  "region",
  "tags",
  "videoUrl",
  "imageUrl",
  "status",
] as const;
const CONTROL = "text-base md:text-base";
const SELECT =
  "min-h-11 w-full rounded-lg border border-input bg-background px-2.5 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring aria-invalid:border-destructive";

function describedBy(...ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(" ") || undefined;
}

function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base font-semibold">
        {label}
        {required && <RequiredMark />}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="text-base text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
      {error?.message && (
        <p
          id={`${id}-error`}
          className="flex items-start gap-2 text-base font-semibold text-destructive"
        >
          <ExclamationCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          {error.message}
        </p>
      )}
    </div>
  );
}

function toFormValues(
  innovation: AdminInnovation | null,
): InnovationFormValues {
  return {
    title: innovation?.title ?? "",
    summary: innovation?.summary ?? "",
    description: innovation?.description ?? "",
    category: innovation?.category ?? "",
    targetGroup: innovation?.targetGroup ?? "",
    region: innovation?.region ?? "",
    tags: innovation?.tags.join(", ") ?? "",
    videoUrl: innovation?.videoUrl ?? "",
    imageUrl: innovation?.imageUrl ?? "",
    status: innovation?.status ?? "draft",
  };
}

export function InnovationForm({
  innovation,
  categories,
}: {
  innovation: AdminInnovation | null;
  categories: string[];
}) {
  const router = useRouter();
  const { pending, message, run } = useAdminAction();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const initialCategory = innovation?.category ?? "";
  const [categoryChoice, setCategoryChoice] = useState(
    !initialCategory || categories.includes(initialCategory)
      ? initialCategory
      : NEW_CATEGORY,
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitted, submitCount },
  } = useForm<InnovationFormValues>({
    resolver: zodResolver(innovationFormSchema),
    defaultValues: toFormValues(innovation),
    mode: "onBlur",
    shouldFocusError: false,
  });
  const tags = parseTags(useWatch({ control, name: "tags" }) ?? "");

  const submit = handleSubmit((values) => {
    if (pending) return;
    run(
      () => saveInnovationAction(innovation?.id ?? null, values),
      (result) => {
        if (result.ok) router.push("/admin/innovations");
      },
    );
  });

  // The category value lives in a select that react-hook-form does not
  // register, so its summary link targets whichever control is visible.
  const summaryErrors: FormErrorItem[] = FIELD_ORDER.flatMap((name) => {
    const message = errors[name]?.message;
    if (!message) return [];
    const fieldId =
      name === "category" && categoryChoice !== NEW_CATEGORY
        ? "category-choice"
        : name;
    return [{ fieldId, message }];
  });
  const summaryRef = useFocusErrorSummary(
    submitCount,
    summaryErrors.length > 0,
  );

  const invalid = (error?: FieldError) => (error ? true : undefined);

  return (
    <>
      <form
        onSubmit={submit}
        noValidate
        className="flex max-w-3xl flex-col gap-6"
        aria-label={innovation ? "Edycja innowacji" : "Nowa innowacja"}
      >
        {submitCount > 0 && (
          <ErrorSummary ref={summaryRef} errors={summaryErrors} />
        )}
        <RequiredFieldsNote />
        <Field id="title" label="Tytuł" required error={errors.title}>
          <Input
            autoComplete="off"
            id="title"
            aria-required="true"
            aria-invalid={invalid(errors.title)}
            aria-describedby={describedBy(errors.title && "title-error")}
            className={CONTROL}
            {...register("title")}
          />
        </Field>

        <Field
          id="summary"
          label="Podsumowanie"
          required
          hint="Jedno lub dwa zdania widoczne na liście bazy wiedzy."
          error={errors.summary}
        >
          <Textarea
            autoComplete="off"
            id="summary"
            aria-required="true"
            rows={2}
            aria-invalid={invalid(errors.summary)}
            aria-describedby={describedBy(
              "summary-hint",
              errors.summary && "summary-error",
            )}
            className={cn(CONTROL, "field-sizing-fixed")}
            {...register("summary")}
          />
        </Field>

        <Field
          id="description"
          label="Opis"
          required
          hint="Na czym polega rozwiązanie, kto je prowadzi i czego potrzeba do wdrożenia."
          error={errors.description}
        >
          <Textarea
            autoComplete="off"
            id="description"
            aria-required="true"
            rows={8}
            aria-invalid={invalid(errors.description)}
            aria-describedby={describedBy(
              "description-hint",
              errors.description && "description-error",
            )}
            className={cn(CONTROL, "field-sizing-fixed")}
            {...register("description")}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id="category-choice"
            label="Kategoria"
            required
            error={
              categoryChoice === NEW_CATEGORY ? undefined : errors.category
            }
          >
            <select
              id="category-choice"
              aria-required="true"
              value={categoryChoice}
              aria-invalid={
                categoryChoice !== NEW_CATEGORY
                  ? invalid(errors.category)
                  : undefined
              }
              aria-describedby={describedBy(
                categoryChoice !== NEW_CATEGORY &&
                  errors.category &&
                  "category-choice-error",
              )}
              onChange={(event) => {
                const value = event.target.value;
                setCategoryChoice(value);
                setValue("category", value === NEW_CATEGORY ? "" : value, {
                  shouldValidate: isSubmitted,
                });
              }}
              className={SELECT}
            >
              <option value="">Wybierz kategorię</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              <option value={NEW_CATEGORY}>Nowa kategoria…</option>
            </select>
          </Field>
          {categoryChoice === NEW_CATEGORY && (
            <Field
              id="category"
              label="Nazwa nowej kategorii"
              required
              error={errors.category}
            >
              <Input
                autoComplete="off"
                id="category"
                aria-required="true"
                aria-invalid={invalid(errors.category)}
                aria-describedby={describedBy(
                  errors.category && "category-error",
                )}
                className={CONTROL}
                {...register("category")}
              />
            </Field>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id="targetGroup"
            label="Dla kogo"
            required
            error={errors.targetGroup}
          >
            <Input
              autoComplete="off"
              id="targetGroup"
              aria-required="true"
              aria-invalid={invalid(errors.targetGroup)}
              aria-describedby={describedBy(
                errors.targetGroup && "targetGroup-error",
              )}
              className={CONTROL}
              {...register("targetGroup")}
            />
          </Field>
          <Field
            id="region"
            label="Region"
            hint="Na przykład: powiat nowotarski."
            error={errors.region}
          >
            <Input
              autoComplete="off"
              id="region"
              aria-invalid={invalid(errors.region)}
              aria-describedby={describedBy(
                "region-hint",
                errors.region && "region-error",
              )}
              className={CONTROL}
              {...register("region")}
            />
          </Field>
        </div>

        <Field
          id="tags"
          label="Tagi"
          hint="Oddziel tagi przecinkami, na przykład: seniorzy, transport."
          error={errors.tags}
        >
          <Input
            autoComplete="off"
            id="tags"
            aria-invalid={invalid(errors.tags)}
            aria-describedby={describedBy(
              "tags-hint",
              "tags-preview",
              errors.tags && "tags-error",
            )}
            className={CONTROL}
            {...register("tags")}
          />
          <div
            id="tags-preview"
            className="flex flex-wrap items-center gap-2 text-base"
          >
            <span className="text-muted-foreground">
              {tags.length ? "Tagi:" : "Brak tagów."}
            </span>
            {tags.map((tag) => (
              <span key={tag} className="rounded-sm bg-muted px-2 py-1 text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </Field>

        <Field
          id="videoUrl"
          label="Film"
          hint="Link https do YouTube albo Vimeo."
          error={errors.videoUrl}
        >
          <Input
            autoComplete="off"
            id="videoUrl"
            type="url"
            inputMode="url"
            aria-invalid={invalid(errors.videoUrl)}
            aria-describedby={describedBy(
              "videoUrl-hint",
              errors.videoUrl && "videoUrl-error",
            )}
            className={CONTROL}
            {...register("videoUrl")}
          />
        </Field>

        <Field
          id="imageUrl"
          label="Zdjęcie"
          hint="Link https. Użyj zdjęcia, do którego masz prawa, na przykład na licencji CC BY, i podaj autora w opisie."
          error={errors.imageUrl}
        >
          <Input
            autoComplete="off"
            id="imageUrl"
            type="url"
            inputMode="url"
            aria-invalid={invalid(errors.imageUrl)}
            aria-describedby={describedBy(
              "imageUrl-hint",
              errors.imageUrl && "imageUrl-error",
            )}
            className={CONTROL}
            {...register("imageUrl")}
          />
        </Field>

        <Field
          id="status"
          label="Status"
          required
          hint="Tylko opublikowane innowacje są widoczne w bazie wiedzy i w dopasowaniu."
          error={errors.status}
        >
          <select
            id="status"
            aria-required="true"
            aria-describedby="status-hint"
            className={cn(SELECT, "sm:max-w-xs")}
            {...register("status")}
          >
            {INNOVATION_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
          <Button
            type="submit"
            aria-disabled={pending || undefined}
            className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
          >
            {pending ? "Zapisuję…" : "Zapisz"}
          </Button>
          <Link
            href="/admin/innovations"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto min-h-11 max-w-full py-2 text-base whitespace-normal",
            )}
          >
            Anuluj
          </Link>
          {innovation && innovation.status !== "archived" && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setArchiveOpen(true)}
              className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal sm:ml-auto"
            >
              Archiwizuj
            </Button>
          )}
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {pending ? "Zapisuję…" : message}
        </p>
      </form>

      {innovation && (
        <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <DialogContent
            showCloseButton={false}
            className="gap-4 p-6 sm:max-w-md"
          >
            <DialogTitle className="text-xl font-semibold">
              Zarchiwizować innowację?
            </DialogTitle>
            <DialogDescription className="text-base text-foreground">
              „{innovation.title}” zniknie z bazy wiedzy i z dopasowania. Wpis
              zostanie w panelu. Możesz go przywrócić, zmieniając status na
              „Opublikowana”.
            </DialogDescription>
            <DialogFooter className="-mx-6 -mb-6 p-4">
              <DialogClose
                render={
                  <Button
                    variant="outline"
                    className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
                  />
                }
              >
                Anuluj
              </DialogClose>
              <Button
                type="button"
                className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
                onClick={() =>
                  run(
                    () => setInnovationStatusAction(innovation.id, "archived"),
                    (result) => {
                      setArchiveOpen(false);
                      if (result.ok) router.push("/admin/innovations");
                    },
                  )
                }
              >
                Zarchiwizuj
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
