import { expect, it } from "vitest";
import { allowMatchRequest } from "./rate-limit";

it("isolates IPs and resets expired windows", () => {
  for (let index = 0; index < 20; index++)
    expect(allowMatchRequest("192.0.2.10", 0)).toBe(true);
  expect(allowMatchRequest("192.0.2.10", 59_999)).toBe(false);
  expect(allowMatchRequest("192.0.2.11", 59_999)).toBe(true);
  expect(allowMatchRequest("192.0.2.10", 60_000)).toBe(true);
});
