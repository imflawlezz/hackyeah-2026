import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/a11y/contrast";

const css = readFileSync(
  path.resolve(__dirname, "../../app/globals.css"),
  "utf8",
);

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No ${selector} block in globals.css`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}

// [text token, background token]
const TEXT_PAIRS = [
  ["foreground", "background"],
  ["foreground", "muted"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["primary", "background"],
  ["primary", "muted"],
  ["primary-foreground", "primary"],
  ["primary-foreground", "primary-hover"],
  ["heading", "background"],
  ["heading", "muted"],
  ["navy-foreground", "navy"],
  ["accent-foreground", "accent"],
  ["highlight", "background"],
  ["highlight", "muted"],
  ["highlight-foreground", "highlight"],
  ["success", "background"],
  ["success", "muted"],
  ["success-foreground", "success"],
  ["warning", "background"],
  ["warning", "muted"],
  ["warning-foreground", "warning"],
  ["destructive", "background"],
  ["destructive", "muted"],
  ["destructive-foreground", "destructive"],
] as const;

// Non-text boundaries and focus indicators (WCAG 1.4.11).
const UI_PAIRS = [
  ["input", "background"],
  ["input", "muted"],
  ["ring", "background"],
  ["ring", "muted"],
  ["navy-foreground", "navy"],
] as const;

describe("contrastRatio", () => {
  it("returns 21 for black on white and 1 for identical colours", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#2462ad", "#2462AD")).toBe(1);
  });

  it("matches the documented ratio for primary on white", () => {
    expect(contrastRatio("#2462ad", "#ffffff")).toBeCloseTo(6.13, 1);
  });

  it("rejects values that are not 6-digit hex", () => {
    expect(() => contrastRatio("#fff", "#000000")).toThrow();
  });
});

describe.each([
  [":root", 4.5],
  ['[data-theme="high-contrast"]', 7],
] as const)("palette in %s", (selector, minimum) => {
  const theme = tokens(selector);

  it.each(TEXT_PAIRS)(`%s on %s is at least ${minimum}:1`, (text, bg) => {
    expect(contrastRatio(theme[text], theme[bg])).toBeGreaterThanOrEqual(
      minimum,
    );
  });

  it.each(UI_PAIRS)("%s against %s is at least 3:1", (ui, bg) => {
    expect(contrastRatio(theme[ui], theme[bg])).toBeGreaterThanOrEqual(3);
  });
});
