"use client";

import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { recomputeEmbeddingsAction } from "@/app/admin/actions";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Button } from "@/components/ui/button";

export function RecomputeEmbeddingsButton({ missing }: { missing: number }) {
  const { pending, message, run } = useAdminAction();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        aria-disabled={pending || undefined}
        onClick={() => {
          if (!pending) run(() => recomputeEmbeddingsAction());
        }}
        className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
      >
        <ArrowPathIcon
          aria-hidden="true"
          className={pending ? "size-5 motion-safe:animate-spin" : "size-5"}
        />
        {pending ? "Przeliczam wektory…" : "Przelicz brakujące wektory"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {missing ? `Bez wektora: ${missing}` : "Wszystkie mają wektory"}
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {pending ? "Przeliczam wektory…" : message}
      </p>
    </div>
  );
}
