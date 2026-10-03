import { z } from "zod";

export const INNOVATION_STATUSES = [
  { value: "published", label: "Opublikowana" },
  { value: "draft", label: "Szkic" },
  { value: "archived", label: "Zarchiwizowana" },
] as const;

const VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
]);

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** "a, b ,, c" → ["a", "b", "c"], trimmed, lowercased, unique. */
export function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLocaleLowerCase("pl"))
        .filter(Boolean),
    ),
  ];
}

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

export const innovationFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Podaj tytuł – minimum 3 znaki.")
    .max(120, "Tytuł może mieć maksymalnie 120 znaków."),
  summary: z
    .string()
    .trim()
    .min(10, "Napisz krótkie podsumowanie – minimum 10 znaków.")
    .max(240, "Podsumowanie może mieć maksymalnie 240 znaków."),
  description: z
    .string()
    .trim()
    .min(30, "Opisz innowację – minimum 30 znaków.")
    .max(4000, "Opis może mieć maksymalnie 4000 znaków."),
  category: z
    .string()
    .trim()
    .min(2, "Wybierz kategorię albo wpisz nową.")
    .max(60, "Kategoria może mieć maksymalnie 60 znaków."),
  targetGroup: z
    .string()
    .trim()
    .min(3, "Napisz, dla kogo jest ta innowacja.")
    .max(160, "Grupa odbiorców może mieć maksymalnie 160 znaków."),
  region: optionalText(120, "Region może mieć maksymalnie 120 znaków."),
  tags: z
    .string()
    .max(400, "Tagi mogą mieć razem maksymalnie 400 znaków.")
    .refine(
      (value) => parseTags(value).length <= 12,
      "Dodaj maksymalnie 12 tagów.",
    ),
  videoUrl: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      const url = parseUrl(value);
      return url?.protocol === "https:" && VIDEO_HOSTS.has(url.hostname);
    }, "Podaj link https do filmu na YouTube albo Vimeo."),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (value) => !value || parseUrl(value)?.protocol === "https:",
      "Podaj link do zdjęcia zaczynający się od https://.",
    ),
  status: z.enum(["draft", "published", "archived"]),
});

export type InnovationFormValues = z.input<typeof innovationFormSchema>;

/** Form values ready to store: optional fields become null, tags become an array. */
export function toInnovationInput(
  values: z.output<typeof innovationFormSchema>,
) {
  return {
    title: values.title,
    summary: values.summary,
    description: values.description,
    category: values.category,
    targetGroup: values.targetGroup,
    region: values.region || null,
    tags: parseTags(values.tags),
    videoUrl: values.videoUrl || null,
    imageUrl: values.imageUrl || null,
    status: values.status,
  };
}

export type InnovationInput = ReturnType<typeof toInnovationInput>;
