"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actionClassName = "h-auto min-h-11 px-4 py-2 text-base whitespace-normal";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Only the digest is logged: it matches the server log entry without
    // exposing the message or stack trace.
    console.error("Unexpected error", error.digest);
  }, [error]);

  // Move focus so screen reader users hear the error straight away.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex max-w-2xl flex-col items-start gap-4">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-heading text-3xl font-bold text-balance outline-none"
      >
        Coś poszło nie tak
      </h1>
      <p className="text-lg">
        Spróbuj ponownie. Jeśli błąd się powtórzy, wróć do strony głównej.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => retry()} className={actionClassName}>
          Spróbuj ponownie
        </Button>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            actionClassName,
          )}
        >
          Przejdź do strony głównej
        </Link>
      </div>
    </div>
  );
}
