import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { challenges } from "@/lib/knowledge/challenges";
import { filterInnovations } from "@/lib/knowledge/filter";
import { innovationCountText } from "@/lib/knowledge/plural";
import { libraryHref, matchHref } from "@/lib/knowledge/url";
import { cn } from "@/lib/utils";
import type { Innovation } from "@/types";

const ACTION_CLASSES =
  "h-auto min-h-11 justify-start gap-2 px-4 py-2 text-base whitespace-normal";

export function ChallengeList({
  innovations,
}: {
  innovations: readonly Innovation[];
}) {
  return (
    <ol className="border-t border-border">
      {challenges.map((challenge) => {
        const Icon = challenge.icon;
        const titleId = `challenge-${challenge.id}-title`;
        const count = filterInnovations(innovations, {
          category: challenge.categories,
        }).length;

        return (
          <li
            key={challenge.id}
            aria-labelledby={titleId}
            className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-4 border-b border-border py-8 sm:grid-cols-[4rem_minmax(0,1fr)] lg:grid-cols-[4rem_minmax(0,1fr)_17rem]"
          >
            <div className="flex items-center gap-3 sm:flex-col sm:items-start">
              <Icon aria-hidden="true" className="size-6 text-primary" />
            </div>

            <div className="flex max-w-2xl flex-col gap-2">
              <h3
                id={titleId}
                className="font-heading text-2xl leading-snug font-semibold text-balance break-words"
              >
                {challenge.title}
              </h3>
              <p className="text-base">{challenge.description}</p>
              <p className="text-sm text-muted-foreground">
                W bibliotece: {innovationCountText(count)} (
                {challenge.categories.join(", ")}).
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:col-start-2 lg:col-start-3">
              <Link
                href={libraryHref(challenge.categories)}
                className={cn(buttonVariants(), ACTION_CLASSES)}
              >
                Zobacz innowacje
                <span className="sr-only">: {challenge.title}</span>
              </Link>
              <Link
                href={matchHref(challenge.categories[0]!)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  ACTION_CLASSES,
                )}
              >
                Opisz podobny problem
                <span className="sr-only">: {challenge.title}</span>
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
