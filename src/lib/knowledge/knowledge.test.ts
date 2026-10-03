import { describe, expect, it } from "vitest";
import { innovations } from "@/lib/mocks/innovations";
import { challenges } from "./challenges";
import { foundCountText, innovationCountText } from "./plural";
import {
  libraryHref,
  matchHref,
  parseLibraryFilters,
  parseTab,
  writeLibraryFilters,
} from "./url";
import { youtubeEmbedUrl, youtubeVideoId } from "./video";

describe("plural", () => {
  it("uses the Polish forms", () => {
    expect(foundCountText(1)).toBe("Znaleziono 1 innowację");
    expect(foundCountText(3)).toBe("Znaleziono 3 innowacje");
    expect(foundCountText(7)).toBe("Znaleziono 7 innowacji");
    expect(foundCountText(0)).toBe("Znaleziono 0 innowacji");
    expect(foundCountText(12)).toBe("Znaleziono 12 innowacji");
    expect(foundCountText(22)).toBe("Znaleziono 22 innowacje");
    expect(innovationCountText(1)).toBe("1 innowacja");
    expect(innovationCountText(4)).toBe("4 innowacje");
    expect(innovationCountText(5)).toBe("5 innowacji");
  });
});

describe("challenges", () => {
  it("lists the seven challenges from the brief with unique slugs", () => {
    expect(challenges).toHaveLength(7);
    expect(new Set(challenges.map(({ id }) => id)).size).toBe(7);
    for (const { id } of challenges) expect(id).toMatch(/^[a-z-]+$/);
  });

  it("only points at categories that exist in the library", () => {
    const known = new Set(innovations.map(({ category }) => category));
    for (const challenge of challenges) {
      expect(challenge.categories.length).toBeGreaterThan(0);
      for (const category of challenge.categories) {
        expect(known.has(category), `${challenge.id}: ${category}`).toBe(true);
      }
    }
  });
});

describe("url state", () => {
  it("defaults to the library tab for missing or unknown values", () => {
    expect(parseTab(null)).toBe("library");
    expect(parseTab("trends")).toBe("library");
    expect(parseTab("materials")).toBe("materials");
    expect(parseTab("challenges")).toBe("challenges");
  });

  it("round-trips the library filters and keeps other parameters", () => {
    const params = new URLSearchParams("tab=library&q=stare");
    writeLibraryFilters(params, {
      q: "świetlica",
      categories: ["Młodzież", "Opieka"],
      group: "Seniorzy",
    });
    expect(params.get("tab")).toBe("library");
    expect(parseLibraryFilters(params)).toEqual({
      q: "świetlica",
      categories: ["Młodzież", "Opieka"],
      group: "Seniorzy",
    });
    writeLibraryFilters(params, { q: "", categories: [], group: "" });
    expect(params.toString()).toBe("tab=library");
  });

  it("builds links into the library and the match form", () => {
    expect(libraryHref()).toBe("/knowledge?tab=library");
    const href = libraryHref(["Opieka", "Samotność"]);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.getAll("category")).toEqual(["Opieka", "Samotność"]);
    expect(matchHref("Zdrowie psychiczne")).toBe(
      "/match?category=Zdrowie+psychiczne",
    );
  });
});

describe("youtube", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?t=10",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  ])("reads the id from %s", (url) => {
    expect(youtubeVideoId(url)).toBe("dQw4w9WgXcQ");
  });

  it.each([
    "https://vimeo.com/123456",
    "https://example.org/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/embed/<script>x</script>",
    "not a url",
  ])("rejects %s", (url) => {
    expect(youtubeVideoId(url)).toBeNull();
  });

  it("embeds from the privacy-enhanced domain without autoplay", () => {
    const url = youtubeEmbedUrl("dQw4w9WgXcQ");
    expect(url).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(url).not.toContain("autoplay");
  });
});
