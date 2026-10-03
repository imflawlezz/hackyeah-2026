"use client";

import { PencilSquareIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useDeferredValue, useId, useState } from "react";
import { EmbeddingBadge, StatusBadge } from "@/components/admin/badges";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INNOVATION_STATUSES } from "@/lib/admin/innovation-schema";
import type { AdminInnovation } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const FIELD =
  "min-h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring";

// Below sm the table stacks into labelled rows instead of scrolling sideways.
const CELL =
  "flex flex-wrap items-baseline gap-x-2 px-3 py-1 align-top @min-[50rem]:table-cell @min-[50rem]:py-3 @max-[50rem]:before:min-w-28 @max-[50rem]:before:text-sm @max-[50rem]:before:font-semibold @max-[50rem]:before:text-muted-foreground @max-[50rem]:before:content-[attr(data-label)]";

function normalize(text: string) {
  return text.toLocaleLowerCase("pl");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InnovationsTable({
  innovations,
  canEdit,
}: {
  innovations: AdminInnovation[];
  canEdit: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const deferredQuery = useDeferredValue(query);

  const categories = [
    ...new Set(innovations.map((item) => item.category)),
  ].sort((a, b) => a.localeCompare(b, "pl"));
  const needle = normalize(deferredQuery.trim());
  const visible = innovations.filter(
    (item) =>
      (!category || item.category === category) &&
      (!status || item.status === status) &&
      (!needle ||
        normalize(
          [
            item.title,
            item.summary,
            item.targetGroup,
            item.region,
            item.tags.join(" "),
          ].join(" "),
        ).includes(needle)),
  );

  return (
    <div className="@container flex flex-col gap-4">
      <div
        role="search"
        aria-label="Filtruj innowacje"
        className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-q`} className="text-base">
            Szukaj
          </Label>
          <Input
            id={`${id}-q`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="text-base md:text-base"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-category`} className="text-base">
            Kategoria
          </Label>
          <select
            id={`${id}-category`}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={FIELD}
          >
            <option value="">Wszystkie</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-status`} className="text-base">
            Status
          </Label>
          <select
            id={`${id}-status`}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={FIELD}
          >
            <option value="">Wszystkie</option>
            {INNOVATION_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="text-base text-muted-foreground"
      >
        Wyświetlono {visible.length} z {innovations.length}.
      </p>

      <table className="block w-full border-collapse text-base @min-[50rem]:table">
        <caption className="sr-only">Innowacje w bazie wiedzy</caption>
        <thead className="hidden border-b-2 border-border text-left @min-[50rem]:table-header-group">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">
              Tytuł
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Kategoria
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Status
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Wektor
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Zmieniono
            </th>
            {canEdit && (
              <th scope="col" className="px-3 py-2 font-semibold">
                <span className="sr-only">Akcje</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="block @min-[50rem]:table-row-group">
          {visible.map((item) => (
            <tr
              key={item.id}
              className="block border-b border-border py-2 @min-[50rem]:table-row @min-[50rem]:py-0"
            >
              <th
                scope="row"
                data-label="Tytuł"
                className={cn(CELL, "text-left font-semibold")}
              >
                <span className="flex flex-col">
                  {item.title}
                  <span className="text-sm font-normal text-muted-foreground">
                    {item.targetGroup}
                  </span>
                </span>
              </th>
              <td data-label="Kategoria" className={CELL}>
                {item.category}
              </td>
              <td data-label="Status" className={CELL}>
                <StatusBadge status={item.status} />
              </td>
              <td data-label="Wektor" className={CELL}>
                <EmbeddingBadge ready={item.hasEmbedding} />
              </td>
              <td data-label="Zmieniono" className={cn(CELL, "tabular-nums")}>
                {formatDate(item.updatedAt)}
              </td>
              {canEdit && (
                <td className={cn(CELL, "@max-[50rem]:before:content-none")}>
                  <Link
                    href={`/admin/innovations/${encodeURIComponent(item.id)}/edit`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-primary underline underline-offset-4 hover:no-underline"
                  >
                    <PencilSquareIcon aria-hidden="true" className="size-5" />
                    Edytuj<span className="sr-only">: {item.title}</span>
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!visible.length && (
        <p>
          Żadna innowacja nie pasuje do filtrów. Zmień wyszukiwane słowo albo
          kategorię.
        </p>
      )}
    </div>
  );
}
