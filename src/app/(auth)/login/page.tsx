import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { AuthPanel } from "@/components/auth/auth-panel";
import { safeNext } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";
import { hasSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Logowanie",
  description:
    "Zaloguj się jako mieszkaniec, instytucja, ekspert albo administrator.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const next = safeNext(first(params.next));

  if (await getCurrentUser()) redirect(next);

  const initialMode = first(params.mode) === "signup" ? "signup" : "signin";
  const callbackFailed = first(params.error) === "callback";

  return (
    <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,28rem)_minmax(0,24rem)]">
      <div className="flex min-w-0 flex-col gap-6">
        <h1 className="text-3xl font-bold">Konto w HubMI.pl</h1>

        {!hasSupabase ? (
          <p className="flex items-start gap-2 rounded-md border border-input bg-muted p-4">
            <InformationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-6 shrink-0"
            />
            To wersja demonstracyjna. Logowanie jest wyłączone, a wszystkie
            moduły są otwarte.
          </p>
        ) : null}

        {hasSupabase && next !== "/" ? (
          <p className="flex items-start gap-2 rounded-md border border-input bg-muted p-4">
            <InformationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-6 shrink-0"
            />
            Zaloguj się, aby otworzyć tę stronę. Po zalogowaniu od razu na nią
            wrócisz.
          </p>
        ) : null}

        {callbackFailed ? (
          <p
            role="alert"
            className="rounded-md border border-destructive p-4 font-semibold text-destructive"
          >
            Link potwierdzający wygasł albo został już użyty. Zaloguj się lub
            załóż konto ponownie.
          </p>
        ) : null}

        <AuthPanel
          initialMode={initialMode}
          next={next}
          enabled={hasSupabase}
        />
      </div>

      <aside
        aria-labelledby="account-benefits"
        className="flex flex-col gap-4 lg:border-l lg:border-border lg:pl-12"
      >
        <h2 id="account-benefits" className="text-xl font-bold">
          Do czego służy konto
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li>Zgłaszasz pomysły na innowacje i wracasz do swoich szkiców.</li>
          <li>
            Piszesz do zespołu Hubu i odbierasz odpowiedzi w Wiadomościach.
          </li>
          <li>Oceniasz testowane rozwiązania pod własną nazwą.</li>
        </ul>
        <p>Dopasowanie innowacji i baza wiedzy działają bez logowania.</p>
        <p className="text-muted-foreground">
          Konta administratorów zakłada zespół ROPS Kraków.
        </p>
      </aside>
    </div>
  );
}
