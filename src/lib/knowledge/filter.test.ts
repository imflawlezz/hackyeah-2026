import { describe, expect, it } from "vitest";
import { innovations } from "@/lib/mocks/innovations";
import { distinctSorted, filterInnovations, normalizeText } from "./filter";

const titles = (list: { title: string }[]) => list.map(({ title }) => title);

describe("normalizeText", () => {
  it("lowercases and strips Polish diacritics", () => {
    expect(normalizeText("Świetlica")).toBe("swietlica");
    expect(normalizeText("ZAŻÓŁĆ GĘŚLĄ JAŹŃ")).toBe("zazolc gesla jazn");
    expect(normalizeText("Młodzież")).toBe("mlodziez");
  });

  it("collapses whitespace", () => {
    expect(normalizeText("  osoby \n starsze  ")).toBe("osoby starsze");
  });
});

describe("filterInnovations", () => {
  it("returns everything for empty filters", () => {
    expect(filterInnovations(innovations, {})).toHaveLength(innovations.length);
    expect(
      filterInnovations(innovations, {
        q: "  ",
        category: [],
        targetGroup: "",
      }),
    ).toHaveLength(innovations.length);
  });

  it("matches the query without diacritics or case", () => {
    expect(titles(filterInnovations(innovations, { q: "swietlica" }))).toEqual([
      "Świetlica otwarta po lekcjach",
    ]);
    expect(titles(filterInnovations(innovations, { q: "ŚWIETLICA" }))).toEqual([
      "Świetlica otwarta po lekcjach",
    ]);
  });

  it("searches the title, the description and the tags", () => {
    expect(titles(filterInnovations(innovations, { q: "teleopieka" }))).toEqual(
      ["Teleopieka sąsiedzka"],
    );
    expect(
      titles(filterInnovations(innovations, { q: "petla indukcyjna" })),
    ).toEqual(["Mobilny punkt dostępności"]);
    const byTag = filterInnovations(innovations, { q: "seniorzy" });
    expect(byTag.length).toBeGreaterThan(1);
    expect(byTag.length).toBeLessThan(innovations.length);
    expect(byTag.every(({ tags }) => tags.includes("seniorzy"))).toBe(true);
  });

  it("requires every word of the query", () => {
    expect(
      titles(filterInnovations(innovations, { q: "seniorzy telefon" })),
    ).toEqual(["Teleopieka sąsiedzka"]);
  });

  it("filters by one category or by any of several", () => {
    expect(
      filterInnovations(innovations, { category: "Młodzież" }),
    ).toHaveLength(2);
    expect(
      filterInnovations(innovations, { category: ["Młodzież", "Samotność"] }),
    ).toHaveLength(3);
    expect(filterInnovations(innovations, { category: "Nie ma" })).toEqual([]);
  });

  it("filters by target group", () => {
    const list = filterInnovations(innovations, {
      targetGroup: "Osoby z niepełnosprawnością",
    });
    expect(titles(list).sort()).toEqual([
      "Mobilny punkt dostępności",
      "Praca chroniona zdalnie",
    ]);
  });

  it("combines the query, category and target group", () => {
    expect(
      titles(
        filterInnovations(innovations, { q: "seniorzy", category: "Opieka" }),
      ).sort(),
    ).toEqual(["Bank czasu opiekunów", "Sąsiedzka opieka wytchnieniowa"]);
    expect(
      titles(
        filterInnovations(innovations, {
          q: "seniorzy",
          category: "Opieka",
          targetGroup: "Opiekunowie osób zależnych",
        }),
      ),
    ).toEqual(["Bank czasu opiekunów"]);
    expect(
      filterInnovations(innovations, { q: "seniorzy", category: "Młodzież" }),
    ).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterInnovations(innovations, { q: "xyzqwerty" })).toEqual([]);
    expect(filterInnovations([], { q: "seniorzy" })).toEqual([]);
  });
});

it("distinctSorted removes duplicates and sorts in Polish order", () => {
  expect(distinctSorted(["Żywność", "Opieka", "Ład", "Opieka", ""])).toEqual([
    "Ład",
    "Opieka",
    "Żywność",
  ]);
});
