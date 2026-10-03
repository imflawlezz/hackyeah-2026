import { describe, expect, it } from "vitest";
import { foundInnovationsText } from "@/lib/match/plural";

describe("foundInnovationsText", () => {
  it.each([
    [1, "Znaleźliśmy 1 pasującą innowację"],
    [2, "Znaleźliśmy 2 pasujące innowacje"],
    [3, "Znaleźliśmy 3 pasujące innowacje"],
    [4, "Znaleźliśmy 4 pasujące innowacje"],
    [5, "Znaleźliśmy 5 pasujących innowacji"],
    [11, "Znaleźliśmy 11 pasujących innowacji"],
    [12, "Znaleźliśmy 12 pasujących innowacji"],
    [22, "Znaleźliśmy 22 pasujące innowacje"],
    [25, "Znaleźliśmy 25 pasujących innowacji"],
    [0, "Znaleźliśmy 0 pasujących innowacji"],
  ])("uses the correct Polish form for %i", (count, text) => {
    expect(foundInnovationsText(count)).toBe(text);
  });
});
