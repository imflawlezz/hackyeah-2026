// @vitest-environment jsdom

import {
  act,
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

// A tiny stand-in for the App Router: replace() and setSearch() (a soft
// navigation or Back/Forward) both change the query string that
// useSearchParams() returns, and re-render the subscribers.
const nav = vi.hoisted(() => {
  let search = "";
  const listeners = new Set<() => void>();
  const setSearch = (next: string) => {
    search = next;
    for (const listener of listeners) listener();
  };
  return {
    getSearch: () => search,
    setSearch,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    replace: vi.fn((href: string) => {
      setSearch(new URL(href, "http://localhost").search);
    }),
  };
});
vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useRouter: () => ({ replace: nav.replace }),
    useSearchParams: () =>
      new URLSearchParams(
        useSyncExternalStore(nav.subscribe, nav.getSearch, nav.getSearch),
      ),
  };
});

const ideas = getDemoStore().ideas.filter(
  ({ status }) => status === "submitted",
);
const problems = getMockTrendProblems(new Date("2026-10-03T12:00:00Z"))
  .filter(({ status }) => status === "new")
  .slice(0, 2)
  .map((problem) => ({ ...problem, excerpt: problem.description }));

function renderModeration(tab?: "ideas" | "problems" | "drafts") {
  nav.setSearch(tab ? `?tab=${tab}` : "");
  return render(<Moderation ideas={ideas} problems={problems} drafts={[]} />);
}

beforeEach(() => {
  for (const action of Object.values(actions)) action.mockReset();
  nav.replace.mockClear();
});
afterEach(cleanup);

describe("Moderation", () => {
  it("shows each tab with its label and count, and marks the selected one", async () => {
    const user = userEvent.setup();
    renderModeration("problems");

    const tabs = screen.getAllByRole("tab");
    expect(
      tabs.map((tab) => [
        tab.firstChild?.textContent,
        within(tab).getByText(/^\d+$/).textContent,
        tab.getAttribute("aria-selected"),
      ]),
    ).toEqual([
      ["Pomysły", String(ideas.length), "false"],
      ["Problemy", String(problems.length), "true"],
      ["Szkice innowacji", "0", "false"],
    ]);
    expect(
      screen.getByRole("tab", { name: `Problemy ${problems.length}` }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: "Nowe zgłoszenia problemów" }),
    ).toBeVisible();

    // Arrow keys move between tabs; Enter selects the focused one.
    tabs[1]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[2]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(
      screen.getByRole("heading", { name: "Szkice innowacji" }),
    ).toBeVisible();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(tabs[0]).toHaveFocus();
  });

  it("writes the chosen tab to the URL with router.replace", async () => {
    const user = userEvent.setup();
    renderModeration();

    await user.click(screen.getByRole("tab", { name: /Problemy/ }));
    expect(nav.replace).toHaveBeenLastCalledWith(
      "/admin/moderation?tab=problems",
      { scroll: false },
    );
    expect(screen.getByRole("tab", { name: /Problemy/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(screen.getByRole("tab", { name: /Szkice innowacji/ }));
    expect(nav.replace).toHaveBeenLastCalledWith(
      "/admin/moderation?tab=drafts",
      { scroll: false },
    );
  });

  it("follows the URL when it changes without a remount", () => {
    renderModeration("drafts");
    expect(
      screen.getByRole("tab", { name: /Szkice innowacji/ }),
    ).toHaveAttribute("aria-selected", "true");

    // The sidebar link to the bare /admin/moderation.
    act(() => nav.setSearch(""));
    expect(screen.getByRole("tab", { name: /Pomysły/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Pomysły czekające na przegląd" }),
    ).toBeVisible();

    // Back to ?tab=problems, then an unknown value falls back to ideas.
    act(() => nav.setSearch("?tab=problems"));
    expect(screen.getByRole("tab", { name: /Problemy/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    act(() => nav.setSearch("?tab=nope"));
    expect(screen.getByRole("tab", { name: /Pomysły/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

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
      screen.getByLabelText("Wiadomość do autora"),
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
    nav.setSearch("?tab=drafts");
    render(<Moderation ideas={[]} problems={[]} drafts={[]} />);
    expect(screen.getByText("Nie ma szkiców do decyzji.")).toBeInTheDocument();
  });
});
