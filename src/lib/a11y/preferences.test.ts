import { describe, expect, it } from "vitest";
import { FONT_SIZES, parseFontSize } from "@/lib/a11y/preferences";

describe("parseFontSize", () => {
  it.each(FONT_SIZES)("accepts the stored value %s", (size) => {
    expect(parseFontSize(size)).toBe(size);
  });

  it.each([null, undefined, "", "huge", "LARGE", 2, {}])(
    "falls back to default for %j",
    (value) => {
      expect(parseFontSize(value)).toBe("default");
    },
  );
});
