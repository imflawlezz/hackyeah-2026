import { describe, expect, it } from "vitest";
import { templateGrantSections } from "./grant-template";
import { grantCalls } from "@/lib/mocks";
describe("templateGrantSections", () => {
  it("uses the basic idea card with an empty canvas", () => {
    const idea = {
      title: "Wypożyczalnia",
      summary: "Pożyczamy sprzęt rehabilitacyjny.",
      targetGroup: "Seniorzy",
      canvas: {},
    };
    const sections = templateGrantSections(idea, grantCalls[0]);
    expect(sections.find((s) => s.key === "problem")?.body).toBe(idea.summary);
    expect(sections.find((s) => s.key === "rozwiązanie")?.body).toContain(
      idea.title,
    );
    expect(sections.find((s) => s.key === "odbiorcy")?.body).toBe(
      idea.targetGroup,
    );
    expect(sections.every((s) => s.body.trim())).toBe(true);
  });
});
