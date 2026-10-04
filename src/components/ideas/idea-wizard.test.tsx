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
import { IdeaWizard } from "./idea-wizard";
import {
  EMPTY_IDEA_DRAFT,
  fieldLabel,
  IMPLEMENTATION_FIELDS,
} from "@/lib/ideas/draft";
import { LOCAL_DRAFT_KEY, LOCAL_IDEAS_KEY } from "@/lib/ideas/storage";
import { grantCalls } from "@/lib/mocks";
const saveIdea = vi.hoisted(() =>
  vi.fn(async (input: unknown) => {
    void input;
    return { ok: true as const, storage: "browser" as const };
  }),
);
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/(public)/ideas/actions", () => ({
  saveIdea,
  saveGrantDraft: vi.fn(),
}));
const values = {
  ...EMPTY_IDEA_DRAFT,
  title: "Wypożyczalnia sprzętu",
  problem: "Seniorzy nie mają sprzętu do rehabilitacji.",
  targetGroup: "Seniorzy i opiekunowie",
  summary: "Świetlica pożycza balkoniki na dwa tygodnie.",
};
beforeEach(() => {
  window.localStorage.clear();
  saveIdea.mockClear();
});
afterEach(cleanup);
async function fillIdea(user: ReturnType<typeof userEvent.setup>) {
  for (const field of ["title", "problem", "targetGroup", "summary"] as const) {
    await user.click(
      screen.getByLabelText(fieldLabel(field), { exact: false }),
    );
    await user.paste(values[field]);
  }
  await user.click(screen.getByRole("button", { name: "Dalej" }));
}
describe("IdeaWizard", () => {
  it("focuses the error summary and headings on step changes", async () => {
    const user = userEvent.setup();
    render(<IdeaWizard call={null} signedIn={false} />);
    await user.click(screen.getByRole("button", { name: "Dalej" }));
    const summary = (await screen.findAllByRole("alert"))[0];
    await waitFor(() => expect(summary).toHaveFocus());
    expect(within(summary).getByRole("link")).toHaveAttribute(
      "href",
      "#idea-title",
    );
    await fillIdea(user);
    expect(screen.getByRole("heading", { name: "Wdrożenie" })).toHaveFocus();
    expect(screen.getByLabelText(fieldLabel("solution"))).not.toHaveAttribute(
      "aria-required",
    );
    await user.click(screen.getByRole("button", { name: "Wstecz" }));
    expect(screen.getByRole("heading", { name: "Pomysł" })).toHaveFocus();
  });
  it("opens an old step 8 draft at summary and preserves its answers", () => {
    window.localStorage.setItem(
      LOCAL_DRAFT_KEY,
      JSON.stringify({ step: 8, values }),
    );
    render(<IdeaWizard call={null} signedIn={false} />);
    expect(screen.getByText("Krok 3 z 3")).toBeInTheDocument();
    expect(screen.getByText(values.problem)).toBeInTheDocument();
  });
  it("starts an empty new idea at step 1", () => {
    render(<IdeaWizard call={null} signedIn={false} />);
    expect(screen.getByText("Krok 1 z 3")).toBeInTheDocument();
    expect(
      screen.getByLabelText(fieldLabel("title"), { exact: false }),
    ).toHaveValue("");
  });
  it("submits successfully with implementation skipped", async () => {
    const user = userEvent.setup();
    render(<IdeaWizard call={grantCalls[0]} signedIn={false} />);
    await fillIdea(user);
    await user.click(screen.getByRole("button", { name: "Pomiń ten krok" }));
    expect(
      screen.getByRole("heading", { name: "Podsumowanie", level: 2 }),
    ).toHaveFocus();
    expect(screen.getByText(/Uzupełnij krok „Wdrożenie”/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Wyślij do Hubu" }));
    await waitFor(() => expect(saveIdea).toHaveBeenCalledTimes(1));
    expect(saveIdea.mock.calls[0][0]).toMatchObject({
      status: "submitted",
      canvas: { problem: values.problem },
    });
    const saved = JSON.parse(window.localStorage.getItem(LOCAL_IDEAS_KEY)!)[0];
    expect(saved.canvas).toEqual({ problem: values.problem });
  });
  it("saves every filled implementation field", async () => {
    const user = userEvent.setup();
    render(<IdeaWizard call={null} signedIn={false} />);
    await fillIdea(user);
    for (const field of IMPLEMENTATION_FIELDS) {
      await user.click(screen.getByLabelText(fieldLabel(field)));
      await user.paste("Plan działań");
    }
    await user.click(screen.getByRole("button", { name: "Dalej" }));
    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));
    await waitFor(() => expect(saveIdea).toHaveBeenCalledTimes(1));
    expect(saveIdea.mock.calls[0][0]).toMatchObject({
      canvas: Object.fromEntries(
        IMPLEMENTATION_FIELDS.map((field) => [field, "Plan działań"]),
      ),
    });
  });
  it("updates an existing draft instead of inserting a new row", async () => {
    const user = userEvent.setup();
    render(
      <IdeaWizard
        call={null}
        signedIn
        initialDraft={{ id: "11111111-1111-4111-8111-111111111111", values }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Wyślij do Hubu" }));
    expect(saveIdea.mock.calls[0][0]).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      status: "submitted",
    });
  });
});
