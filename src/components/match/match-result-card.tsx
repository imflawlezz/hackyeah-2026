import {
  ArrowRightIcon,
  CircleCheckBigIcon,
  CircleDashedIcon,
  CircleDotIcon,
  type LucideIcon,
  UsersIcon,
} from "lucide-react";
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
  { icon: LucideIcon; className: string; filled: number }
> = {
  high: {
    icon: CircleCheckBigIcon,
    className: "border-primary/40 bg-primary/10 text-foreground",
    filled: 3,
  },
  medium: {
    icon: CircleDotIcon,
    className: "border-border bg-secondary text-secondary-foreground",
    filled: 2,
  },
  low: {
    icon: CircleDashedIcon,
    className: "border-dashed border-border bg-background text-foreground",
    filled: 1,
  },
};

export function MatchResultCard({
  result,
  relevance,
  showPercent,
}: {
  result: MatchResult;
  relevance: number;
  showPercent: boolean;
}) {
  const { innovation, reason } = result;
  const tier = scoreTier(relevance);
  const {
    icon: TierIcon,
    className: tierClassName,
    filled,
  } = TIER_STYLES[tier];
  const titleId = `match-${innovation.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="h-auto px-3 py-1 text-sm whitespace-normal"
        >
          {innovation.category}
        </Badge>
        <p
          data-tier={tier}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
            tierClassName,
          )}
        >
          <TierIcon aria-hidden="true" className="size-4 shrink-0" />
          <span>{scoreLabel(relevance)}</span>
          {showPercent && (
            <span className="font-normal tabular-nums">
              ({formatPercent(relevance)})
            </span>
          )}
          <span aria-hidden="true" className="flex gap-0.5">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={cn(
                  "h-3 w-1.5 rounded-full",
                  step <= filled ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </span>
        </p>
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
        <ul aria-label="Tagi" className="flex flex-wrap gap-2">
          {innovation.tags.slice(0, MAX_TAGS).map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-muted px-2 py-0.5 text-sm text-foreground"
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}

      {reason && (
        <div className="rounded-lg border-l-4 border-primary bg-muted/60 px-4 py-3">
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
          <ArrowRightIcon aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
