import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatPercent,
  type ScoreTier,
  scoreLabel,
  scoreTier,
} from "@/lib/match/score";
import type { MatchResult } from "@/types";

const MAX_TAGS = 3;

const TIER_STYLES: Record<
  ScoreTier,
  {
    icon: typeof CheckCircleIcon;
    className: string;
    accent: string;
    filled: number;
  }
> = {
  high: {
    icon: CheckCircleIcon,
    className: "border-success bg-success/10",
    accent: "text-success",
    filled: 3,
  },
  medium: {
    icon: InformationCircleIcon,
    className: "border-primary bg-primary/10",
    accent: "text-primary",
    filled: 2,
  },
  low: {
    icon: ExclamationTriangleIcon,
    className:
      "border-dashed border-warning bg-warning text-warning-foreground",
    accent: "text-warning-foreground",
    filled: 1,
  },
};

/**
 * A "related" card shows no match label, percentage or "why it fits" text:
 * the result did not reach the match tier, so none of them would be true.
 */
export function MatchResultCard({
  result,
  relevance = 0,
  showPercent = false,
  related = false,
}: {
  result: MatchResult;
  relevance?: number;
  showPercent?: boolean;
  related?: boolean;
}) {
  const { innovation, reason } = result;
  const tier = scoreTier(relevance);
  const {
    icon: TierIcon,
    className: tierClassName,
    accent,
    filled,
  } = TIER_STYLES[tier];
  const titleId = `match-${innovation.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col gap-4 border-b border-border bg-card py-8 text-card-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="h-auto px-2.5 py-1 text-sm whitespace-normal"
        >
          {innovation.category}
        </Badge>
        {!related && (
          <p
            data-tier={tier}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-sm font-semibold text-foreground",
              tierClassName,
            )}
          >
            <TierIcon
              aria-hidden="true"
              className={cn("size-5 shrink-0", accent)}
            />
            <span>{scoreLabel(relevance)}</span>
            {showPercent && (
              <span className="font-normal tabular-nums">
                ({formatPercent(relevance)})
              </span>
            )}
            <span aria-hidden="true" className={cn("flex gap-1", accent)}>
              {[1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={cn(
                    "h-3 w-1.5 rounded-full",
                    step <= filled ? "bg-current" : "bg-current opacity-25",
                  )}
                />
              ))}
            </span>
          </p>
        )}
      </div>

      <h3
        id={titleId}
        className="text-xl leading-snug font-semibold text-balance"
      >
        {innovation.title}
      </h3>

      <p className="flex items-start gap-2 text-base">
        <UsersIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <span>
          <span className="font-semibold">Dla kogo:</span>{" "}
          {innovation.targetGroup}
        </span>
      </p>

      {innovation.tags.length > 0 && (
        <ul aria-label="Tematy" className="flex flex-wrap gap-2">
          {innovation.tags.slice(0, MAX_TAGS).map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-muted px-2 py-1 text-sm text-foreground"
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}

      {reason && !related && (
        <div className="max-w-[70ch] border-l border-border pl-4">
          <p className="text-sm font-semibold">Dlaczego to pasuje</p>
          <p className="mt-1 text-base">{reason}</p>
        </div>
      )}

      <div className="mt-auto pt-2">
        <Link
          href={`/knowledge/${encodeURIComponent(innovation.id)}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-auto min-h-11 gap-2 px-4 py-2 text-base whitespace-normal",
          )}
        >
          Zobacz szczegóły
          <span className="sr-only">: {innovation.title}</span>
        </Link>
      </div>
    </article>
  );
}
