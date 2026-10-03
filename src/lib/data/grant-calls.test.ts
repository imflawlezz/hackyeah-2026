import { describe, expect, it, vi } from "vitest";
import { DEMO_GRANT_CALL_ID } from "@/lib/mocks";

vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: false,
  createClient: vi.fn(),
}));

describe("getActiveGrantCall", () => {
  it("is open only between the demo dates", async () => {
    const { getActiveGrantCall } = await import("@/lib/data/grant-calls");
    const before = await getActiveGrantCall(
      new Date("2026-09-30T23:59:59.000Z"),
    );
    const start = await getActiveGrantCall(
      new Date("2026-10-01T00:00:00.000Z"),
    );
    const during = await getActiveGrantCall(
      new Date("2026-11-15T12:00:00.000Z"),
    );
    const end = await getActiveGrantCall(new Date("2026-12-31T22:59:59.000Z"));
    const after = await getActiveGrantCall(
      new Date("2027-01-01T00:00:00.000Z"),
    );

    expect(before).toBeNull();
    expect(after).toBeNull();
    expect(start?.id).toBe(DEMO_GRANT_CALL_ID);
    expect(during?.title).toContain("Nabór demonstracyjny");
    expect(end?.requiredSections).toHaveLength(5);
  });
});
