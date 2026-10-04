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
const challenges = [
  ["Starzenie się społeczeństwa", "Opieka"],
  ["Zdrowie psychiczne", "Zdrowie psychiczne"],
  ["Samotność", "Samotność"],
  ["Wykluczenie cyfrowe", "Wykluczenie cyfrowe"],
  ["Dostęp do usług społecznych", "Dostępność"],
  ["Współpraca instytucji", ""],
  ["Wyludnianie się miejscowości", ""],
];
export default function HomePage() {
  return (
    <div className="space-y-14 py-4 sm:py-8">
      <Suspense fallback={null}>
        <ForbiddenNotice />
      </Suspense>
      <section
        aria-labelledby="hero-heading"
        className="grid items-start gap-10 lg:grid-cols-12"
      >
        <div className="space-y-6 lg:col-span-7">
          <p className="text-sm font-semibold text-muted-foreground">
            Małopolski Hub Innowacji Społecznych
          </p>
          <h1 id="hero-heading" className="text-3xl font-semibold sm:text-4xl">
            Znajdź pomysły dla swojej okolicy
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/match"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-auto min-h-12 gap-2 px-6 py-2.5 whitespace-normal",
              )}
            >
              Opisz problem{" "}
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            >
              Przeglądaj bazę innowacji
            </Link>
          </div>
          <p className="max-w-[65ch] text-lg">
            Sprawdź rozwiązania dla mieszkańców Małopolski.
          </p>
        </div>
        <aside
          aria-labelledby="example-heading"
          className="min-w-0 rounded-md border border-border bg-muted p-6 lg:col-span-5"
        >
          <p className="text-sm font-semibold text-muted-foreground">
            Przykład z bazy
          </p>
          <h2 id="example-heading" className="mt-4 text-xl font-semibold">
            Dostępny urząd
          </h2>
          <p className="mt-2.5 text-base">{exampleProblem.description}</p>
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Pomysł do sprawdzenia
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              {exampleInnovation.title}
            </h3>
            <p className="mt-2.5 text-base">
              <span className="font-semibold">Dla kogo: </span>
              {exampleInnovation.targetGroup}
            </p>
            <p className="mt-2.5 text-base">
              Zestaw z czytnikiem ekranu może pomóc mieszkańcom z
              niepełnosprawnością wzroku załatwić sprawę w urzędzie.
            </p>
          </div>
        </aside>
      </section>
      <section
        aria-labelledby="challenges-heading"
        className="rounded-md bg-muted p-6 sm:p-8"
      >
        <h2 id="challenges-heading" className="text-2xl font-semibold">
          Z czym możesz przyjść
        </h2>

        <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
          {challenges.map(([label, category]) => (
            <li key={label} className="border-b border-border">
              <Link
                href={
                  category
                    ? `/match?category=${encodeURIComponent(category)}`
                    : "/match"
                }
                className="flex min-h-11 items-center justify-between gap-4 py-2.5 text-primary underline underline-offset-4"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
