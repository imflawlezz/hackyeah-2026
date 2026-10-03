import type { Idea } from "@/types";

const CANVAS_QUESTIONS: {
  filled: (idea: Partial<Idea>) => boolean;
  question: string;
}[] = [
  {
    filled: (idea) => Boolean(idea.canvas?.problem?.trim()),
    question: "Jaki problem chcesz rozwiązać?",
  },
  {
    filled: (idea) => Boolean(idea.targetGroup?.trim()),
    question: "Kogo dotyczy ten pomysł?",
  },
  {
    filled: (idea) => Boolean(idea.summary?.trim()),
    question: "Na czym polega Twój pomysł?",
  },
  {
    filled: (idea) => Boolean(idea.canvas?.solution?.trim()),
    question: "Jak to będzie działać w praktyce?",
  },
  {
    filled: (idea) => Boolean(idea.canvas?.novelty?.trim()),
    question: "Co jest w tym nowego?",
  },
  {
    filled: (idea) => Boolean(idea.canvas?.resources?.trim()),
    question: "Czego potrzebujesz, żeby to ruszyło?",
  },
  {
    filled: (idea) => Boolean(idea.canvas?.partners?.trim()),
    question: "Z kim chcesz współpracować w gminie?",
  },
  {
    filled: (idea) => Boolean(idea.canvas?.risks?.trim()),
    question: "Co może pójść nie tak?",
  },
  {
    filled: (idea) => Boolean(idea.canvas?.successMeasures?.trim()),
    question: "Po czym poznasz, że działa?",
  },
];

export function nextCanvasQuestion(idea?: Partial<Idea>): string {
  const pending = CANVAS_QUESTIONS.find((item) => !item.filled(idea ?? {}));
  return pending
    ? pending.question
    : "Kanwa jest uzupełniona. Możesz wysłać pomysł do Hubu albo doprecyzować wniosek.";
}

export function fallbackAssistantReply(
  idea: Partial<Idea> | undefined,
  similarTitles: string[],
): string {
  const titles = similarTitles.map((title) => title.trim()).filter(Boolean);
  const similar = titles.length
    ? `Podobne rozwiązanie działa już w: ${formatList(titles)}.`
    : "W bazie nie znalazłem jeszcze podobnego rozwiązania.";
  return [
    `Następne pytanie z kanwy: ${nextCanvasQuestion(idea)}`,
    similar,
    "Możesz też napisać do Małopolskiego Hubu Innowacji Społecznych i omówić pomysł z doradcą.",
  ].join("\n\n");
}

function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} i ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} i ${items[items.length - 1]}`;
}
