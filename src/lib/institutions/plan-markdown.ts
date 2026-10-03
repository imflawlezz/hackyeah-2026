import {
  formatPlnRange,
  profileSummary,
  weeksText,
} from "@/lib/institutions/labels";
import type {
  ImplementationPlan,
  Innovation,
  InstitutionProfile,
} from "@/types";

export const GENERATED_LABEL =
  "Tekst przygotowany automatycznie. Sprawdź go przed użyciem.";
export const TEMPLATE_LABEL = "Plan przygotowany według szablonu, bez AI.";

/** Section titles in document order; the page and the export share them. */
export const PLAN_SECTIONS = [
  { id: "podsumowanie", title: "Podsumowanie" },
  { id: "dlaczego-to-pasuje", title: "Dlaczego to pasuje" },
  { id: "co-trzeba-dostosowac", title: "Co trzeba dostosować" },
  { id: "kroki-wdrozenia", title: "Kroki wdrożenia" },
  { id: "szacunkowe-koszty", title: "Szacunkowe koszty" },
  { id: "zespol-i-partnerzy", title: "Zespół i partnerzy" },
  { id: "ryzyka", title: "Ryzyka i jak im zapobiec" },
  { id: "jak-zmierzyc-efekt", title: "Jak zmierzyć efekt" },
  { id: "zrodla-finansowania", title: "Możliwe źródła finansowania" },
  { id: "zalozenia", title: "Założenia" },
] as const;

const fte = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 });

/** "0,25 etatu". */
export function formatFte(value: number): string {
  return `${fte.format(value)} etatu`;
}

/** Keeps table cells on one line and stops user text from breaking the table. */
function cell(text: string): string {
  return text.replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|");
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function planToMarkdown(
  plan: ImplementationPlan,
  innovation: Innovation,
  profile: InstitutionProfile,
): string {
  const [
    summary,
    whyItFits,
    adaptations,
    steps,
    costs,
    team,
    risks,
    kpis,
    funding,
    assumptions,
  ] = PLAN_SECTIONS.map(({ title }) => `## ${title}`);

  const labels = [
    GENERATED_LABEL,
    ...(plan.source === "template" ? [TEMPLATE_LABEL] : []),
  ];

  return [
    `# ${plan.title}`,
    labels.map((label) => `> ${label}`).join("\n"),
    `Innowacja: ${innovation.title} (${innovation.category})`,
    bullets(
      profileSummary(profile).map(({ label, value }) => `${label}: ${value}`),
    ),
    summary,
    plan.summary,
    whyItFits,
    plan.whyItFits,
    adaptations,
    bullets(plan.adaptations),
    steps,
    plan.steps
      .map(
        (step, index) =>
          `${index + 1}. **${step.title}** (${weeksText(step.weeks)}, odpowiada: ${step.owner}). ${step.description}`,
      )
      .join("\n"),
    costs,
    [
      "| Pozycja | Szacunek | Uwagi |",
      "| --- | --- | --- |",
      ...plan.costs.map(
        (row) =>
          `| ${cell(row.item)} | ${formatPlnRange(row.minPln, row.maxPln)} | ${cell(row.note ?? "")} |`,
      ),
      `| **Razem** | **${formatPlnRange(plan.totalMinPln, plan.totalMaxPln)}** | |`,
    ].join("\n"),
    team,
    "Zespół:",
    bullets(
      plan.people.map((person) =>
        [
          person.role,
          person.fte !== undefined ? ` (${formatFte(person.fte)})` : "",
          person.note ? `. ${person.note}` : "",
        ].join(""),
      ),
    ),
    "Partnerzy (rodzaje organizacji):",
    bullets(plan.partners.map(({ type, role }) => `${type}: ${role}`)),
    risks,
    [
      "| Ryzyko | Jak mu zapobiec |",
      "| --- | --- |",
      ...plan.risks.map(
        ({ risk, mitigation }) => `| ${cell(risk)} | ${cell(mitigation)} |`,
      ),
    ].join("\n"),
    kpis,
    bullets(
      plan.kpis.map(({ indicator, target }) => `${indicator}: ${target}`),
    ),
    funding,
    bullets(plan.fundingOptions),
    assumptions,
    bullets(plan.assumptions),
  ]
    .join("\n\n")
    .concat("\n");
}
