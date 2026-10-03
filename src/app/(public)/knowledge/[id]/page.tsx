import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getInnovationById } from "@/lib/data/innovations";
import { libraryHref, matchHref } from "@/lib/knowledge/url";
import { youtubeEmbedUrl, youtubeVideoId } from "@/lib/knowledge/video";
import { cn } from "@/lib/utils";
import type { Innovation } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

// generateMetadata and the page ask for the same row; cache() makes it one query.
const loadInnovation = cache(async (rawId: string) => {
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    // Keep the raw value; it will simply not match anything.
  }
  return getInnovationById(id);
});

// No generateStaticParams on purpose: it would make Next.js treat ids from the
// database as static pages, and reading cookies for the Supabase client then
// fails with DYNAMIC_SERVER_USAGE. Every id is rendered on request instead.

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const innovation = await loadInnovation(id);
  if (!innovation) return { title: "Nie znaleźliśmy tej innowacji" };
  return {
    title: innovation.title,
    description: innovation.summary ?? innovation.description,
  };
}

const LINK_CLASSES =
  "rounded-sm text-primary underline underline-offset-4 hover:decoration-2";

function Breadcrumb({ title }: { title: string }) {
  return (
    <Breadcrumbs
      items={[
        { href: "/knowledge", label: "Baza wiedzy" },
        { href: libraryHref(), label: "Biblioteka innowacji" },
      ]}
      current={title}
    />
  );
}

function Video({ innovation }: { innovation: Innovation }) {
  if (!innovation.videoUrl) return null;
  const videoId = youtubeVideoId(innovation.videoUrl);

  return (
    <section aria-labelledby="video-heading" className="flex flex-col gap-2.5">
      <h2 id="video-heading" className="font-heading text-2xl font-semibold">
        Film
      </h2>
      {videoId && (
        <div className="aspect-video w-full overflow-hidden rounded-md border border-border">
          <iframe
            src={youtubeEmbedUrl(videoId)}
            title={`Film: ${innovation.title}`}
            loading="lazy"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full"
          />
        </div>
      )}
      <p>
        <a
          href={innovation.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(LINK_CLASSES, "inline-flex min-h-11 items-center")}
        >
          <span>
            Otwórz film na stronie źródłowej{" "}
            <span className="sr-only">(otwiera się w nowym oknie)</span>
          </span>
        </a>
      </p>
      <p className="text-sm text-muted-foreground">
        Jeśli film nie ma napisów, opis poniżej zawiera te same informacje.
      </p>
    </section>
  );
}

export default async function InnovationPage({ params }: PageProps) {
  const { id } = await params;
  const innovation = await loadInnovation(id);
  if (!innovation) notFound();

  const encodedId = encodeURIComponent(innovation.id);
  const actions = [
    {
      href: matchHref(innovation.category),
      label: "Masz podobny problem? Opisz go",
    },
    { href: `/test/${encodedId}`, label: "Chcę przetestować" },
    // TODO(#26): the messages module.
    {
      href: `/messages/new?innovation=${encodedId}`,
      label: "Zapytaj o wdrożenie",
    },
    // TODO(#28): the institution plan.
    {
      href: `/institutions?innovation=${encodedId}`,
      label: "Przygotuj plan dla instytucji",
    },
  ];
  const showSummary =
    innovation.summary && innovation.summary !== innovation.description;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb title={innovation.title} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="flex max-w-3xl flex-col gap-8">
          <header className="flex flex-col items-start gap-4">
            <Badge
              variant="outline"
              className="h-auto rounded-md px-2.5 py-1 text-sm whitespace-normal"
            >
              {innovation.category}
            </Badge>
            <h1 className="font-heading text-3xl leading-tight font-bold text-balance break-words sm:text-4xl">
              {innovation.title}
            </h1>
            {showSummary && <p className="text-xl">{innovation.summary}</p>}
          </header>

          <Video innovation={innovation} />

          <section
            aria-labelledby="description-heading"
            className="flex flex-col gap-2.5"
          >
            <h2
              id="description-heading"
              className="font-heading text-2xl font-semibold"
            >
              Jak to działa
            </h2>
            <p className="text-lg">{innovation.description}</p>
          </section>

          <dl className="grid gap-x-8 gap-y-4 border-y border-border py-6 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <dt className="font-semibold">Dla kogo</dt>
            <dd>{innovation.targetGroup}</dd>
            <dt className="font-semibold">Kategoria</dt>
            <dd>{innovation.category}</dd>
            {innovation.region && (
              <>
                <dt className="font-semibold">Region</dt>
                <dd>{innovation.region}</dd>
              </>
            )}
          </dl>

          {innovation.tags.length > 0 && (
            <ul aria-label="Tagi" className="flex flex-wrap gap-2">
              {innovation.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-muted px-2 py-1 text-sm text-foreground"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </article>

        <aside
          aria-labelledby="actions-heading"
          className="flex flex-col gap-4 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
        >
          <h2
            id="actions-heading"
            className="font-heading text-xl font-semibold"
          >
            Co dalej
          </h2>
          <ul className="flex flex-col gap-2.5">
            {actions.map((action, index) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className={cn(
                    buttonVariants({
                      variant: index === 0 ? "default" : "outline",
                    }),
                    "h-auto min-h-11 w-full justify-between gap-2 px-4 py-2 text-left text-base whitespace-normal",
                  )}
                >
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
