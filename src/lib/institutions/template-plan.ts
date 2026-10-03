import {
  BUDGET_BAND_LABELS,
  BUDGET_BAND_RANGE,
  formatPlnRange,
  peopleText,
} from "@/lib/institutions/labels";
import type {
  ImplementationPlan,
  Innovation,
  InstitutionProfile,
  InstitutionType,
} from "@/types";

const OWNER: Record<InstitutionType, string> = {
  gmina: "koordynator w urzędzie gminy",
  powiat: "koordynator w starostwie",
  ops_cus: "koordynator z OPS lub CUS",
  pcpr: "koordynator z PCPR",
  dps_sds: "kierownik placówki",
  ngo: "koordynator w organizacji",
  school: "pedagog szkolny",
  other: "koordynator wdrożenia",
};

const OWN_FUNDS: Record<InstitutionType, string> = {
  gmina: "środki własne gminy",
  powiat: "środki własne powiatu",
  ops_cus: "środki własne gminy w budżecie OPS lub CUS",
  pcpr: "środki własne powiatu w budżecie PCPR",
  dps_sds: "środki własne organu prowadzącego placówkę",
  ngo: "środki własne organizacji i darowizny",
  school: "środki organu prowadzącego szkołę",
  other: "środki własne instytucji",
};

/** Share of the budget per cost row; the shares add up to 1. */
const COST_ROWS: { item: string; share: number; note?: string }[] = [
  {
    item: "Koordynacja i praca zespołu",
    share: 0.45,
    note: "Czas osób z zespołu albo zlecenie.",
  },
  { item: "Przygotowanie i szkolenie osób prowadzących", share: 0.1 },
  { item: "Materiały i sprzęt", share: 0.15 },
  {
    item: "Lokal i dojazdy",
    share: 0.15,
    note: "Niższe, jeśli partner udostępni salę.",
  },
  { item: "Informowanie mieszkańców i zapisy", share: 0.05 },
  { item: "Ocena efektów pilotażu", share: 0.1 },
];

/** Standard phases and the share of the timeline each one takes. */
const PHASES: { title: string; share: number }[] = [
  { title: "Diagnoza potrzeb", share: 0.15 },
  { title: "Partnerzy i zespół", share: 0.15 },
  { title: "Pilotaż", share: 0.45 },
  { title: "Ocena", share: 0.15 },
  { title: "Decyzja o utrzymaniu", share: 0.1 },
];

const PILOT_INDEX = 2;

const WEEKS_PER_MONTH = 52 / 12;

function roundTo100(value: number): number {
  return Math.round(value / 100) * 100;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase("pl") + text.slice(1);
}

/**
 * A deterministic plan built only from the innovation and the profile. Used
 * without an OpenAI key and whenever generation fails its checks.
 */
