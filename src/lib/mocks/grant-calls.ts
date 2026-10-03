import type { GrantCall, GrantSection } from "@/types";

export const DEMO_GRANT_CALL_ID = "00000000-0000-4000-8000-000000000024";

const requiredSections: GrantSection[] = [
  {
    key: "problem",
    heading: "Problem",
    guidance: "Opisz sytuację mieszkańców. Nie podawaj danych osobowych.",
    maxChars: 900,
  },
  {
    key: "rozwiązanie",
    heading: "Rozwiązanie",
    guidance: "Napisz, jak pomysł działa w praktyce.",
    maxChars: 1200,
  },
  {
    key: "odbiorcy",
    heading: "Odbiorcy",
    guidance: "Wskaż, kogo pomysł dotyczy.",
    maxChars: 700,
  },
  {
    key: "harmonogram",
    heading: "Harmonogram",
    guidance: "Zostaw placeholder, jeśli nie znasz dat.",
    maxChars: 800,
  },
  {
    key: "budżet",
    heading: "Budżet",
    guidance: "Nie wpisuj kwoty, której nie podała osoba zgłaszająca.",
    maxChars: 600,
  },
];

export const grantCalls: GrantCall[] = [
  {
    id: DEMO_GRANT_CALL_ID,
    title: "Nabór demonstracyjny: mikrogranty na innowacje społeczne 2026",
    organizer: "Małopolski Hub Innowacji Społecznych",
    description:
      "Nabór fikcyjny na potrzeby prototypu HubMI.pl. Nie prowadzi do wypłaty środków.",
    startsAt: "2026-10-01T00:00:00.000Z",
    endsAt: "2026-12-31T22:59:59.000Z",
    maxAmountPln: 20000,
    requiredSections,
    createdAt: "2026-09-15T08:00:00.000Z",
  },
];
