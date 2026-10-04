import Link from "next/link";
import {
  formatPlnRange,
  profileSummary,
  weeksText,
} from "@/lib/institutions/labels";
import {
  formatFte,
  GENERATED_LABEL,
  PLAN_SECTIONS,
  TEMPLATE_LABEL,
} from "@/lib/institutions/plan-markdown";
import type {
  ImplementationPlan,
  Innovation,
  InstitutionProfile,
} from "@/types";

const [
  SUMMARY,
  WHY,
  ADAPTATIONS,
  STEPS,
  COSTS,
  TEAM,
  RISKS,
  KPIS,
  FUNDING,
  ASSUMPTIONS,
] = PLAN_SECTIONS;

const CELL = "border border-border px-2.5 py-2 align-top";
// Data tables may scroll sideways on narrow screens; the wrapper is focusable
// so keyboard users can scroll it too.
const TABLE_SCROLL = "max-w-full overflow-x-auto rounded-sm";
const HEAD_CELL = `${CELL} bg-muted text-left font-semibold`;

function Section({
  section,
  children,
}: {
  section: (typeof PLAN_SECTIONS)[number];
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={section.id}
      className="flex min-w-0 scroll-mt-4 flex-col gap-2.5"
    >
      <h3 id={section.id} className="text-2xl font-semibold">
        {section.title}
      </h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-6 text-base">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** The plan as a document: same section order as the Markdown export, readable in print and in grayscale. */
export function PlanDocument({
  plan,
  innovation,
  profile,
  headingRef,
}: {
  plan: ImplementationPlan;
  innovation: Innovation;
  profile: InstitutionProfile;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  const knowledgePath = `/knowledge/${encodeURIComponent(innovation.id)}`;

  return (
    <article className="plan-document flex max-w-3xl min-w-0 flex-col gap-10">
      <header className="flex flex-col gap-4">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="rounded-sm text-3xl leading-tight font-bold break-words"
        >
          {plan.title}
        </h2>
        <div className="border-l-4 border-primary pl-4 text-base">
          <p className="font-semibold">{GENERATED_LABEL}</p>
          {plan.source === "template" && <p>{TEMPLATE_LABEL}</p>}
        </div>
        <p className="text-base">
          <span className="font-semibold">Innowacja:</span>{" "}
          <Link
            href={knowledgePath}
            data-print-href={`hubmi.pl${knowledgePath}`}
            className="rounded-sm text-primary underline underline-offset-4 hover:decoration-2"
          >
            {innovation.title}
          </Link>{" "}
          ({innovation.category})
        </p>
        <dl className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-1 text-base sm:grid-cols-[16rem_minmax(0,1fr)]">
          {profileSummary(profile).map(({ label, value }) => (
            <div key={label} className="contents">
              <dt className="font-semibold">{label}</dt>
              <dd className="mb-2 sm:mb-0">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <nav aria-label="Spis treści planu" className="print:hidden">
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-x-8 border-y border-border py-4 text-base sm:grid-cols-2">
          {PLAN_SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm text-primary underline underline-offset-4 hover:decoration-2"
              >
                <span aria-hidden="true" className="tabular-nums">
                  {index + 1}.
                </span>
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section section={SUMMARY}>
        <p className="text-lg">{plan.summary}</p>
      </Section>

      <Section section={WHY}>
        <p className="text-base">{plan.whyItFits}</p>
      </Section>

      <Section section={ADAPTATIONS}>
        <BulletList items={plan.adaptations} />
      </Section>

      <Section section={STEPS}>
        <ol className="flex flex-col">
          {plan.steps.map((step, index) => (
            <li
              key={`${index}-${step.title}`}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 border-t border-border py-4 last:border-b"
            >
              <span
                aria-hidden="true"
                className="text-2xl leading-none font-semibold text-muted-foreground tabular-nums"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold">{step.title}</p>
                <p className="text-base">{step.description}</p>
                <p className="text-base">
                  <span className="font-semibold">Czas:</span>{" "}
                  {weeksText(step.weeks)}.{" "}
                  <span className="font-semibold">Odpowiada:</span> {step.owner}
                  .
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section section={COSTS}>
        <div
          role="region"
          aria-label="Tabela kosztów"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be reachable by keyboard
          tabIndex={0}
          className={TABLE_SCROLL}
        >
          <table className="w-full border-collapse text-base">
            <caption className="mb-2 text-left text-muted-foreground">
              Przybliżone przedziały w złotych na cały okres wdrożenia. To
              szacunek, nie oferta.
            </caption>
            <thead>
              <tr>
                <th scope="col" className={HEAD_CELL}>
                  Pozycja
                </th>
                <th scope="col" className={`${HEAD_CELL} text-right`}>
                  Szacunek
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Uwagi
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.costs.map((row, index) => (
                <tr key={`${index}-${row.item}`}>
                  <th scope="row" className={`${CELL} text-left font-normal`}>
                    {row.item}
                  </th>
                  <td className={`${CELL} text-right tabular-nums`}>
                    {formatPlnRange(row.minPln, row.maxPln)}
                  </td>
                  <td className={CELL}>{row.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className={`${CELL} text-left font-semibold`}>
                  Razem
                </th>
                <td className={`${CELL} text-right font-semibold tabular-nums`}>
                  {formatPlnRange(plan.totalMinPln, plan.totalMaxPln)}
                </td>
                <td className={CELL} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      <Section section={TEAM}>
        <h4 className="text-lg font-semibold">Zespół</h4>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-base">
          {plan.people.map((person, index) => (
            <li key={`${index}-${person.role}`}>
              <span className="font-semibold">{person.role}</span>
              {person.fte !== undefined && ` (${formatFte(person.fte)})`}
              {person.note && `. ${person.note}`}
            </li>
          ))}
        </ul>
        <h4 className="mt-2 text-lg font-semibold">
          Partnerzy (rodzaje organizacji)
        </h4>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-base">
          {plan.partners.map((partner, index) => (
            <li key={`${index}-${partner.type}`}>
              <span className="font-semibold">{partner.type}</span>:{" "}
              {partner.role}
            </li>
          ))}
        </ul>
      </Section>

      <Section section={RISKS}>
        <div
          role="region"
          aria-label="Tabela ryzyk"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be reachable by keyboard
          tabIndex={0}
          className={TABLE_SCROLL}
        >
          <table className="w-full border-collapse text-base">
            <caption className="sr-only">Ryzyka i sposoby zapobiegania</caption>
            <thead>
              <tr>
                <th scope="col" className={`${HEAD_CELL} w-2/5`}>
                  Ryzyko
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Jak mu zapobiec
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.risks.map((row, index) => (
                <tr key={`${index}-${row.risk}`}>
                  <th scope="row" className={`${CELL} text-left font-normal`}>
                    {row.risk}
                  </th>
                  <td className={CELL}>{row.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section section={KPIS}>
        <dl className="flex flex-col text-base">
          {plan.kpis.map((kpi, index) => (
            <div
              key={`${index}-${kpi.indicator}`}
              className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-1 border-t border-border py-2.5 last:border-b sm:grid-cols-2"
            >
              <dt className="font-semibold">{kpi.indicator}</dt>
              <dd>{kpi.target}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section section={FUNDING}>
        <BulletList items={plan.fundingOptions} />
      </Section>

      <Section section={ASSUMPTIONS}>
        <BulletList items={plan.assumptions} />
      </Section>
    </article>
  );
}
