import { ArrowRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { Suspense } from "react";
import { ForbiddenNotice } from "@/components/auth/forbidden-notice";
import { buttonVariants } from "@/components/ui/button";
import { innovations, problems } from "@/lib/mocks";
import { cn } from "@/lib/utils";

const exampleProblem = problems.find(
  (problem) => problem.id === "prob-office-access",
)!;
const exampleInnovation = innovations.find(
  (innovation) => innovation.id === "inn-mobile-access",
)!;
const steps = [
  [
    "Opisz problem",
    "Napisz, kogo dotyczy problem, gdzie występuje i czego brakuje.",
  ],
  [
    "Porównujemy opis z bazą innowacji",
    "Szukamy rozwiązań związanych z Twoim opisem i wybraną kategorią.",
  ],
  [
    "Sprawdź, co pasuje, i napisz do Hubu",
    "Przeczytaj uzasadnienia. Zastanów się, co można wykorzystać w Twojej gminie.",
  ],
];
const challenges = [
  ["Starzenie się społeczeństwa", "Opieka"],
  ["Zdrowie psychiczne", "Zdrowie psychiczne"],
  ["Samotność", "Samotność"],
  ["Wykluczenie cyfrowe", "Wykluczenie cyfrowe"],
  ["Dostęp do usług społecznych", "Dostępność"],
  ["Współpraca instytucji", ""],
  ["Wyludnianie się miejscowości", ""],
];
const audiences = [
  [
    "Mieszkańcy i organizacje społeczne",
    "Opisz potrzebę sąsiadów lub poszukaj rozwiązania dla osób, którym pomagasz.",
  ],
  [
    "Gminy i samorządy",
    "Sprawdź, które pomysły mogą wesprzeć pracę Twojej gminy, CUS lub OPS.",
  ],
  [
    "Eksperci i zespół ROPS",
    "Porównaj potrzeby mieszkańców z przykładami działań i pomóż dobrać kolejne kroki.",
  ],
];

export default function HomePage() {
  return (
    <div className="space-y-16 py-4 sm:py-8">
      <Suspense fallback={null}>
        <ForbiddenNotice />
      </Suspense>
      <section
        aria-labelledby="hero-heading"
        className="grid items-start gap-12 lg:grid-cols-12"
      >
        <div className="space-y-6 lg:col-span-7">
          <p className="text-sm font-semibold text-muted-foreground">
            Małopolski Hub Innowacji Społecznych · ROPS Kraków
          </p>
          <h1 id="hero-heading" className="text-3xl font-semibold sm:text-4xl">
            Opisz, czego brakuje w Twojej okolicy. Poznaj pomysły dla swojej
            gminy.
          </h1>
          <p className="max-w-[65ch] text-lg">
            Samotność, opieka nad bliskimi, dostęp do usług. Znajdź przykłady
            działań, które odpowiadają na potrzeby mieszkańców Małopolski.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/match"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-auto min-h-12 gap-2 px-6 py-3 whitespace-normal",
              )}
            >
              Opisz problem{" "}
              <ArrowRightIcon aria-hidden="true" className="size-5" />
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            >
              Przeglądaj bazę innowacji
            </Link>
          </div>
        </div>
        <aside
          aria-labelledby="example-heading"
          className="min-w-0 rounded-md border border-border bg-muted p-6 lg:col-span-5"
        >
          <p className="text-sm font-semibold text-muted-foreground">
            Przykład z bazy prototypu
          </p>
          <h2 id="example-heading" className="mt-4 text-xl font-semibold">
            Dostępny urząd
          </h2>
          <p className="mt-3 text-base">{exampleProblem.description}</p>
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Pomysł do sprawdzenia
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              {exampleInnovation.title}
            </h3>
            <p className="mt-3 text-base">
              <span className="font-semibold">Dla kogo: </span>
              {exampleInnovation.targetGroup}
            </p>
            <p className="mt-3 text-base">
              Zestaw z czytnikiem ekranu może pomóc mieszkańcom z
              niepełnosprawnością wzroku załatwić sprawę w urzędzie.
            </p>
          </div>
        </aside>
      </section>
      <section
        aria-labelledby="how-heading"
        className="border-t border-border pt-12"
      >
        <h2 id="how-heading" className="text-2xl font-semibold">
          Jak to działa
        </h2>
        <ol className="mt-6 divide-y divide-border">
          {steps.map(([title, description], index) => (
            <li
              key={title}
              className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr_1fr] sm:gap-6"
            >
              <span
                aria-hidden="true"
                className="font-heading text-2xl text-heading"
              >
                0{index + 1}
              </span>
              <h3 className="text-xl font-semibold">
                <span className="sr-only">Krok {index + 1}. </span>
                {title}
              </h3>
              <p className="max-w-[65ch] text-base text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <section
        aria-labelledby="challenges-heading"
        className="rounded-md bg-muted p-6 sm:p-8"
      >
        <h2 id="challenges-heading" className="text-2xl font-semibold">
          Z czym możesz przyjść
        </h2>
        <p className="mt-3 max-w-[65ch]">
          Nie musisz mieć gotowego pomysłu. Zacznij od tego, co utrudnia
          codzienne życie w Twojej okolicy.
        </p>
        <ul className="mt-6 grid gap-x-12 sm:grid-cols-2">
          {challenges.map(([label, category]) => (
            <li key={label} className="border-b border-border">
              <Link
                href={
                  category
                    ? `/match?category=${encodeURIComponent(category)}`
                    : "/match"
                }
                className="flex min-h-11 items-center justify-between gap-4 py-3 text-primary underline underline-offset-4"
              >
                {label}
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-5 shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="audiences-heading">
        <h2 id="audiences-heading" className="text-2xl font-semibold">
          Dla kogo
        </h2>
        <dl className="mt-6 divide-y divide-border">
          {audiences.map(([title, description]) => (
            <div
              key={title}
              className="grid gap-3 py-6 sm:grid-cols-[2fr_3fr] sm:gap-12"
            >
              <dt className="font-heading text-xl font-semibold text-heading">
                {title}
              </dt>
              <dd className="max-w-[65ch]">{description}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="border-t border-border pt-6 text-sm text-muted-foreground">
        Prototyp przygotowany na HackYeah 2026. Dane w bazie są przykładowe.
      </p>
    </div>
  );
}
