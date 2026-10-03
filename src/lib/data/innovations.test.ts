import { expect, it } from "vitest";
import { toInnovation } from "./innovations";
import { innovationSchema } from "@/lib/validators";

it("maps database columns, nullable links and summary fallback", () => {
  const innovation = toInnovation({
    id: "test",
    title: "Klub",
    summary: "Spotkania",
    description: null,
    category: "Seniorzy",
    target_group: "Seniorzy na wsi",
    tags: null,
    video_url: "https://example.org/video",
    image_url: null,
    created_at: "2026-10-03",
  });
  expect(innovationSchema.parse(innovation)).toEqual({
    id: "test",
    title: "Klub",
    description: "Spotkania",
    category: "Seniorzy",
    targetGroup: "Seniorzy na wsi",
    tags: [],
    videoUrl: "https://example.org/video",
    imageUrl: undefined,
    createdAt: "2026-10-03",
  });
  expect(
    toInnovation({
      id: "test",
      title: "Klub",
      description: "Opis",
      summary: "Skrót",
      category: "Seniorzy",
      target_group: "Seniorzy",
    }).description,
  ).toBe("Opis");
});
