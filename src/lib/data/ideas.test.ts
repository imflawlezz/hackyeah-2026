import { describe, expect, it } from "vitest";
import { fromIdea, toIdea, type IdeaRow } from "@/lib/data/ideas";

const row: IdeaRow = {
  id: "idea-1",
  author_id: "user-1",
  title: "Wypożyczalnia",
  essence: "Świetlica pożycza balkoniki.",
  target_group: "Seniorzy",
  stage: "idea",
  status: "draft",
  canvas: { problem: "Brak sprzętu." },
  municipality: "Gdów",
  created_at: "2026-10-01T00:00:00.000Z",
};

describe("idea mapping", () => {
  it("maps essence to summary and back", () => {
    const idea = toIdea(row);
    expect(idea.summary).toBe("Świetlica pożycza balkoniki.");
    expect(idea.targetGroup).toBe("Seniorzy");
    expect(idea.canvas?.problem).toBe("Brak sprzętu.");
    expect(idea.municipality).toBe("Gdów");

    expect(
      fromIdea({
        title: idea.title,
        summary: idea.summary,
        targetGroup: idea.targetGroup,
        stage: idea.stage,
        status: idea.status,
        canvas: idea.canvas,
        municipality: idea.municipality,
      }),
    ).toMatchObject({
      essence: "Świetlica pożycza balkoniki.",
      target_group: "Seniorzy",
      municipality: "Gdów",
    });
  });
});
