"use client";

import { useActionState } from "react";
import { signInAsDemo } from "@/app/(auth)/login/demo-actions";

const accounts = [
  {
    role: "resident",
    label: "Mieszkaniec",
    description: "Opisz problem i zgłoś swój pomysł.",
  },
  {
    role: "jst",
    label: "Gmina (JST)",
    description: "Sprawdź współpracę dla instytucji.",
  },
  { role: "expert", label: "Ekspert", description: "Odpowiedz na wiadomości." },
  {
    role: "admin",
    label: "Administrator ROPS",
    description: "Przejrzyj i moderuj zgłoszenia.",
  },
] as const;

function DemoAccount({ account }: { account: (typeof accounts)[number] }) {
  const [state, action, pending] = useActionState(
    async () => {
      try {
        return await signInAsDemo(account.role);
      } catch (error) {
        // Let Next.js process successful server redirects.
        if (error instanceof Error && error.message === "NEXT_REDIRECT")
          throw error;
        return { error: "Nie udało się połączyć. Spróbuj ponownie." };
      }
    },
    { error: "" },
  );
  const descriptionId = `demo-${account.role}-description`;
  return (
    <form action={action} className="flex min-w-0 flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        aria-describedby={descriptionId}
        className="min-h-11 w-full rounded-md border border-input bg-background px-4 py-3 text-left font-semibold text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70"
      >
        {pending ? `Loguję… ${account.label}` : account.label}
      </button>
      <p id={descriptionId} className="text-sm text-muted-foreground">
        {account.description}
      </p>
      <p role="status" className="sr-only">
        {pending ? "Trwa logowanie." : ""}
      </p>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function DemoAccounts({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <section
      aria-labelledby="demo-accounts-heading"
      className="flex min-w-0 flex-col gap-4 rounded-md border border-input bg-background p-4 text-foreground"
    >
      <h2 id="demo-accounts-heading" className="text-xl font-bold">
        Konta demonstracyjne
      </h2>
      <p>Dane są fikcyjne. Możesz zalogować się jednym kliknięciem.</p>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {accounts.map((account) => (
          <DemoAccount key={account.role} account={account} />
        ))}
      </div>
    </section>
  );
}
