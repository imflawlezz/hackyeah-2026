"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import type { GrantCall, GrantDraftSection } from "@/types";
import { saveGrantDraft } from "@/app/(public)/ideas/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GrantIdeaInput } from "@/lib/ideas/grant-template";
import { sectionsToMarkdown } from "@/lib/ideas/grant-template";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "long",
    timeZone: "Europe/Warsaw",
  }).format(new Date(value));
}

export function GrantDraftPanel({
  call,
  idea,
  signedIn,
}: {
  call: GrantCall;
  idea: GrantIdeaInput & { id?: string };
  signedIn: boolean;
}) {
  const baseId = useId();
  const [sections, setSections] = useState<GrantDraftSection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function prepare() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ideas/grant-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: call.id,
          idea: {
            title: idea.title,
            summary: idea.summary,
            targetGroup: idea.targetGroup,
            municipality: idea.municipality,
            canvas: idea.canvas,
          },
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        sections?: GrantDraftSection[];
      };
      if (!response.ok || !payload.sections) {
        setError(
          payload.error ??
            "Nie udało się przygotować szkicu. Spróbuj ponownie.",
        );
        return;
      }
      setSections(payload.sections);
    } catch {
      setError("Nie udało się przygotować szkicu. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  function markdown() {
    return sectionsToMarkdown(call.title, sections ?? []);
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown());
      toast("Skopiowano szkic wniosku.");
    } catch {
      setError("Nie udało się skopiować. Zaznacz tekst ręcznie.");
    }
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown()], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "szkic-wniosku.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function save() {
    if (!sections || !idea.id || !UUID.test(idea.id)) return;
    setSaving(true);
    setError("");
    const result = await saveGrantDraft({
      ideaId: idea.id,
      callId: call.id,
      sections,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Zapisano szkic wniosku.");
  }

  return (
    <section
      aria-labelledby={`${baseId}-title`}
      className="flex flex-col gap-4 border border-border p-4"
    >
      <h2 id={`${baseId}-title`} className="font-serif text-2xl text-heading">
        Generator wniosków
      </h2>
      <p className="max-w-2xl">{call.title}</p>
      <p className="text-sm">
        Nabór od {formatDate(call.startsAt)} do {formatDate(call.endsAt)}.{" "}
        {call.description}
      </p>
      <Button type="button" onClick={() => void prepare()} disabled={loading}>
        {loading ? "Przygotowuję szkic…" : "Przygotuj szkic wniosku"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm">
          {error}
        </p>
      ) : null}
      {sections ? (
        <div className="flex flex-col gap-4">
          <p>Tekst przygotowany automatycznie. Sprawdź go przed użyciem.</p>
          {sections.map((section, index) => {
            const limit =
              call.requiredSections.find((item) => item.key === section.key)
                ?.maxChars ?? section.body.length;
            const fieldId = `${baseId}-${section.key}`;
            const counterId = `${fieldId}-count`;
            return (
              <div key={section.key} className="flex flex-col gap-2">
                <Label htmlFor={fieldId}>{section.heading}</Label>
                <Textarea
                  id={fieldId}
                  value={section.body}
                  maxLength={limit}
                  aria-describedby={counterId}
                  onChange={(event) => {
                    const body = event.target.value;
                    setSections(
                      (current) =>
                        current?.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, body } : item,
                        ) ?? null,
                    );
                  }}
                />
                <p id={counterId} className="text-sm text-muted-foreground">
                  {section.body.length} / {limit} znaków
                </p>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyMarkdown()}
            >
              Kopiuj jako Markdown
            </Button>
            <Button type="button" variant="outline" onClick={downloadMarkdown}>
              Pobierz plik .md
            </Button>
            {signedIn && idea.id && UUID.test(idea.id) ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void save()}
              >
                Zapisz szkic wniosku
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
