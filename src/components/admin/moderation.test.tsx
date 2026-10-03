// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Moderation } from "@/components/admin/moderation";
import { getDemoStore } from "@/lib/admin/demo-store";
import { getMockTrendProblems } from "@/lib/mocks/trends";

const actions = vi.hoisted(() => ({
  reviewIdeaAction: vi.fn(),
  closeProblemAction: vi.fn(),
  setInnovationStatusAction: vi.fn(),
}));
vi.mock("@/app/admin/actions", () => actions);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ideas = getDemoStore().ideas.filter(
  ({ status }) => status === "submitted",
);
const problems = getMockTrendProblems(new Date("2026-10-03T12:00:00Z"))
  .filter(({ status }) => status === "new")
  .slice(0, 2)
  .map((problem) => ({ ...problem, excerpt: problem.description }));

function renderModeration(
  initialTab: "ideas" | "problems" | "drafts" = "ideas",
) {
  return render(
    <Moderation
      ideas={ideas}
      problems={problems}
      drafts={[]}
      initialTab={initialTab}
    />,
  );
}

beforeEach(() => {
  for (const action of Object.values(actions)) action.mockReset();
});
afterEach(cleanup);

describe("Moderation", () => {
  it("confirms an idea review with a note and announces the result", async () => {
    const user = userEvent.setup();
    actions.reviewIdeaAction.mockResolvedValue({
      ok: true,
      message: "Oznaczono pomysł jako przejrzany.",
    });
    renderModeration();

    expect(screen.getByRole("tab", { name: /Pomysły/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(
      screen.getAllByRole("button", { name: "Oznacz jako przejrzane" })[0],
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName(
      `Oznaczyć „${ideas[0].title}” jako przejrzany?`,
    );
    expect(actions.reviewIdeaAction).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Wiadomość do autora (opcjonalnie)"),
      "  Dziękujemy  ",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Oznacz jako przejrzane" }),
    );

    await waitFor(() =>
      expect(actions.reviewIdeaAction).toHaveBeenCalledWith(
        ideas[0].id,
        "Dziękujemy",
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Oznaczono pomysł jako przejrzany.",
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Pomysły czekające na przegląd" }),
      ).toHaveFocus(),
    );
  });

  it("does nothing when the confirm dialog is cancelled", async () => {
    const user = userEvent.setup();
    renderModeration();
    await user.click(
      screen.getAllByRole("button", { name: "Oznacz jako przejrzane" })[0],
    );
    await user.click(await screen.findByRole("button", { name: "Anuluj" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(actions.reviewIdeaAction).not.toHaveBeenCalled();
  });

  it("closes a problem and announces a failure message from the server", async () => {
    const user = userEvent.setup();
    actions.closeProblemAction.mockResolvedValue({
      ok: false,
      message:
        "Tę zmianę może wprowadzić tylko administrator ROPS. Zaloguj się na konto administratora.",
    });
    renderModeration("problems");

    expect(
      screen.getAllByRole("link", { name: /Szukaj rozwiązań/ })[0],
    ).toHaveAttribute(
      "href",
      `/match?${new URLSearchParams({ q: problems[0].excerpt }).toString()}`,
    );
    await user.click(screen.getAllByRole("button", { name: "Zamknij" })[0]);
    await user.click(
      await screen.findByRole("button", { name: "Zamknij zgłoszenie" }),
    );

    await waitFor(() =>
      expect(actions.closeProblemAction).toHaveBeenCalledWith(
        problems[0].id,
        "",
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /tylko administrator ROPS/,
      ),
    );
  });

  it("shows empty states per tab", () => {
    render(
      <Moderation ideas={[]} problems={[]} drafts={[]} initialTab="drafts" />,
    );
    expect(screen.getByText("Nie ma szkiców do decyzji.")).toBeInTheDocument();
  });
});
