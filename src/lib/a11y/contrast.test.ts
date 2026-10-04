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
  ["warning-foreground", "warning"],
  ["destructive", "background"],
  ["destructive", "muted"],
  ["destructive-foreground", "destructive"],
] as const;

// In the Gov.pl palette success (4.37:1) and warning (2.07:1) are never text
// on white, so these text pairs apply to the high-contrast theme only. The
// default theme checks success as a non-text colour in DEFAULT_UI_PAIRS.
const HIGH_CONTRAST_TEXT_PAIRS = [
  ["success", "background"],
  ["success", "muted"],
  ["success-foreground", "success"],
  ["warning", "background"],
  ["warning", "muted"],
] as const;

const DEFAULT_UI_PAIRS = [
  ["success", "background"],
  ["success", "muted"],
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
    expect(contrastRatio("#0052a5", "#0052A5")).toBe(1);
  });

  it("matches the documented ratio for primary on white", () => {
    expect(contrastRatio("#0052a5", "#ffffff")).toBeCloseTo(7.64, 1);
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

describe("high-contrast only text pairs", () => {
  const theme = tokens('[data-theme="high-contrast"]');
  it.each(HIGH_CONTRAST_TEXT_PAIRS)("%s on %s is at least 7:1", (text, bg) => {
    expect(contrastRatio(theme[text], theme[bg])).toBeGreaterThanOrEqual(7);
  });
});

describe("default theme follows Design System Gov.pl", () => {
  const theme = tokens(":root");

  it("uses the Gov.pl palette values", () => {
    expect(theme).toMatchObject({
      foreground: "#1b1b1b",
      primary: "#0052a5",
      "primary-hover": "#006cd7",
      navy: "#00468d",
      "muted-foreground": "#656565",
      muted: "#f1f1f1",
      border: "#dadada",
      destructive: "#a7162d",
      success: "#598527",
      warning: "#eba828",
    });
  });

  it.each(DEFAULT_UI_PAIRS)("%s against %s is at least 3:1", (ui, bg) => {
    expect(contrastRatio(theme[ui], theme[bg])).toBeGreaterThanOrEqual(3);
  });

  it("never needs warning as text: it is below 3:1 on white", () => {
    expect(contrastRatio(theme.warning, theme.background)).toBeLessThan(3);
    expect(
      contrastRatio(theme["warning-foreground"], theme.warning),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
