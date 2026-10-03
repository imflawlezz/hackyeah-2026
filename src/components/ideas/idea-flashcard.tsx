import Link from "next/link";
import type { Idea } from "@/types";
import {
  STAGE_ICON,
  STAGE_LABEL,
  STATUS_ICON,
  STATUS_LABEL,
} from "@/lib/ideas/labels";

export function IdeaFlashcard({ idea }: { idea: Idea }) {
  const StageIcon = STAGE_ICON[idea.stage];
  const StatusIcon = STATUS_ICON[idea.status];

  return (
    <article className="flex flex-col gap-3 border border-border bg-card p-4">
      <h3 className="text-xl text-heading">
        <Link
          href={`/ideas/${idea.id}`}
          className="underline-offset-4 hover:underline"
        >
          {idea.title}
        </Link>
      </h3>
      <p>{idea.summary}</p>
      <p>
        <span className="font-medium">Dla kogo: </span>
        {idea.targetGroup}
      </p>
      <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1">
          <StageIcon className="size-4" aria-hidden="true" />
          {STAGE_LABEL[idea.stage]}
        </span>
        <span className="inline-flex items-center gap-1">
          <StatusIcon className="size-4" aria-hidden="true" />
          {STATUS_LABEL[idea.status]}
        </span>
      </p>
    </article>
  );
}
