import { expect, it } from "vitest";
import { appendTranscript } from "./append";
it("preserves text and adds exactly one separating newline", () => {
  expect(appendTranscript("ręczna edycja", "dyktowane", 100)).toBe(
    "ręczna edycja\ndyktowane",
  );
  expect(appendTranscript("opis\n", "tekst", 100)).toBe("opis\ntekst");
  expect(appendTranscript("", "tekst", 100)).toBe("tekst");
});
it("does not truncate or insert empty content", () => {
  expect(appendTranscript("12345", "cały tekst", 5)).toBeNull();
  expect(appendTranscript("opis", "  ", 100)).toBe("opis");
});
