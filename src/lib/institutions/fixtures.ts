import type { PlanDraft } from "@/lib/ai/middleman";
import type { InstitutionProfile } from "@/types";

/** Shared by the institution tests: "Gmina wiejska, 5–20 tys., budżet 20–100 tys., seniorzy". */
export const ruralProfile: InstitutionProfile = {
  institutionType: "gmina",
  municipalityType: "wiejska",
  populationBand: "5-20k",
  budgetBand: "20-100k",
  staffAvailable: 2,
  targetGroup: "samotni seniorzy z przysiółków",
  need: "Seniorzy mieszkający samotnie nie mają z kim porozmawiać w ciągu dnia.",
  constraints: "Brak transportu publicznego między sołectwami.",
  timeline: 6,
};

/** A model draft that passes every server-side check for ruralProfile. */
export const validDraft: PlanDraft = {
  title: "Teleopieka sąsiedzka w gminie",
  summary: "Wolontariusze codziennie dzwonią do samotnych seniorów.",
  whyItFits: "Rozwiązanie jest skierowane do samotnych seniorów.",
  adaptations: ["Zaplanuj dyżury telefoniczne w dwóch sołectwach."],
  steps: [
    {
      title: "Diagnoza",
      description: "Ustal z pracownikiem socjalnym listę osób.",
      weeks: 4,
      owner: "pracownik socjalny",
    },
    {
      title: "Pilotaż",
      description: "Uruchom telefony dla pierwszej grupy.",
      weeks: 12,
      owner: "koordynator z OPS",
    },
  ],
  costs: [
    { item: "Koordynacja", minPln: 8000, maxPln: 20000, note: null },
    {
      item: "Telefony i abonament",
      minPln: 2000,
      maxPln: 5000,
      note: "Zakup.",
    },
  ],
  totalMinPln: 10000,
  totalMaxPln: 25000,
  people: [
    { role: "Koordynator z OPS", fte: 0.25, note: null },
    { role: "Wolontariusze", fte: null, note: "Do pozyskania." },
  ],
  partners: [{ type: "koło gospodyń wiejskich", role: "Wskazuje seniorów." }],
  risks: [{ risk: "Mało wolontariuszy.", mitigation: "Zaproś szkołę." }],
  kpis: [{ indicator: "Liczba rozmów", target: "Ustal po diagnozie." }],
  fundingOptions: ["środki własne gminy"],
  assumptions: ["Kwoty to szacunek, nie oferta."],
};
