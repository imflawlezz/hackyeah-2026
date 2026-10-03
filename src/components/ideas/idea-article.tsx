import type { Idea } from "@/types";
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

export function IdeaArticle({ idea }: { idea: Idea }) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
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
