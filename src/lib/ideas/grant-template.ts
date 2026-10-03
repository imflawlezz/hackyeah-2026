import type { GrantCall, GrantDraftSection, IdeaCanvas } from "@/types";

export type GrantIdeaInput = {
  title?: string;
  summary?: string;
  targetGroup?: string;
  municipality?: string;
  canvas?: IdeaCanvas;
};

const FIELD_TEXT: Record<string, (idea: GrantIdeaInput) => string | undefined> =
  {
    problem: (idea) => idea.canvas?.problem || idea.summary,
    rozwiązanie: (idea) =>
      [idea.canvas?.solution, idea.canvas?.novelty].filter(Boolean).join(" "),
    odbiorcy: (idea) => idea.targetGroup,
    harmonogram: () => undefined,
    budżet: () => undefined,
  };

const PLN = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date(iso));
}

/**
 * Neutral Polish guidance for a section the idea card does not cover. Used by
 * the template fallback, so the draft never shows bracket placeholders.
 */
export function sectionGuidance(
  key: string,
  heading: string,
  call: GrantCall,
): string {
  if (key === "harmonogram") {
    return `Rozpisz działania na kolejne miesiące: przygotowanie, realizację i podsumowanie. Zaplanuj je tak, żeby zakończyły się przed końcem naboru (${formatDate(call.endsAt)}).`;
  }
  if (key === "budżet") {
    const limit = call.maxAmountPln
      ? ` Łączna kwota nie może przekroczyć ${PLN.format(call.maxAmountPln)} zł.`
      : "";
    return `Wypisz główne koszty, na przykład materiały, wynagrodzenia, wynajem sali i promocję, i przy każdej pozycji podaj kwotę.${limit}`;
  }
  return `Opisz w kilku zdaniach: ${heading.toLocaleLowerCase("pl")}. Oprzyj się na tym, co już wiesz o swoim pomyśle.`;
}

export function templateGrantSections(
  idea: GrantIdeaInput,
  call: GrantCall,
): GrantDraftSection[] {
  return call.requiredSections.map((section) => {
    const fact = FIELD_TEXT[section.key]?.(idea)?.trim();
    const body = fact || sectionGuidance(section.key, section.heading, call);
    return {
      key: section.key,
      heading: section.heading,
      body: clip(body, section.maxChars),
    };
  });
}

/** Matches "[uzupełnij…]" and similar bracketed gaps a model may still emit. */
const PLACEHOLDER =
  /\[\s*(?:uzupełnij|do uzupełnienia|wpisz|tbd|todo)[^\]]*\]/giu;

export function hasPlaceholder(text: string): boolean {
  PLACEHOLDER.lastIndex = 0;
  return PLACEHOLDER.test(text);
}

/** Removes bracket placeholders and tidies the leftover whitespace. */
export function stripPlaceholders(text: string): string {
  return text
    .replace(PLACEHOLDER, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function clip(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars).trimEnd();
}

export function sectionsToMarkdown(
  title: string,
  sections: GrantDraftSection[],
): string {
  const blocks = sections.map(
    (section) => `## ${section.heading}\n\n${section.body}`,
  );
  return [`# ${title}`, ...blocks].join("\n\n");
}
