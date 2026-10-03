import { expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

it("allows `limit` calls per key per window and resets after it", () => {
  const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
  expect([allow("a", 0), allow("a", 10), allow("a", 20)]).toEqual([
    true,
    true,
    false,
  ]);
  expect(allow("b", 20)).toBe(true);
  expect(allow("a", 1000)).toBe(true);
});

it("keeps separate state per limiter", () => {
  const first = createRateLimiter({ limit: 1, windowMs: 1000 });
  const second = createRateLimiter({ limit: 1, windowMs: 1000 });
  expect(first("a", 0)).toBe(true);
  expect(second("a", 0)).toBe(true);
  expect(first("a", 1)).toBe(false);
});
