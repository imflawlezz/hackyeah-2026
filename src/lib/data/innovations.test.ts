import { afterEach, describe, expect, it, vi } from "vitest";
import { innovations as mockInnovations } from "@/lib/mocks/innovations";
import { innovationSchema } from "@/lib/validators";

const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: false,
  createClient: mocks.client,
}));
import { getInnovationById, getInnovations, toInnovation } from "./innovations";

afterEach(() => {
  vi.clearAllMocks();
});

it("maps database columns, nullable links and summary fallback", () => {
  const innovation = toInnovation({
    id: "test",
    title: "Klub",
    summary: "Spotkania",
    description: null,
    category: "Seniorzy",
    target_group: "Seniorzy na wsi",
    region: "powiat wielicki",
    tags: null,
    video_url: "https://example.org/video",
    image_url: null,
    created_at: "2026-10-03",
  });
  expect(innovationSchema.parse(innovation)).toEqual({
    id: "test",
    title: "Klub",
    summary: "Spotkania",
    description: "Spotkania",
    category: "Seniorzy",
    targetGroup: "Seniorzy na wsi",
    region: "powiat wielicki",
    tags: [],
    videoUrl: "https://example.org/video",
    imageUrl: undefined,
    createdAt: "2026-10-03",
  });
  const withoutOptional = toInnovation({
    id: "test",
    title: "Klub",
    description: "Opis",
    summary: null,
    category: "Seniorzy",
    target_group: "Seniorzy",
    region: null,
  });
  expect(withoutOptional.description).toBe("Opis");
  expect(withoutOptional.summary).toBeUndefined();
  expect(withoutOptional.region).toBeUndefined();
});

describe("without Supabase", () => {
  it("lists the mocks sorted by title", async () => {
    const list = await getInnovations();
    expect(list).toHaveLength(mockInnovations.length);
    expect(list.map(({ title }) => title)).toEqual(
      [...list.map(({ title }) => title)].sort((left, right) =>
        left.localeCompare(right, "pl"),
      ),
    );
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("finds a mock by its slug", async () => {
    const innovation = await getInnovationById("inn-after-school");
    expect(innovation?.title).toBe("Świetlica otwarta po lekcjach");
  });

  it("returns null for unknown and malformed ids without throwing", async () => {
    await expect(getInnovationById("inn-missing")).resolves.toBeNull();
    await expect(getInnovationById("not-a-uuid; --")).resolves.toBeNull();
    await expect(
      getInnovationById("00000000-0000-4000-8000-000000000001"),
    ).resolves.toBeNull();
    await expect(getInnovationById("")).resolves.toBeNull();
    expect(mocks.client).not.toHaveBeenCalled();
  });
});
