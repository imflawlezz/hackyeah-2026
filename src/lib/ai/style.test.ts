import { expect, it } from "vitest";
import { MATCH_REASONS_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { POLISH_COPY_STYLE, withCopyStyle } from "@/lib/ai/style";

it("appends shared copy rules to the match system prompt", () => {
  expect(withCopyStyle("System prompt")).toBe(
    `System prompt\n\n${POLISH_COPY_STYLE}`,
  );
  expect(MATCH_REASONS_SYSTEM_PROMPT.endsWith(POLISH_COPY_STYLE)).toBe(true);
});

it("includes banned wording and factual accuracy rules", () => {
  for (const phrase of [
    "rewolucyjny",
    "innowacyjna platforma oparta na AI",
    "przełomowy",
    "kompleksowe rozwiązanie",
    "z łatwością",
  ]) {
    expect(POLISH_COPY_STYLE).toContain(phrase);
  }
  expect(POLISH_COPY_STYLE).toContain("Nie wymyślaj faktów, liczb ani nazw");
});
