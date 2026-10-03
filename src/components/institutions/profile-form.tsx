"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  ChoiceGroup,
  FieldError,
  TextField,
} from "@/components/testing/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUDGET_BAND_OPTIONS,
  CONSTRAINTS_MAX_LENGTH,
  INSTITUTION_TYPE_OPTIONS,
  MUNICIPALITY_TYPE_OPTIONS,
  NEED_MAX_LENGTH,
  parseStoredProfile,
  POPULATION_BAND_OPTIONS,
  PROFILE_FORM_DEFAULTS,
  PROFILE_STORAGE_KEY,
  type ProfileFormInput,
  type ProfileFormValues,
  profileFormSchema,
  TIMELINE_OPTIONS,
} from "@/lib/institutions/form";
import { cn } from "@/lib/utils";
import type { InstitutionProfile } from "@/types";

const SELECT_CLASSES =
  "min-h-12 w-full rounded-md border border-input bg-background px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

const LABEL_CLASSES = "text-lg leading-snug font-semibold";

export function ProfileForm({
  submitLabel,
  busy,
  onSubmit,
}: {
  submitLabel: string;
  busy: boolean;
  onSubmit: (profile: InstitutionProfile) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    subscribe,
    control,
    formState: { errors },
  } = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: PROFILE_FORM_DEFAULTS,
  });

  // Answers survive a reload and a trip to another page in this tab.
  useEffect(() => {
    let stored: ProfileFormInput | null = null;
    try {
      stored = parseStoredProfile(
        window.sessionStorage.getItem(PROFILE_STORAGE_KEY),
      );
    } catch {
      // Storage can be blocked; the form simply starts empty.
    }
    if (stored) reset(stored);

    return subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        try {
          window.sessionStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(values),
          );
        } catch {
          // Nothing to do: the answers stay in the form for this visit.
        }
      },
    });
  }, [reset, subscribe]);

  return (
    <form
      onSubmit={handleSubmit((values) => {
        if (!busy) onSubmit(values);
      })}
      noValidate
      aria-label="Opis instytucji"
      className="flex max-w-3xl flex-col gap-10"
    >
      <fieldset className="flex flex-col gap-8">
        <legend className="mb-6 font-heading text-xl font-semibold text-heading">
          Twoja instytucja
        </legend>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="institution-type" className={LABEL_CLASSES}>
              Typ instytucji
            </Label>
            <select
              id="institution-type"
              aria-invalid={errors.institutionType ? true : undefined}
              aria-describedby={
                errors.institutionType ? "institution-type-error" : undefined
              }
              className={SELECT_CLASSES}
              {...register("institutionType")}
            >
              <option value="">Wybierz z listy</option>
              {INSTITUTION_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError
              id="institution-type-error"
              message={errors.institutionType?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="municipality-type" className={LABEL_CLASSES}>
              Rodzaj gminy (opcjonalnie)
            </Label>
            <select
              id="municipality-type"
              aria-invalid={errors.municipalityType ? true : undefined}
              aria-describedby={
                errors.municipalityType ? "municipality-type-error" : undefined
              }
              className={SELECT_CLASSES}
              {...register("municipalityType")}
            >
              <option value="">Nie dotyczy</option>
              {MUNICIPALITY_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError
              id="municipality-type-error"
              message={errors.municipalityType?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-2">
          <ChoiceGroup
            legend="Liczba mieszkańców"
            hint="Gminy albo obszaru, na którym działasz."
            options={POPULATION_BAND_OPTIONS}
            registration={register("populationBand")}
            error={errors.populationBand?.message}
          />
          <ChoiceGroup
            legend="Roczny budżet na to działanie"
            hint="Wystarczy przybliżony przedział."
            options={BUDGET_BAND_OPTIONS}
            registration={register("budgetBand")}
            error={errors.budgetBand?.message}
          />
        </div>

        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="staff-available" className={LABEL_CLASSES}>
            Ile osób z zespołu może się zaangażować?
          </Label>
          <p
            id="staff-available-hint"
            className="text-base text-muted-foreground"
          >
            Liczba od 0 do 20.
          </p>
          <Input
            id="staff-available"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={errors.staffAvailable ? true : undefined}
            aria-describedby={cn(
              "staff-available-hint",
              errors.staffAvailable && "staff-available-error",
            )}
            className="h-12 rounded-md bg-background text-base md:text-base"
            {...register("staffAvailable")}
          />
          <FieldError
            id="staff-available-error"
            message={errors.staffAvailable?.message}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-8">
        <legend className="mb-6 font-heading text-xl font-semibold text-heading">
          Potrzeba
        </legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="target-group" className={LABEL_CLASSES}>
            Kogo ma objąć wsparcie?
          </Label>
          <p id="target-group-hint" className="text-base text-muted-foreground">
            Na przykład: samotni seniorzy z przysiółków.
          </p>
          <Input
            id="target-group"
            type="text"
            autoComplete="off"
            aria-invalid={errors.targetGroup ? true : undefined}
            aria-describedby={cn(
              "target-group-hint",
              errors.targetGroup && "target-group-error",
            )}
            className="h-12 rounded-md bg-background text-base md:text-base"
            {...register("targetGroup")}
          />
          <FieldError
            id="target-group-error"
            message={errors.targetGroup?.message}
          />
        </div>

        <TextField
          id="need"
          label="Jakiej zmiany potrzebujecie?"
          hint="Napisz, czego dziś brakuje i co ma się zmienić po wdrożeniu."
          control={control}
          name="need"
          registration={register("need")}
          error={errors.need?.message}
          rows={5}
          maxLength={NEED_MAX_LENGTH}
        />

        <TextField
          id="constraints"
          label="Ograniczenia (np. brak lokalu, transport) (opcjonalnie)"
          control={control}
          name="constraints"
          registration={register("constraints")}
          error={errors.constraints?.message}
          maxLength={CONSTRAINTS_MAX_LENGTH}
        />

        <ChoiceGroup
          legend="Kiedy chcecie zacząć działać?"
          options={TIMELINE_OPTIONS}
          registration={register("timeline")}
          error={errors.timeline?.message}
        />
      </fieldset>

      <div>
        <Button
          type="submit"
          aria-disabled={busy || undefined}
          className="h-auto min-h-12 px-6 py-3 text-lg font-semibold whitespace-normal"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
