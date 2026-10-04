"use client";

import { PlayCircleIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { distinctSorted, filterInnovations } from "@/lib/knowledge/filter";
import { foundCountText } from "@/lib/knowledge/plural";
import type { LibraryFilters } from "@/lib/knowledge/url";
import { cn } from "@/lib/utils";
import type { Innovation } from "@/types";

export const EMPTY_TEXT =
  "Nic nie pasuje do tych filtrów. Zmień je albo wyczyść wyszukiwanie.";

const SEARCH_DEBOUNCE_MS = 250;
const MAX_TAGS = 3;
const EXCERPT_LENGTH = 200;

function excerpt(innovation: Innovation): string {
  if (innovation.summary) return innovation.summary;
  const text = innovation.description;
  if (text.length <= EXCERPT_LENGTH) return text;
  const cut = text.slice(0, EXCERPT_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function InnovationLibrary({
  innovations,
  filters,
  onChange,
}: {
  innovations: readonly Innovation[];
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
}) {
  const [text, setText] = useState(filters.q);
  // The last query this component sent up, to tell its own updates from
  // outside ones (a link from a challenge, the header link, "back").
  const [emittedQ, setEmittedQ] = useState(filters.q);
  const [seenQ, setSeenQ] = useState(filters.q);
  if (filters.q !== seenQ) {
    setSeenQ(filters.q);
    if (filters.q !== emittedQ) {
      setEmittedQ(filters.q);
      setText(filters.q);
    }
  }

  useEffect(() => {
    const q = text.trim();
    if (q === filters.q) return;
    const timer = setTimeout(() => {
      setEmittedQ(q);
      onChange({ ...filters, q });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, filters, onChange]);

  const categories = useMemo(
    () => distinctSorted(innovations.map(({ category }) => category)),
    [innovations],
  );
  const groups = useMemo(
    () => distinctSorted(innovations.map(({ targetGroup }) => targetGroup)),
    [innovations],
  );
  const results = useMemo(
    () =>
      filterInnovations(innovations, {
        q: filters.q,
        category: filters.categories,
        targetGroup: filters.group,
      }),
    [innovations, filters],
  );

  function toggleCategory(category: string, checked: boolean) {
    const next = checked
      ? [...filters.categories, category]
      : filters.categories.filter((item) => item !== category);
    onChange({ ...filters, q: text.trim(), categories: next });
    setEmittedQ(text.trim());
  }

  function clearFilters() {
    setText("");
    setEmittedQ("");
    onChange({ q: "", categories: [], group: "" });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <form
        role="search"
        aria-label="Filtry biblioteki"
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="library-search" className="text-base font-semibold">
            Szukaj w bibliotece
          </Label>
          <Input
            id="library-search"
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-describedby="library-search-hint"
            autoComplete="off"
          />
          <p id="library-search-hint" className="text-sm text-muted-foreground">
            Szukamy w tytułach, opisach i tagach.
          </p>
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-base font-semibold">Kategoria</legend>
          {categories.map((category) => (
            <label
              key={category}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 text-base"
            >
              <Checkbox
                name="category"
                value={category}
                checked={filters.categories.includes(category)}
                onChange={(event) =>
                  toggleCategory(category, event.target.checked)
                }
              />
              {category}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="library-group" className="text-base font-semibold">
            Grupa docelowa
          </Label>
          <NativeSelect
            id="library-group"
            value={groups.includes(filters.group) ? filters.group : ""}
            onChange={(event) => {
              onChange({
                ...filters,
                q: text.trim(),
                group: event.target.value,
              });
              setEmittedQ(text.trim());
            }}
          >
            <option value="">Wszystkie grupy</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="h-auto min-h-11 px-4 py-2"
          >
            Wyczyść filtry
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-base font-semibold"
        >
          {foundCountText(results.length)}
        </p>

        {results.length === 0 ? (
          <p className="border-t border-border py-8 text-base">{EMPTY_TEXT}</p>
        ) : (
          <ul className="border-t border-border">
            {results.map((innovation) => {
              const titleId = `library-${innovation.id}-title`;
              return (
                <li key={innovation.id} className="border-b border-border">
                  <article
                    aria-labelledby={titleId}
                    className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-4 py-8 md:grid-cols-[minmax(0,1fr)_14rem]"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="h-auto rounded-md px-2.5 py-1 text-sm whitespace-normal"
                        >
                          {innovation.category}
                        </Badge>
                        {innovation.videoUrl && (
                          <Badge
                            variant="secondary"
                            className="h-auto gap-2 rounded-md border-border px-2.5 py-1 text-sm [&>svg]:size-4!"
                          >
                            <PlayCircleIcon aria-hidden="true" />
                            Film
                          </Badge>
                        )}
                      </div>
                      <h3
                        id={titleId}
                        className="font-heading text-2xl leading-snug font-semibold text-balance break-words"
                      >
                        {innovation.title}
                      </h3>
                      <p className="max-w-2xl text-base">
                        {excerpt(innovation)}
                      </p>
                      {innovation.tags.length > 0 && (
                        <ul aria-label="Tagi" className="flex flex-wrap gap-2">
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
                    </div>

                    <div className="flex flex-col items-start gap-2.5 text-base">
                      <p>
                        <span className="font-semibold">Dla kogo:</span>{" "}
                        {innovation.targetGroup}
                      </p>
                      {innovation.region && (
                        <p>
                          <span className="font-semibold">Region:</span>{" "}
                          {innovation.region}
                        </p>
                      )}
                      <Link
                        href={`/knowledge/${encodeURIComponent(innovation.id)}`}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "mt-auto h-auto min-h-11 gap-2 px-4 py-2 text-base whitespace-normal",
                        )}
                      >
                        Zobacz szczegóły
                        <span className="sr-only">: {innovation.title}</span>
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
