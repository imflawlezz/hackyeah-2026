import {
  ArrowRightIcon,
  HandshakeIcon,
  LibraryIcon,
  type LucideIcon,
  PencilLineIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ForbiddenNotice } from "@/components/auth/forbidden-notice";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Opisz problem",
    description:
      "Napisz własnymi słowami, kogo dotyczy problem i gdzie występuje.",
    icon: PencilLineIcon,
  },
  {
    title: "AI wyszukuje podobne innowacje",
    description:
      "Porównujemy Twój opis z bazą sprawdzonych innowacji społecznych.",
    icon: SparklesIcon,
  },
  {
    title: "Poznaj rozwiązania i skontaktuj się z Hubem",
    description:
      "Zobacz, dlaczego rozwiązanie pasuje, i zapytaj Hub o wdrożenie.",
    icon: HandshakeIcon,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 py-4 sm:py-8">
      <Suspense fallback={null}>
        <ForbiddenNotice />
      </Suspense>
      <section
        aria-labelledby="hero-heading"
        className="flex max-w-3xl flex-col items-start gap-6"
      >
        <p className="text-base font-semibold text-primary">
          Małopolski Hub Innowacji Społecznych
        </p>
        <h1
          id="hero-heading"
          className="text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl"
        >
          Masz problem w swojej okolicy? Znajdźmy sprawdzone rozwiązanie.
        </h1>
        <p className="max-w-2xl text-lg sm:text-xl">
          Opisz, czego brakuje mieszkańcom, a wskażemy innowacje społeczne,
          które zadziałały już w innych miejscach.
        </p>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href="/match"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-auto min-h-14 gap-2 px-8 py-3 text-lg font-semibold [&_svg:not([class*='size-'])]:size-5",
            )}
          >
            Opisz problem
            <ArrowRightIcon aria-hidden="true" />
          </Link>
          <Link
            href="/knowledge"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm px-1 text-lg font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            <LibraryIcon aria-hidden="true" className="size-5" />
            Przeglądaj bazę innowacji
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="how-it-works-heading"
        className="flex flex-col gap-6"
      >
        <h2
          id="how-it-works-heading"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Jak to działa
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
                  >
                    {index + 1}
                  </span>
                  <Icon aria-hidden="true" className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  <span className="sr-only">Krok {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="text-base">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
