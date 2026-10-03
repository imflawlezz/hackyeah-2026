import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/16/solid";
import type { InnovationStatus } from "@/lib/admin/types";
import { UNMET_SCORE_THRESHOLD } from "@/lib/admin/trends";
import { cn } from "@/lib/utils";

const PILL =
  "inline-flex w-fit max-w-full items-center gap-1.5 rounded-sm border px-2 py-0.5 text-sm font-medium sm:whitespace-nowrap";

const STATUS = {
  published: {
    label: "Opublikowana",
    icon: CheckCircleIcon,
    className: "border-success text-foreground [&>svg]:text-success",
  },
  draft: {
    label: "Szkic",
    icon: PencilSquareIcon,
    className:
      "border-warning border-dashed text-foreground [&>svg]:text-warning",
  },
  archived: {
    label: "Zarchiwizowana",
    icon: ArchiveBoxIcon,
    className: "border-border text-muted-foreground",
  },
} satisfies Record<InnovationStatus, unknown>;

export function StatusBadge({ status }: { status: InnovationStatus }) {
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span className={cn(PILL, className)}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </span>
  );
}

export function EmbeddingBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span
      className={cn(PILL, "border-border text-foreground [&>svg]:text-success")}
    >
      <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0" />
      Wektor gotowy
    </span>
  ) : (
    <span
      className={cn(
        PILL,
        "border-warning text-foreground [&>svg]:text-warning",
      )}
    >
      <ExclamationTriangleIcon aria-hidden="true" className="size-4 shrink-0" />
      Brak wektora
    </span>
  );
}

/** Text label for problems.best_score; never colour alone. */
export function matchQualityLabel(
  bestScore: number | null,
  source: "ai" | "mock" | null,
): string {
  if (bestScore === null) {
    return source === "mock"
      ? "Dopasowanie demonstracyjne (bez AI)"
      : "Brak oceny dopasowania";
  }
  return bestScore < UNMET_SCORE_THRESHOLD
    ? "Słabe dopasowanie"
    : "Dobre dopasowanie";
}

export function MatchQualityBadge({
  bestScore,
  source,
}: {
  bestScore: number | null;
  source: "ai" | "mock" | null;
}) {
  const weak = bestScore !== null && bestScore < UNMET_SCORE_THRESHOLD;
  return (
    <span
      className={cn(
        PILL,
        weak
          ? "border-warning text-foreground [&>svg]:text-warning"
          : "border-border text-foreground",
      )}
    >
      {weak && (
        <ExclamationTriangleIcon
          aria-hidden="true"
          className="size-4 shrink-0"
        />
      )}
      {matchQualityLabel(bestScore, source)}
      {bestScore !== null && (
        <span className="font-normal tabular-nums">
          ({bestScore.toFixed(2).replace(".", ",")})
        </span>
      )}
    </span>
  );
}