export function buildTemplatePlan(
  profile: InstitutionProfile,
  innovation: Innovation,
): ImplementationPlan {
  const owner = OWNER[profile.institutionType];
  const band = BUDGET_BAND_RANGE[profile.budgetBand];
  const yearShare = profile.timeline / 12;
  const totalWeeks = Math.round(profile.timeline * WEEKS_PER_MONTH);
  const rural = profile.municipalityType === "wiejska";
  const smallTeam = profile.staffAvailable <= 1;
  const smallBudget = profile.budgetBand === "<20k";

  // Whole weeks per phase that add up to the timeline exactly: each phase is
  // rounded down and the pilot, the longest phase, takes what is left.
  const phaseWeeks = PHASES.map(({ share }) =>
    Math.max(1, Math.floor(totalWeeks * share)),
  );
  phaseWeeks[PILOT_INDEX]! += totalWeeks - sum(phaseWeeks);

  const costs = COST_ROWS.map(({ item, share, note }) => ({
    item,
    minPln: roundTo100(band.min * yearShare * share),
    maxPln: roundTo100(band.max * yearShare * share),
    ...(note ? { note } : {}),
  }));

  const stepDescriptions = [
    `Sprawdź, ile osób z grupy „${profile.targetGroup}” potrzebuje wsparcia i gdzie mieszkają. Porozmawiaj z kilkoma z nich o tym, co im przeszkadza.`,
    `Ustal, kto w zespole prowadzi działanie, i zaproś partnerów. Spiszcie, kto za co odpowiada i co wnosi.`,
    `Uruchom „${innovation.title}” dla pierwszej, małej grupy. Zapisuj, co działa, a co trzeba zmienić.`,
    `Zbierz opinie uczestników i osób prowadzących. Porównaj wyniki z celami ustalonymi po diagnozie.`,
    `Przedstaw wyniki i koszty osobom, które decydują o budżecie. Ustalcie, czy działanie zostaje, w jakiej skali i z jakich środków.`,
  ];
  const stepOwners = [
    owner,
    owner,
    profile.staffAvailable > 1 ? "osoby prowadzące działanie" : owner,
    owner,
    "kierownictwo instytucji",
  ];

  const adaptations = [
    `Dopasuj opis rozwiązania do grupy „${profile.targetGroup}”. W bibliotece jest ono opisane dla: ${lowerFirst(innovation.targetGroup)}.`,
    rural
      ? "W gminie wiejskiej zaplanuj dojazd uczestników albo prowadź działanie w kilku sołectwach."
      : "Wybierz jedno miejsce na pilotaż, do którego uczestnicy łatwo dotrą.",
    smallTeam
      ? "Zespół ma mało wolnych osób. Zacznij od jednej małej grupy i poszukaj partnera, który przejmie część zadań."
      : `Podziel zadania między ${peopleText(profile.staffAvailable)} z zespołu, tak żeby pilotaż nie zależał od jednej osoby.`,
    ...(smallBudget
      ? [
          "Przy tym budżecie oprzyj się na zasobach, które już masz: sali, sprzęcie i wolontariuszach.",
        ]
      : []),
    ...(profile.constraints
      ? [`Uwzględnij podane ograniczenia: ${profile.constraints}`]
      : []),
  ];

  return {
    innovationId: innovation.id,
    title: `Plan wdrożenia: ${innovation.title}`,
    summary: `Szkic wdrożenia rozwiązania „${innovation.title}” w ${profile.timeline} mies. ${innovation.summary ?? innovation.description} Plan zaczyna się od diagnozy i małego pilotażu, a kończy decyzją, czy utrzymać działanie.`,
    whyItFits: `Chcesz objąć wsparciem grupę „${profile.targetGroup}”. Rozwiązanie jest skierowane do: ${lowerFirst(innovation.targetGroup)} (kategoria: ${innovation.category}). Sprawdź w diagnozie, na ile te grupy się pokrywają.`,
    adaptations,
    steps: PHASES.map(({ title }, index) => ({
      title,
      description: stepDescriptions[index]!,
      weeks: phaseWeeks[index]!,
      owner: stepOwners[index]!,
    })),
    costs,
    totalMinPln: sum(costs.map(({ minPln }) => minPln)),
    totalMaxPln: sum(costs.map(({ maxPln }) => maxPln)),
    people: [
      {
        role: `Koordynator: ${owner}`,
        fte: 0.25,
        note: smallTeam
          ? "Zespół nie ma wolnych osób, więc koordynację trzeba zlecić albo przesunąć inne zadania."
          : undefined,
      },
      {
        role: "Osoby prowadzące działanie",
        note:
          profile.staffAvailable > 0
            ? `Z zespołu: ${peopleText(profile.staffAvailable)}.`
            : "Do pozyskania od partnera albo na zlecenie.",
      },
      {
        role: "Osoba zbierająca opinie i wyniki",
        note: "Może to być koordynator, jeśli pilotaż jest mały.",
      },
    ],
    partners: [
      {
        type: "organizacja pozarządowa działająca w gminie",
        role: "Pomaga dotrzeć do uczestników i prowadzić działania.",
      },
      {
        type: "biblioteka gminna lub dom kultury",
        role: "Udostępnia salę i informuje mieszkańców.",
      },
      rural
        ? {
            type: "sołtysi i koło gospodyń wiejskich",
            role: "Wskazują osoby, które potrzebują wsparcia, i zachęcają do udziału.",
          }
        : {
            type: "rada osiedla lub rada seniorów",
            role: "Wskazuje osoby, które potrzebują wsparcia, i zachęca do udziału.",
          },
    ],
    risks: [
      {
        risk: "Zgłosi się mniej uczestników, niż zakładasz.",
        mitigation:
          "Zapraszaj przez osoby, którym mieszkańcy ufają: sołtysa, pracownika socjalnego, lekarza rodzinnego.",
      },
      {
        risk: smallTeam
          ? "Zespół nie ma czasu na prowadzenie działania."
          : "Osoba prowadząca odejdzie albo zachoruje.",
        mitigation: smallTeam
          ? "Ogranicz pilotaż do jednej grupy i podziel zadania z partnerem."
          : "Od początku prowadź działanie w dwie osoby i spisuj, jak to robicie.",
      },
      {
        risk: "Koszty okażą się wyższe niż w szacunku.",
        mitigation:
          "Przed pilotażem zbierz wyceny i zostaw rezerwę. Po pierwszym miesiącu porównaj wydatki z planem.",
      },
      {
        risk: "Po pilotażu zabraknie środków na dalsze działanie.",
        mitigation:
          "Już w trakcie pilotażu sprawdź aktualne nabory i wpisz działanie do planu budżetu na kolejny rok.",
      },
    ],
    kpis: [
      {
        indicator: "Liczba osób, które wzięły udział w pilotażu",
        target: "Ustal po diagnozie potrzeb.",
      },
      {
        indicator: "Udział uczestników, którzy zostali do końca pilotażu",
        target: "Ustal przed startem i porównaj po pilotażu.",
      },
      {
        indicator: "Ocena uczestników w krótkiej ankiecie po pilotażu",
        target: "Większość ocen dobrych lub bardzo dobrych.",
      },
      {
        indicator: "Koszt na jednego uczestnika",
        target: "Policz po pilotażu i porównaj z szacunkiem.",
      },
    ],
    fundingOptions: [
      OWN_FUNDS[profile.institutionType],
      "programy wojewódzkie i fundusze UE – do sprawdzenia w aktualnych naborach",
      "wkład partnerów: sala, sprzęt, wolontariusze",
    ],
    assumptions: [
      `Budżet: ${BUDGET_BAND_LABELS[profile.budgetBand].toLowerCase()} rocznie, przeliczony na ${profile.timeline} mies. Daje to ${formatPlnRange(roundTo100(band.min * yearShare), roundTo100(band.max * yearShare))}.`,
      "Kwoty to szacunek według typowego podziału kosztów, nie oferta. Przed decyzją zbierz wyceny.",
      `Zespół, który może się zaangażować: ${peopleText(profile.staffAvailable)}.`,
      "Plan korzysta tylko z opisu rozwiązania w bibliotece i z Twoich odpowiedzi. Nie uwzględnia lokalnych umów ani cen.",
      "Cele liczbowe ustalisz dopiero po diagnozie potrzeb.",
    ],
    source: "template",
  };
}
