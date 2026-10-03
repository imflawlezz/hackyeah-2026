"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NoSymbolIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

/** Shown on the home page after a redirect to /?error=forbidden. */
export function ForbiddenNotice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || searchParams.get("error") !== "forbidden") return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-md border border-destructive p-4"
    >
      <p className="flex items-center gap-2 font-semibold text-destructive">
        <NoSymbolIcon aria-hidden="true" className="size-6 shrink-0" />
        Nie masz dostępu do tej strony.
      </p>
      <Button
        variant="outline"
        size="icon"
        aria-label="Zamknij komunikat"
        onClick={() => {
          setDismissed(true);
          router.replace("/", { scroll: false });
        }}
      >
        <XMarkIcon aria-hidden="true" className="size-6" />
      </Button>
    </div>
  );
}
