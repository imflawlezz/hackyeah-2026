// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
    const alert = await screen.findByRole("alert");
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

  it("autosaves the current step to localStorage", async () => {
    const user = userEvent.setup();
    render(<IdeaWizard call={null} signedIn={false} />);
    await user.type(
      screen.getByRole("textbox", { name: "Jaki problem chcesz rozwiązać?" }),
      "Brak balkoników.",
    );
    await waitFor(() => {
      const saved = window.localStorage.getItem(LOCAL_DRAFT_KEY);
      expect(saved).toContain("Brak balkoników.");
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

    await user.type(screen.getByLabelText("Czego potrzebujesz?"), answers[5]);
    await user.type(
      screen.getByLabelText("Z kim chcesz współpracować?"),
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
      screen.getByLabelText("Tytuł pomysłu"),
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
  });
});
