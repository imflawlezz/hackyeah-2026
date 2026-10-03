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

export function templateGrantSections(
  idea: GrantIdeaInput,
  call: GrantCall,
): GrantDraftSection[] {
  return call.requiredSections.map((section) => {
    const fact = FIELD_TEXT[section.key]?.(idea)?.trim();
    const body = fact || `[uzupełnij: ${section.heading.toLowerCase()}]`;
    return {
      key: section.key,
      heading: section.heading,
      body: clip(body, section.maxChars),
    };
  });
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
