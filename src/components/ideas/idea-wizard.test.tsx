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
import { IdeaWizard } from "@/components/ideas/idea-wizard";
import { grantCalls } from "@/lib/mocks";
import { LOCAL_DRAFT_KEY, LOCAL_IDEAS_KEY } from "@/lib/ideas/storage";

const saveIdea = vi.hoisted(() =>
  vi.fn(async (input: unknown) => {
    void input;
    return { ok: true as const, storage: "browser" as const };
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/(public)/ideas/actions", () => ({
  saveIdea,
  saveGrantDraft: vi.fn(),
}));

const answers = [
  "Seniorzy w gminie Gdów nie mają jak pożyczyć balkonika.",
  "Seniorzy i ich opiekunowie",
  "Świetlica prowadzi wypożyczalnię sprzętu na dwa tygodnie.",
  "Mieszkaniec zgłasza się do CUS, a wolontariusz przywozi sprzęt.",
  "Wypożyczenie jest bezpłatne i łączone z wizytą sąsiedzką.",
  "Potrzebny jest magazyn w centrum usług społecznych.",
  "Centrum usług społecznych i sołtysi.",
  "Sprzęt może nie wracać w terminie.",
  "Po roku co najmniej dwadzieścia wypożyczeń.",
];

beforeEach(() => {
  window.localStorage.clear();
  saveIdea.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("IdeaWizard", () => {
  it("announces a validation error and moves focus with the step", async () => {
    const user = userEvent.setup();
    render(<IdeaWizard call={null} signedIn={false} />);

    await user.click(screen.getByRole("button", { name: "Dalej" }));
    const [summary, alert] = await screen.findAllByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    expect(within(summary).getByRole("link")).toHaveAttribute(
      "href",
      "#idea-problem",
    );
    expect(alert).toHaveTextContent("Jaki problem chcesz rozwiązać?");
    expect(
      screen.getByRole("textbox", { name: "Jaki problem chcesz rozwiązać?" }),
    ).toHaveAttribute("aria-describedby", "idea-problem-error");

    await user.type(
      screen.getByRole("textbox", { name: "Jaki problem chcesz rozwiązać?" }),
      answers[0],
    );
    await user.click(screen.getByRole("button", { name: "Dalej" }));

    const heading = await screen.findByRole("heading", {
      name: "Kogo dotyczy?",
    });
    await waitFor(() => expect(heading).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Wstecz" }));
    expect(
      await screen.findByRole("heading", {
        name: "Jaki problem chcesz rozwiązać?",
      }),
    ).toHaveFocus();
  });

  it("starts a new idea at step 1, empty, ignoring an old autosave", () => {
    window.localStorage.setItem(
      LOCAL_DRAFT_KEY,
      JSON.stringify({ step: 8, values: { problem: "Stary szkic." } }),
    );
    render(<IdeaWizard call={null} signedIn={false} />);

    expect(screen.getByText("Krok 1 z 9")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Jaki problem chcesz rozwiązać?" }),
    ).toHaveValue("");
    expect(window.localStorage.getItem(LOCAL_DRAFT_KEY)).toBeNull();
  });

  it("submits an edited draft as an update of the same row", async () => {
    const user = userEvent.setup();
    saveIdea.mockResolvedValueOnce({
      ok: true,
      storage: "database",
      id: "11111111-1111-4111-8111-111111111111",
    } as never);
    const values = {
      problem: answers[0],
      targetGroup: answers[1],
      summary: answers[2],
      solution: answers[3],
      novelty: answers[4],
      resources: answers[5],
      partners: answers[6],
      risks: answers[7],
      successMeasures: answers[8],
      title: "Wypożyczalnia sprzętu",
      stage: "idea" as const,
      municipality: "Gdów",
    };
    render(
      <IdeaWizard
        call={null}
        signedIn
        initialDraft={{ id: "11111111-1111-4111-8111-111111111111", values }}
      />,
    );

    expect(screen.getByText("Krok 9 z 9")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Wyślij do Hubu" }));

    await waitFor(() => expect(saveIdea).toHaveBeenCalledTimes(1));
    expect(saveIdea.mock.calls[0]![0]).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      status: "submitted",
      title: "Wypożyczalnia sprzętu",
    });
  });

  it("walks all nine steps and keeps the idea in the browser", async () => {
    const user = userEvent.setup();
    render(<IdeaWizard call={grantCalls[0]} signedIn={false} />);

    const single = [
      "Jaki problem chcesz rozwiązać?",
      "Kogo dotyczy?",
      "Na czym polega Twój pomysł? (2–3 zdania)",
      "Jak to będzie działać w praktyce?",
      "Co jest w tym nowego?",
    ];
    for (const [index, name] of single.entries()) {
      await user.type(screen.getByRole("textbox", { name }), answers[index]);
      await user.click(screen.getByRole("button", { name: "Dalej" }));
    }

    await user.type(
      screen.getByLabelText("Czego potrzebujesz?", { exact: false }),
      answers[5],
    );
    await user.type(
      screen.getByLabelText("Z kim chcesz współpracować?", { exact: false }),
      answers[6],
    );
    await user.click(screen.getByRole("button", { name: "Dalej" }));
    await user.type(
      screen.getByRole("textbox", { name: "Co może pójść nie tak?" }),
      answers[7],
    );
    await user.click(screen.getByRole("button", { name: "Dalej" }));
    await user.type(
      screen.getByRole("textbox", { name: "Po czym poznasz, że działa?" }),
      answers[8],
    );
    await user.click(screen.getByRole("button", { name: "Dalej" }));

    await user.type(
      screen.getByLabelText("Tytuł pomysłu", { exact: false }),
      "Wypożyczalnia sprzętu",
    );
    expect(
      screen.getByRole("button", { name: "Przygotuj szkic wniosku" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));

    await waitFor(() => {
      const stored = window.localStorage.getItem(LOCAL_IDEAS_KEY);
      expect(stored).toContain("Wypożyczalnia sprzętu");
    });
    expect(screen.getByRole("status")).toHaveTextContent("tej przeglądarce");
    // Nine steps of typed input take about 5 s on a CI runner, right at the
    // default limit.
  }, 20_000);
});
