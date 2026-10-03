import { beforeEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({ embed: vi.fn() }));
vi.mock("./embeddings", () => ({
  embedTexts: mocks.embed,
  innovationEmbeddingText: (innovation: { title: string }) => innovation.title,
}));
import { backfillInnovations } from "./backfill";

function database(pages: unknown[][], writeError = false) {
  const updates: unknown[] = [];
  const query = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockImplementation(async () => ({
      data: pages.shift() ?? [],
      error: null,
    })),
    update: vi.fn().mockImplementation((value) => {
      updates.push(value);
      return {
        eq: () => ({
          abortSignal: async () => ({
            error: writeError ? { message: "Failed" } : null,
          }),
        }),
      };
    }),
  };
  return {
    client: { from: () => query } as unknown as SupabaseClient,
    query,
    updates,
  };
}
const rows = Array.from({ length: 50 }, (_, index) => ({
  id: `id-${String(index).padStart(2, "0")}`,
  title: "Klub",
  category: "Seniorzy",
  target_group: "Seniorzy",
  description: "Spotkania",
}));
beforeEach(() => {
  mocks.embed
    .mockReset()
    .mockImplementation(async (texts: string[]) =>
      texts.map(() => Array(1536).fill(0.1)),
    );
});

it("uses batches of 50 and an ID cursor so writes do not skip missing rows", async () => {
  const db = database([rows, [{ ...rows[0], id: "id-50" }], []]);
  const progress = vi.fn();
  expect(await backfillInnovations(db.client, {}, progress)).toBe(51);
  expect(mocks.embed.mock.calls.map(([texts]) => texts.length)).toEqual([
    50, 1,
  ]);
  expect(db.query.limit).toHaveBeenCalledWith(50);
  expect(db.query.is).toHaveBeenCalledWith("embedding", null);
  expect(db.query.gt).toHaveBeenCalledWith("id", "id-49");
  expect(db.updates).toHaveLength(51);
  expect(progress.mock.calls).toEqual([[50], [51]]);
});
it("recomputes selected or all rows, including existing embeddings", async () => {
  const selected = database([[rows[0]], []]);
  await backfillInnovations(selected.client, { ids: [rows[0].id] });
  expect(selected.query.in).toHaveBeenCalledWith("id", [rows[0].id]);
  expect(selected.query.is).not.toHaveBeenCalled();
  const all = database([[rows[0]], []]);
  await backfillInnovations(all.client, { all: true });
  expect(all.query.is).not.toHaveBeenCalled();
});
it("fails when writing embeddings fails and rejects invalid vectors before writing", async () => {
  await expect(
    backfillInnovations(database([[rows[0]]], true).client),
  ).rejects.toThrow("zapisać");
  const db = database([[rows[0]]]);
  mocks.embed.mockResolvedValue([[0.1]]);
  await expect(backfillInnovations(db.client)).rejects.toThrow("Niepoprawne");
  expect(db.updates).toEqual([]);
});
