import type { Idea } from "@/types";
import Link from "next/link";
import type { IdeaReview } from "@/lib/data/ideas";
import { STAGE_LABEL } from "@/lib/ideas/labels";

const CANVAS_FIELDS: {
  key: keyof NonNullable<Idea["canvas"]>;
  label: string;
}[] = [
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Jak to działa" },
  { key: "novelty", label: "Co jest nowego" },
  { key: "resources", label: "Czego potrzeba" },
  { key: "partners", label: "Współpraca" },
  { key: "risks", label: "Ryzyka" },
  { key: "successMeasures", label: "Po czym poznać, że działa" },
];

export function IdeaArticle({
  idea,
  review,
}: {
  idea: Idea;
  review?: IdeaReview | null;
}) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2.5">
        <h1 className="text-3xl text-heading">{idea.title}</h1>
        <p className="max-w-2xl text-lg">{idea.summary}</p>
        <p>
          <span className="font-semibold">Dla kogo: </span>
          {idea.targetGroup}
        </p>
        <p>
          <span className="font-semibold">Etap: </span>
          {STAGE_LABEL[idea.stage]}
        </p>
        {idea.municipality ? (
          <p>
            <span className="font-semibold">Gmina: </span>
            {idea.municipality}
          </p>
        ) : null}
      </header>
      {review ? (
        <section
          aria-labelledby="review-heading"
          className="min-w-0 rounded-lg border border-input bg-background p-4 text-foreground"
        >
          <h2 id="review-heading" className="text-2xl font-semibold">
            Odpowiedź zespołu ROPS
          </h2>
          <p className="mt-3 [overflow-wrap:anywhere] whitespace-pre-wrap">
            {review.note}
          </p>
          {review.reviewed_at ? (
            <p className="mt-3">
              Data odpowiedzi:{" "}
              <time dateTime={review.reviewed_at}>
                {new Intl.DateTimeFormat("pl-PL", {
                  dateStyle: "long",
                  timeZone: "Europe/Warsaw",
                }).format(new Date(review.reviewed_at))}
              </time>
            </p>
          ) : null}
          <Link
            href={`/messages/new?kind=ask_rops&idea=${encodeURIComponent(idea.id)}`}
            className="mt-3 inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Napisz do ROPS
          </Link>
        </section>
      ) : null}
      <section aria-labelledby="canvas-heading" className="flex flex-col gap-4">
        <h2 id="canvas-heading" className="text-2xl text-heading">
          Kanwa innowacji
        </h2>
        <dl className="flex flex-col gap-4">
          {CANVAS_FIELDS.map((field) => (
            <div key={field.key} className="border-t border-border pt-4">
              <dt className="font-semibold">{field.label}</dt>
              <dd className="mt-1 max-w-2xl">
                {idea.canvas?.[field.key]?.trim() || "Nie podano."}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}
