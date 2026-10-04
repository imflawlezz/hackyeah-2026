import type { Idea } from "@/types";

export type IdeaDraftValues = {
  problem: string;
  targetGroup: string;
  summary: string;
  solution: string;
  novelty: string;
  resources: string;
  partners: string;
  risks: string;
  successMeasures: string;
  title: string;
  stage: Idea["stage"];
  municipality: string;
};

export const EMPTY_IDEA_DRAFT: IdeaDraftValues = {
  problem: "",
  targetGroup: "",
  summary: "",
  solution: "",
  novelty: "",
  resources: "",
  partners: "",
  risks: "",
  successMeasures: "",
  title: "",
  stage: "idea",
  municipality: "",
};

export const IMPLEMENTATION_FIELDS = [
  "solution",
  "novelty",
  "resources",
  "partners",
  "risks",
  "successMeasures",
] as const;
export const IDEA_STEPS: {
  title: string;
  fields: (keyof IdeaDraftValues)[];
  review?: boolean;
  optional?: boolean;
}[] = [
  { title: "Pomysł", fields: ["title", "problem", "targetGroup", "summary"] },
  { title: "Wdrożenie", fields: [...IMPLEMENTATION_FIELDS], optional: true },
  { title: "Podsumowanie", fields: ["municipality", "stage"], review: true },
];
const FIELD_LABELS: Record<keyof IdeaDraftValues, string> = {
  problem: "Jaki problem chcesz rozwiązać?",
  targetGroup: "Kogo dotyczy?",
  summary: "Na czym polega Twój pomysł? (2–3 zdania)",
  solution: "Jak to będzie działać w praktyce?",
  novelty: "Co jest w tym nowego?",
  resources: "Czego potrzebujesz?",
  partners: "Z kim chcesz współpracować?",
  risks: "Co może pójść nie tak?",
  successMeasures: "Po czym poznasz, że działa?",
  title: "Tytuł pomysłu",
  stage: "Etap",
  municipality: "Gmina",
};

const MIN_LENGTH: Partial<Record<keyof IdeaDraftValues, number>> = {
  problem: 10,
  targetGroup: 3,
  summary: 10,
  solution: 10,
  novelty: 10,
  resources: 3,
  partners: 3,
  risks: 3,
  successMeasures: 3,
  title: 3,
};

export function fieldLabel(field: keyof IdeaDraftValues): string {
  return FIELD_LABELS[field];
}

export function validateIdeaStep(
  step: number,
  values: IdeaDraftValues,
): { field: keyof IdeaDraftValues; message: string } | null {
  const current = IDEA_STEPS[step];
  if (!current) return null;
  for (const field of current.fields) {
    if (field === "stage" || field === "municipality") continue;
    const min = current.optional ? 3 : (MIN_LENGTH[field] ?? 1);
    const value = String(values[field] ?? "").trim();
    if (current.optional && !value) continue;
    if (value.length < min) {
      return {
        field,
        message: `Uzupełnij pole „${FIELD_LABELS[field]}”. Minimum ${min} znaków.`,
      };
    }
  }
  return null;
}

export function draftToIdea(
  values: IdeaDraftValues,
  status: Idea["status"],
  id: string,
): Idea {
  return {
    id,
    title: values.title.trim(),
    summary: values.summary.trim(),
    targetGroup: values.targetGroup.trim(),
    stage: values.stage,
    status,
    municipality: values.municipality.trim() || undefined,
    canvas: Object.fromEntries(
      (["problem", ...IMPLEMENTATION_FIELDS] as const)
        .map((field) => [field, values[field].trim()])
        .filter(([, value]) => value),
    ),
    createdAt: new Date().toISOString(),
  };
}

/** Fills the wizard from a saved idea, e.g. when an author edits a draft. */
export function ideaToDraftValues(idea: Idea): IdeaDraftValues {
  return {
    problem: idea.canvas?.problem ?? "",
    targetGroup: idea.targetGroup ?? "",
    summary: idea.summary ?? "",
    solution: idea.canvas?.solution ?? "",
    novelty: idea.canvas?.novelty ?? "",
    resources: idea.canvas?.resources ?? "",
    partners: idea.canvas?.partners ?? "",
    risks: idea.canvas?.risks ?? "",
    successMeasures: idea.canvas?.successMeasures ?? "",
    title: idea.title ?? "",
    stage: idea.stage ?? "idea",
    municipality: idea.municipality ?? "",
  };
}
