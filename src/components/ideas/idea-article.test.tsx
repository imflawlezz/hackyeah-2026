// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { IdeaArticle } from "./idea-article";
import { ideas } from "@/lib/mocks";
afterEach(cleanup);
it("hides the whole empty canvas", () => {
  render(<IdeaArticle idea={{ ...ideas[0], canvas: {} }} />);
  expect(
    screen.queryByRole("heading", { name: "Kanwa innowacji" }),
  ).not.toBeInTheDocument();
});
it("shows only filled canvas sections", () => {
  render(
    <IdeaArticle
      idea={{
        ...ideas[0],
        canvas: { solution: "Plan sąsiedzki", risks: "  " },
      }}
    />,
  );
  expect(screen.getByText("Plan sąsiedzki")).toBeInTheDocument();
  expect(screen.queryByText("Ryzyka")).not.toBeInTheDocument();
  expect(screen.queryByText("Nie podano.")).not.toBeInTheDocument();
});
