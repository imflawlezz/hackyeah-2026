import type { Problem } from "@/types";

export const problems: Problem[] = [
  {
    id: "prob-rural-seniors",
    description:
      "Samotni seniorzy w gminie wiejskiej nie mają jak dojechać do przychodni i nie mają z kim porozmawiać w ciągu dnia.",
    category: "Samotność",
    status: "new",
    createdAt: "2026-09-12T09:30:00.000Z",
  },
  {
    id: "prob-after-school",
    description:
      "Młodzież po lekcjach nie ma gdzie bezpiecznie spędzić czasu, a rodzice pracują do wieczora.",
    category: "Młodzież",
    status: "new",
    createdAt: "2026-09-18T14:00:00.000Z",
  },
  {
    id: "prob-office-access",
    description:
      "Osoba z niepełnosprawnością wzroku nie może samodzielnie załatwić sprawy w urzędzie, bo stanowisko nie jest dostępne.",
    category: "Dostępność",
    status: "matched",
    createdAt: "2026-09-21T11:15:00.000Z",
  },
];
