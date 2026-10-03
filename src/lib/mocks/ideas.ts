import type { AdminIdea } from "@/lib/admin/types";

// Fictional ideas waiting for review in the demo admin panel.
export const mockIdeas: AdminIdea[] = [
  {
    id: "mock-idea-01",
    title: "Wspólne obiady w remizie",
    summary:
      "Raz w tygodniu koło gospodyń gotuje obiad dla samotnych seniorów z sołectwa. Strażacy dowożą osoby, które nie mogą dojść.",
    targetGroup: "Samotni seniorzy na wsi",
    stage: "idea",
    status: "submitted",
    reviewNote: null,
    createdAt: "2026-09-28T10:20:00.000Z",
  },
  {
    id: "mock-idea-02",
    title: "Szkolni mentorzy cyfrowi",
    summary:
      "Uczniowie technikum uczą seniorów obsługi smartfona w bibliotece. Za zajęcia dostają zaświadczenie o wolontariacie.",
    targetGroup: "Seniorzy wykluczeni cyfrowo",
    stage: "prototype",
    status: "submitted",
    reviewNote: null,
    createdAt: "2026-09-24T14:05:00.000Z",
  },
  {
    id: "mock-idea-03",
    title: "Szafka z rzeczami pierwszej potrzeby",
    summary:
      "Zamykana szafka przy ośrodku pomocy, w której osoby w kryzysie bezdomności zostawiają dokumenty i ubrania.",
    targetGroup: "Osoby w kryzysie bezdomności",
    stage: "idea",
    status: "submitted",
    reviewNote: null,
    createdAt: "2026-09-19T08:45:00.000Z",
  },
  {
    id: "mock-idea-04",
    title: "Grupa wsparcia dla opiekunów online",
    summary:
      "Cotygodniowe spotkanie wideo dla opiekunów osób z demencją, prowadzone przez psychologa z powiatowego centrum.",
    targetGroup: "Opiekunowie osób z demencją",
    stage: "pilot",
    status: "reviewed",
    reviewNote: "Dziękujemy. Skontaktujemy Cię z centrum usług społecznych.",
    createdAt: "2026-09-10T16:30:00.000Z",
  },
];
