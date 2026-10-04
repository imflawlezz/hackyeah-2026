import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthorIdeaReview, toIdea } from "@/lib/data/ideas";
import { reviewIdea } from "@/lib/admin/mutations";
import { toAdminIdea } from "@/lib/data/admin";

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.client,
  hasSupabase: true,
}));
const row = {
  id: "idea-1",
  author_id: "author-1",
  title: "Idea",
  essence: "Summary",
  target_group: "Residents",
  stage: "idea" as const,
  status: "reviewed" as const,
  created_at: "2026-10-04T07:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({ rpc: mocks.rpc, from: mocks.from });
});
describe("private idea responses", () => {
  it("writes through the atomic review RPC, without updating public columns", async () => {
    mocks.rpc.mockResolvedValue({ data: row.id, error: null });
    expect(
      await reviewIdea({ mode: "admin", user: null }, row.id, "Response"),
    ).toMatchObject({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("review_idea", {
      p_idea_id: row.id,
      p_note: "Response",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("reports failed writes and missing ideas", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
    expect(
      (await reviewIdea({ mode: "admin", user: null }, row.id, "Response")).ok,
    ).toBe(false);
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    expect(
      (await reviewIdea({ mode: "admin", user: null }, row.id, "Response")).ok,
    ).toBe(false);
  });
  it("does not fetch responses for anonymous visitors or other users", async () => {
    expect(await getAuthorIdeaReview(toIdea(row), null)).toBeNull();
    expect(await getAuthorIdeaReview(toIdea(row), { id: "other" })).toBeNull();
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("fetches the author's private response and maps the admin relationship", async () => {
    const response = {
      note: "Response\nSecond line",
      reviewed_at: row.created_at,
    };
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: response, error: null }),
    };
    mocks.from.mockReturnValue(query);
    expect(
      await getAuthorIdeaReview(toIdea(row), { id: row.author_id }),
    ).toEqual(response);
    expect(mocks.from).toHaveBeenCalledWith("idea_reviews");
    expect(query.eq).toHaveBeenCalledWith("idea_id", row.id);
    expect(toAdminIdea({ ...row, idea_reviews: response }).reviewNote).toBe(
      response.note,
    );
    query.maybeSingle.mockResolvedValue({
      data: response,
      error: { code: "42501" },
    });
    expect(
      await getAuthorIdeaReview(toIdea(row), { id: row.author_id }),
    ).toBeNull();
  });
});
