import { describe, expect, it } from "vitest";
import {
  buildSummaryInput,
  usesOnlyKnownNumbers,
} from "@/lib/admin/ai-summary";
import { tokenize, topKeywords } from "@/lib/admin/keywords";
import { scrubPII, toExcerpt } from "@/lib/admin/scrub";
import { buildTrendReport, type TrendProblem } from "@/lib/admin/trends";

describe("keyword tokenizer", () => {
  it("lowercases Polish text, keeps diacritics and drops stop words and short tokens", () => {
    expect(
      tokenize("Samotni SENIORZY we wsi nie mają transportu, a gmina też nie!"),
    ).toEqual(["samotni", "seniorzy", "wsi", "transportu"]);
    expect(tokenize("Młodzież – świetlica 24h, żółć")).toEqual([
      "młodzież",
      "świetlica",
      "żółć",
    ]);
  });

  it("counts each word once per text and ranks by frequency, then alphabetically", () => {
    const keywords = topKeywords(
      ["seniorzy seniorzy transport", "seniorzy samotność", "transport dowóz"],
      3,
    );
    expect(keywords).toEqual([
      { word: "seniorzy", count: 2 },
      { word: "transport", count: 2 },
      { word: "dowóz", count: 1 },
    ]);
    expect(topKeywords(["seniorzy", "transport"], 15, 2)).toEqual([]);
  });
});

describe("PII scrubber", () => {
  it("removes e-mail addresses and Polish phone numbers", () => {
    expect(
      scrubPII(
        "Pisz na anna.kowalska@hubmi.example albo dzwoń 600 123 456 lub +48 12-345-67-89.",
      ),
    ).toBe("Pisz na [e-mail] albo dzwoń [telefon] lub [telefon].");
    expect(scrubPII("Tel. (12) 345 67 89, kom. 0048 600123456")).toBe(
      "Tel. [telefon], kom. [telefon]",
    );
  });

  it("keeps short numbers such as years, ages and counts", () => {
    const text =
      "W 2025 roku 12 seniorów po 75. roku życia, autobus 3 razy dziennie.";
    expect(scrubPII(text)).toBe(text);
  });

  it("builds whitespace-collapsed excerpts of at most 300 characters", () => {
    const excerpt = toExcerpt(
      `kontakt: jan@hubmi.example\n\n${"a ".repeat(400)}`,
    );
    expect(excerpt.startsWith("kontakt: [e-mail] a a")).toBe(true);
    expect(excerpt).toHaveLength(300);
    expect(excerpt.endsWith("…")).toBe(true);
  });
});

describe("AI summary input and output guard", () => {
  const problems: TrendProblem[] = Array.from({ length: 35 }, (_, index) => ({
    category: "Samotność",
    createdAt: "2026-10-01T10:00:00Z",
    status: "new",
    bestScore: null,
    description: `Zgłoszenie ${index} od seniora, tel. 600 100 200, ${"opis ".repeat(100)}`,
  }));
  const report = buildTrendReport(
    problems,
    "all",
    new Date("2026-10-03T12:00:00Z"),
  );

  it("sends at most 30 scrubbed excerpts of at most 300 characters", () => {
    const input = buildSummaryInput(report, problems);
    expect(input.excerpts).toHaveLength(30);
    expect(input.excerpts.every(({ text }) => text.length <= 300)).toBe(true);
    expect(JSON.stringify(input)).not.toContain("600 100 200");
    expect(input.aggregates.total).toBe(35);
  });

  it("rejects output with numbers that are not in the input", () => {
    const input = buildSummaryInput(report, problems);
    expect(
      usesOnlyKnownNumbers(
        "Wpłynęło 35 zgłoszeń z kategorii Samotność.",
        input,
      ),
    ).toBe(true);
    expect(usesOnlyKnownNumbers("Liczba zgłoszeń wzrosła o 40%.", input)).toBe(
      false,
    );
    expect(usesOnlyKnownNumbers("Bez liczb.", input)).toBe(true);
  });
});
