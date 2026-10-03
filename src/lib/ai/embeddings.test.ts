import { describe, expect, it } from "vitest";
import { innovations } from "@/lib/mocks/innovations";
import { innovationEmbeddingText } from "./embeddings";

describe("innovationEmbeddingText", () => {
  it("labels every field and adds the plain-language category theme", () => {
    const innovation = innovations.find(
      (item) => item.title === "Mobilny punkt dostępności",
    )!;
    const text = innovationEmbeddingText({
      ...innovation,
      summary: "Krótkie streszczenie.",
    });
    const lines = text.split("\n");
    expect(lines[0]).toBe("Tytuł: Mobilny punkt dostępności");
    expect(lines[1]).toMatch(/^Obszar: Dostępność \(.*osoby na wózkach.*\)$/);
    expect(text).toContain(`Dla kogo: ${innovation.targetGroup}`);
    expect(text).toContain(`Słowa kluczowe: ${innovation.tags.join(", ")}`);
    expect(text).toContain("Streszczenie: Krótkie streszczenie.");
    expect(text).toContain(`Opis: ${innovation.description}`);
  });

  it("skips empty fields", () => {
    const text = innovationEmbeddingText({
      ...innovations[0]!,
      category: "Inna",
      tags: [],
      summary: undefined,
    });
    expect(text).toContain("Obszar: Inna");
    expect(text).not.toContain("Słowa kluczowe");
    expect(text).not.toContain("Streszczenie");
  });
});
