import { describe, expect, it } from "vitest";
import { innovations } from "@/lib/mocks/innovations";
import {
  CATEGORY_BOOST,
  detectCategories,
  KEYWORD_BOOST_CAP,
  rerank,
  rerankSignal,
} from "./rerank";

const byTitle = (title: string) =>
  innovations.find((innovation) => innovation.title === title)!;

describe("detectCategories", () => {
  it("finds the theme of a problem from inflected Polish words", () => {
    expect([
      ...detectCategories("Osoby na wózkach nie dostaną się do urzędu."),
    ]).toEqual(["Dostępność"]);
    expect(
      detectCategories("Samotni seniorzy nie umieją obsługiwać smartfonów."),
    ).toEqual(new Set(["Samotność", "Wykluczenie cyfrowe"]));
  });
  it("ignores generic words and unrelated stems", () => {
    expect(detectCategories("Mieszkańcy gminy potrzebują pomocy.").size).toBe(
      0,
    );
    // "kultury" must not read as crutches ("kule").
    expect(detectCategories("Ośrodek kultury jest zamknięty.").size).toBe(0);
  });
});

describe("rerankSignal", () => {
  it("boosts a category match and shared keywords, with a cap", () => {
    const signal = rerankSignal(
      "Osoby na wózkach nie mogą dostać się do urzędu.",
      byTitle("Mobilny punkt dostępności"),
    );
    expect(signal.categoryMatch).toBe(true);
    // "urzędu" shares a stem with the tag "urząd" after folding ą/ę.
    expect(signal.sharedKeywords).toEqual(["urzędu"]);
    expect(signal.boost).toBeCloseTo(CATEGORY_BOOST + 0.015);
    const many = rerankSignal(
      "niepełnosprawność dostępność urząd sprzęt mobilny punkt",
      byTitle("Mobilny punkt dostępności"),
    );
    expect(many.boost).toBeCloseTo(CATEGORY_BOOST + KEYWORD_BOOST_CAP);
  });
});

describe("rerank", () => {
  it("orders by similarity plus boost and keeps the raw similarity", () => {
    const ranked = rerank(
      "Osoby na wózkach nie mogą dostać się do urzędu i ośrodka kultury.",
      [
        { innovation: byTitle("Teleopieka sąsiedzka"), similarity: 0.47 },
        { innovation: byTitle("Mobilny punkt dostępności"), similarity: 0.43 },
      ],
    );
    expect(ranked[0]!.innovation.title).toBe("Mobilny punkt dostępności");
    expect(ranked[0]!.similarity).toBe(0.43);
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });
});
