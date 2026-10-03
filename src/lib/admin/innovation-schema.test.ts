import { describe, expect, it } from "vitest";
import {
  innovationFormSchema,
  parseTags,
  toInnovationInput,
} from "@/lib/admin/innovation-schema";

const valid = {
  title: "Kawiarenka naprawcza",
  summary: "Wolontariusze naprawiają sprzęt z mieszkańcami.",
  description:
    "Raz w miesiącu w świetlicy wolontariusze pomagają naprawić drobny sprzęt domowy.",
  category: "Aktywizacja",
  targetGroup: "Mieszkańcy małych miejscowości",
  region: "",
  tags: "",
  videoUrl: "",
  imageUrl: "",
  status: "draft" as const,
};

function issues(values: Partial<typeof valid>) {
  const result = innovationFormSchema.safeParse({ ...valid, ...values });
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
}

describe("innovation form schema", () => {
  it("accepts a complete form and maps empty optional fields to null", () => {
    const parsed = innovationFormSchema.parse({
      ...valid,
      title: "  Kawiarenka naprawcza  ",
    });
    expect(toInnovationInput(parsed)).toMatchObject({
      title: "Kawiarenka naprawcza",
      region: null,
      tags: [],
      videoUrl: null,
      imageUrl: null,
      status: "draft",
    });
  });

  it.each([
    "https://www.youtube.com/watch?v=abc",
    "https://youtu.be/abc",
    "https://vimeo.com/123",
    "https://player.vimeo.com/video/123",
  ])("accepts the video link %s", (videoUrl) => {
    expect(issues({ videoUrl })).toEqual({});
  });

  it.each([
    "http://www.youtube.com/watch?v=abc",
    "https://example.com/film.mp4",
    "https://youtube.com.evil.example/watch",
    "javascript:alert(1)",
    "youtube.com/watch?v=abc",
  ])("rejects the video link %s with a Polish message", (videoUrl) => {
    expect(issues({ videoUrl })).toEqual({
      videoUrl: "Podaj link https do filmu na YouTube albo Vimeo.",
    });
  });

  it("requires https for images", () => {
    expect(issues({ imageUrl: "http://example.com/a.jpg" })).toHaveProperty(
      "imageUrl",
    );
    expect(issues({ imageUrl: "https://example.com/a.jpg" })).toEqual({});
  });

  it("gives Polish messages for missing required fields", () => {
    expect(issues({ title: "", category: " " })).toEqual({
      title: "Podaj tytuł – minimum 3 znaki.",
      category: "Wybierz kategorię albo wpisz nową.",
    });
  });

  it("parses comma-separated tags into trimmed, lowercase, unique chips", () => {
    expect(parseTags(" Seniorzy, transport ,,seniorzy, Wieś ")).toEqual([
      "seniorzy",
      "transport",
      "wieś",
    ]);
    expect(parseTags("")).toEqual([]);
    expect(
      issues({
        tags: Array.from({ length: 13 }, (_, index) => `tag${index}`).join(","),
      }),
    ).toEqual({
      tags: "Dodaj maksymalnie 12 tagów.",
    });
  });
});
