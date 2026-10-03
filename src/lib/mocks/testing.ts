import type { Feedback, InnovationTest } from "@/types";

/** Fictional tests for the mock innovations. */
export const innovationTests: InnovationTest[] = [
  {
    id: "test-digital-assistant-wieliczka",
    innovationId: "inn-digital-assistant",
    title: "Dyżury asystenta cyfrowego w bibliotece",
    description:
      "Raz w tygodniu przychodzisz na godzinny dyżur i z asystentem załatwiasz jedną sprawę przez internet. Po czterech spotkaniach pytamy, co było jasne, a co nie.",
    municipality: "Wieliczka",
    startsAt: "2026-10-15",
    endsAt: "2026-11-30",
    slots: 12,
    status: "open",
    createdAt: "2026-09-20T08:00:00.000Z",
  },
  {
    id: "test-telecare-nowy-targ",
    innovationId: "inn-telecare",
    title: "Codzienny telefon do seniora",
    description:
      "Przez sześć tygodni wolontariusz dzwoni do Ciebie albo do Twojego bliskiego o ustalonej porze. Sprawdzamy, czy pora i sposób rozmowy są wygodne.",
    municipality: "Nowy Targ",
    startsAt: "2026-11-02",
    endsAt: "2026-12-13",
    slots: 20,
    status: "open",
    createdAt: "2026-09-24T08:00:00.000Z",
  },
  {
    id: "test-time-bank-tarnow",
    innovationId: "inn-time-bank",
    title: "Bank czasu opiekunów na jednym osiedlu",
    description:
      "Przez sześć tygodni wymieniasz z sąsiadami godziny opieki, transportu i towarzystwa. Testujemy, czy zapisy i poręczenia są zrozumiałe.",
    municipality: "Tarnów",
    startsAt: "2026-11-05",
    endsAt: "2026-12-17",
    slots: 16,
    status: "open",
    createdAt: "2026-09-28T08:00:00.000Z",
  },
];

/** Sign-ups already holding a slot in each mock test. */
export const testSlotsTaken: Record<string, number> = {
  "test-digital-assistant-wieliczka": 9,
  "test-telecare-nowy-targ": 19,
  "test-time-bank-tarnow": 11,
};

type Scores = [
  rating: Feedback["rating"],
  easeOfUse: Feedback["easeOfUse"],
  wouldRecommend: Feedback["wouldRecommend"],
  comment?: string,
];

function entries(innovationId: string, testId: string, scores: Scores[]) {
  return scores.map(
    ([rating, easeOfUse, wouldRecommend, comment], index): Feedback => ({
      id: `fb-${innovationId}-${index + 1}`,
      innovationId,
      testId,
      rating,
      easeOfUse,
      wouldRecommend,
      comment,
      createdAt: `2026-09-${String(10 + index).padStart(2, "0")}T10:00:00.000Z`,
    }),
  );
}

/** Fictional opinions, so the result summaries have something to show. */
export const feedbackEntries: Feedback[] = [
  ...entries("inn-telecare", "test-telecare-nowy-targ", [
    [5, 5, true, "Stała pora rozmowy daje spokój całej rodzinie."],
    [5, 4, true],
    [4, 4, true, "Przydałaby się możliwość zmiany godziny na jeden dzień."],
    [4, 5, true],
    [4, 3, true],
    [3, 4, false, "Rozmowy były za krótkie."],
    [5, 4, true],
    [2, 3, false],
  ]),
  ...entries("inn-digital-assistant", "test-digital-assistant-wieliczka", [
    [5, 4, true, "Asystent tłumaczył bez pośpiechu."],
    [4, 3, true],
    [3, 2, undefined, "Za mało czasu na jedną sprawę."],
    [4, 4, true],
  ]),
  ...entries("inn-time-bank", "test-time-bank-tarnow", [
    [4, 3, true],
    [3, 3, false, "Trudno było zrozumieć, jak liczone są godziny."],
    [5, 4, true],
  ]),
];
