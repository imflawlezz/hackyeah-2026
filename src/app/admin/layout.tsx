import {
  EyeIcon,
  InformationCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";
import { pageAccess } from "@/app/admin/access";
import { AdminNav } from "@/components/admin/admin-nav";
import { buttonVariants } from "@/components/ui/button";
import type { AdminMode } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "Panel administratora",
    template: "%s · Panel administratora · HubMI.pl",
  },
  description:
    "Weryfikuj zgłoszenia, publikuj innowacje i śledź trendy potrzeb.",
  robots: { index: false, follow: false },
};

const MODE_LABELS: Record<Exclude<AdminMode, "denied">, string> = {
  admin: "Tryb administratora",
  preview: "Tryb podglądu",
  demo: "Wersja demonstracyjna",
};

function ModeNotice({ mode }: { mode: "preview" | "demo" }) {
  const Icon = mode === "demo" ? InformationCircleIcon : EyeIcon;
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-muted px-4 py-3 text-base">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-heading"
      />
      <p>
        {mode === "demo"
          ? "Wersja demonstracyjna. Zmiany nie są zapisywane."
          : "Tryb podglądu. Widzisz opublikowane innowacje i zbiorcze dane, bez treści zgłoszeń. Zmiany może wprowadzać tylko administrator."}
      </p>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO(#12): redirect to /login?next=/admin once the login flow exists.
  const access = await pageAccess();

  if (access.mode === "denied") {
    return (
      <section
        aria-labelledby="admin-denied-heading"
        className="flex max-w-2xl flex-col items-start gap-4"
      >
        <LockClosedIcon aria-hidden="true" className="size-8 text-heading" />
        <h1 id="admin-denied-heading" className="text-3xl font-bold">
          Panel administratora
        </h1>
        <p className="text-lg">
          Ta część serwisu jest dostępna tylko dla pracowników ROPS.
        </p>
        <Link
          href="/login?next=/admin"
          className={cn(
            buttonVariants(),
            "h-auto min-h-11 max-w-full py-2 text-base whitespace-normal",
          )}
        >
          Zaloguj się
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <aside className="flex flex-col gap-3 lg:border-r lg:border-border lg:pr-6">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {MODE_LABELS[access.mode]}
        </p>
        <AdminNav />
      </aside>
      <div className="flex min-w-0 flex-col gap-6 text-lg break-words">
        {access.mode !== "admin" && <ModeNotice mode={access.mode} />}
        {children}
      </div>
    </div>
  );
}
