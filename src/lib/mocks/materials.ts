export type MaterialType = "pdf" | "video" | "article" | "template";

export interface Material {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  /** "#" until a public ROPS link is verified. */
  url: string;
  sizeLabel?: string;
  language: "pl";
}

export const materials: Material[] = [
  {
    id: "mat-innovation-canvas",
    title: "Kanwa Innowacji Społecznych",
    description:
      "Plansza do wypełnienia w zespole. Prowadzi od problemu, przez odbiorców, do pierwszego testu pomysłu.",
    type: "template",
    url: "#",
    sizeLabel: "1,2 MB",
    language: "pl",
  },
  {
    id: "mat-challenge-map",
    title: "Mapa Wyzwań Społecznych Małopolski",
    description:
      "Opis najważniejszych wyzwań regionu z podziałem na obszary. Punkt wyjścia do diagnozy w gminie.",
    type: "pdf",
    url: "#",
    sizeLabel: "3,4 MB",
    language: "pl",
  },
  {
    id: "mat-testing-guide",
    title: "Jak przetestować innowację w małej skali",
    description:
      "Poradnik krok po kroku: kogo zaprosić do testu, co mierzyć i jak zebrać opinie uczestników.",
    type: "article",
    url: "#",
    language: "pl",
  },
  {
    id: "mat-intro-video",
    title: "Czym jest innowacja społeczna",
    description:
      "Krótki film wprowadzający z przykładami rozwiązań sprawdzonych w małopolskich gminach.",
    type: "video",
    url: "#",
    sizeLabel: "6 min",
    language: "pl",
  },
  {
    id: "mat-implementation-checklist",
    title: "Lista kontrolna wdrożenia w gminie",
    description:
      "Pytania, na które warto odpowiedzieć przed wdrożeniem: budżet, partnerzy, osoby odpowiedzialne i terminy.",
    type: "pdf",
    url: "#",
    sizeLabel: "0,4 MB",
    language: "pl",
  },
];
