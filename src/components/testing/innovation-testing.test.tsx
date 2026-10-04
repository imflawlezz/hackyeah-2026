// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InnovationTesting } from "@/components/testing/innovation-testing";
import { OpenTestsList } from "@/components/testing/open-tests-list";
import { FEEDBACK_MESSAGES, SIGNUP_MESSAGES } from "@/lib/testing/schemas";
import { EMPTY_SUMMARY } from "@/lib/testing/summary";
import type { OpenTest } from "@/lib/data/testing";
import type { FeedbackSummary } from "@/types";

const actions = vi.hoisted(() => ({
  signUpForTest: vi.fn(),
  submitFeedback: vi.fn(),
}));
vi.mock("@/app/(public)/test/actions", () => actions);

const telecare: OpenTest = {
  id: "test-telecare-nowy-targ",
  innovationId: "inn-telecare",
  title: "Codzienny telefon do seniora",
  description: "Przez sześć tygodni wolontariusz dzwoni o ustalonej porze.",
  municipality: "Nowy Targ",
  startsAt: "2026-11-02",
  endsAt: "2026-12-13",
  slots: 20,
  status: "open",
  createdAt: "2026-09-24T08:00:00.000Z",
  innovationTitle: "Teleopieka sąsiedzka",
  innovationCategory: "Samotność",
  slotsLeft: 1,
};
const assistant: OpenTest = {
  ...telecare,
  id: "test-digital-assistant-wieliczka",
  innovationId: "inn-digital-assistant",
  title: "Dyżury asystenta cyfrowego w bibliotece",
  municipality: "Wieliczka",
  startsAt: "2026-10-15",
  endsAt: "2026-11-30",
  slots: 12,
  innovationTitle: "Gminny asystent cyfrowy",
  slotsLeft: 3,
};

const demoScores = [
  { rating: 5, easeOfUse: 4, wouldRecommend: true },
  { rating: 4, easeOfUse: 4, wouldRecommend: true },
  { rating: 3, easeOfUse: 4, wouldRecommend: false },
] as const;

function renderTesting(
  props: Partial<Parameters<typeof InnovationTesting>[0]> = {},
) {
  return render(
    <InnovationTesting
      innovationId="inn-telecare"
      tests={[telecare]}
      summary={EMPTY_SUMMARY}
      demoScores={[...demoScores]}
      mode="demo"
      loginHref="/login?next=%2Ftest%2Finn-telecare"
      {...props}
    />,
  );
}

const results = () => within(screen.getByRole("region", { name: "Wyniki" }));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("rating radio group", () => {
  it("is a named group operable with arrow keys", async () => {
    const user = userEvent.setup();
    renderTesting();

    const group = screen.getByRole("group", {
      name: "Jak oceniasz to rozwiązanie?",
    });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((radio) => radio.closest("label")?.textContent)).toEqual([
      "1 – bardzo słabo",
      "2 – słabo",
      "3 – średnio",
      "4 – dobrze",
      "5 – bardzo dobrze",
    ]);

    await user.click(within(group).getByRole("radio", { name: "3 – średnio" }));
    await user.keyboard("{ArrowDown}");
    expect(
      within(group).getByRole("radio", { name: "4 – dobrze" }),
    ).toBeChecked();
    expect(
      within(group).getByRole("radio", { name: "4 – dobrze" }),
    ).toHaveFocus();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(
      within(group).getByRole("radio", { name: "2 – słabo" }),
    ).toBeChecked();
    expect(within(group).getAllByRole("radio", { checked: true })).toHaveLength(
      1,
    );
  });

  it("announces the error when the rating is missing and stores nothing", async () => {
    const user = userEvent.setup();
    renderTesting();

    await user.click(screen.getByRole("button", { name: "Wyślij opinię" }));

    const [summary, error] = await screen.findAllByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      within(summary).getByRole("link", { name: "Wybierz ocenę od 1 do 5." }),
    ).toHaveAttribute("href", "#rating-1");
    expect(error).toHaveTextContent("Wybierz ocenę od 1 do 5.");
    const group = screen.getByRole("group", {
      name: "Jak oceniasz to rozwiązanie?",
    });
    expect(group).toHaveAccessibleDescription("Wybierz ocenę od 1 do 5.");
    expect(
      within(group).getByRole("radio", { name: "1 – bardzo słabo" }),
    ).toHaveAccessibleDescription("Wybierz ocenę od 1 do 5.");
    expect(window.localStorage.getItem("hubmi-test-feedback")).toBeNull();
    expect(
      results().getByText(/Średnia ocena/).parentElement?.textContent,
    ).toContain("4,0 z 5 (3 opinie)");
  });
});

describe("demo mode", () => {
  it("shows the summary with a table alternative for the distribution", () => {
    renderTesting();

    expect(
      results().getByText(/Średnia ocena/).parentElement?.textContent,
    ).toBe("Średnia ocena: 4,0 z 5 (3 opinie)");
    const table = results().getByRole("table", { name: "Rozkład ocen" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(
      rows.map((row) => [
        within(row).getByRole("rowheader").textContent,
        within(row).getAllByRole("cell")[0]!.textContent,
      ]),
    ).toEqual([
      ["5 – bardzo dobrze", "1"],
      ["4 – dobrze", "1"],
      ["3 – średnio", "1"],
      ["2 – słabo", "0"],
      ["1 – bardzo słabo", "0"],
    ]);
    expect(results().getByText("Poleca").nextSibling?.textContent).toBe("67%");
    expect(results().getByText("Na ile proste").nextSibling?.textContent).toBe(
      "4,0 z 5",
    );
  });

  it("stores an opinion locally and refreshes the summary", async () => {
    const user = userEvent.setup();
    renderTesting();

    await user.click(screen.getByRole("radio", { name: "5 – bardzo dobrze" }));
    await user.click(screen.getByRole("radio", { name: "5 – bardzo proste" }));
    await user.click(screen.getByRole("radio", { name: "Tak" }));
    await user.type(
      screen.getByLabelText("Co zadziałało?"),
      "Stała pora rozmowy.",
    );
    await user.click(screen.getByRole("button", { name: "Wyślij opinię" }));

    const status = await screen.findByText(FEEDBACK_MESSAGES.success);
    expect(status.closest('[role="status"]')).toHaveFocus();
    expect(
      results().getByText(/Średnia ocena/).parentElement?.textContent,
    ).toBe("Średnia ocena: 4,3 z 5 (4 opinie)");
    expect(results().getByText("Poleca").nextSibling?.textContent).toBe("75%");
    // Only the scores are kept; free text is not stored in the browser.
    expect(window.localStorage.getItem("hubmi-test-feedback")).toBe(
      JSON.stringify([
        {
          innovationId: "inn-telecare",
          rating: 5,
          easeOfUse: 5,
          wouldRecommend: true,
        },
      ]),
    );
    expect(
      screen.getByRole("radio", { name: "5 – bardzo dobrze" }),
    ).not.toBeChecked();
    expect(actions.submitFeedback).not.toHaveBeenCalled();
  });

  it("validates the sign-up, saves it locally and takes the last slot", async () => {
    const user = userEvent.setup();
    renderTesting();

    expect(screen.getByText("Zostało 1 miejsce (z 20)")).toBeVisible();
    const submit = screen.getByRole("button", {
      name: "Zgłoś się: Codzienny telefon do seniora",
    });
    await user.click(submit);

    const group = screen.getByRole("group", { name: "Kiedy możesz?" });
    expect(group).toHaveAccessibleDescription(
      "Wybierz, kiedy możesz wziąć udział.",
    );
    const consent = screen.getByRole("checkbox", {
      name: "Zgadzam się na kontakt w sprawie testu.",
    });
    expect(consent).toHaveAttribute("aria-invalid", "true");
    expect(window.localStorage.getItem("hubmi-test-signups")).toBeNull();

    await user.click(within(group).getByRole("radio", { name: "Po południu" }));
    await user.click(consent);
    await user.click(submit);

    const message = await screen.findByText(SIGNUP_MESSAGES.success);
    expect(message.closest('[role="status"]')).toHaveFocus();
    expect(screen.getByText("Brak wolnych miejsc (z 20)")).toBeVisible();
    expect(window.localStorage.getItem("hubmi-test-signups")).toBe(
      JSON.stringify(["test-telecare-nowy-targ"]),
    );
    expect(actions.signUpForTest).not.toHaveBeenCalled();
  });

  it("tells a returning visitor they are already signed up", () => {
    window.localStorage.setItem(
      "hubmi-test-signups",
      JSON.stringify(["test-telecare-nowy-targ"]),
    );
    renderTesting();

    expect(screen.getByText(SIGNUP_MESSAGES.signedUp)).toBeVisible();
    expect(screen.queryByRole("button", { name: /^Zgłoś się/ })).toBeNull();
  });

  it("shows the signed-up state from the server after a reload", () => {
    renderTesting({
      mode: "signed-in",
      demoScores: [],
      signedUpTestIds: ["test-telecare-nowy-targ"],
    });

    expect(screen.getByText(SIGNUP_MESSAGES.signedUp)).toBeVisible();
    expect(screen.queryByRole("button", { name: /^Zgłoś się/ })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Napisz do zespołu ROPS" }),
    ).toHaveAttribute(
      "href",
      `/messages/new?kind=ask_rops&subject=${encodeURIComponent("Rezygnacja z testu: Codzienny telefon do seniora")}`,
    );
  });

  it("refuses a full test with the agreed message", () => {
    renderTesting({ tests: [{ ...telecare, slotsLeft: 0 }] });

    expect(screen.getByText("Brak wolnych miejsc w tym teście.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /^Zgłoś się/ })).toBeNull();
  });
});

describe("with Supabase", () => {
  const serverSummary: FeedbackSummary = {
    count: 12,
    avgRating: 4.2,
    distribution: { 1: 0, 2: 1, 3: 1, 4: 5, 5: 5 },
    avgEase: 3.9,
    recommendShare: 0.75,
  };

  it("shows sign-in links instead of forms to a signed-out visitor", () => {
    renderTesting({
      mode: "signed-out",
      summary: serverSummary,
      demoScores: [],
    });

    expect(
      screen.getByRole("link", { name: "Zaloguj się, żeby się zgłosić." }),
    ).toHaveAttribute("href", "/login?next=%2Ftest%2Finn-telecare");
    expect(
      screen.getByRole("link", { name: "Zaloguj się, żeby dodać opinię." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(
      results().getByText(/Średnia ocena/).parentElement?.textContent,
    ).toBe("Średnia ocena: 4,2 z 5 (12 opinii)");
    expect(results().getByText("Na ile proste").nextSibling?.textContent).toBe(
      "3,9 z 5",
    );
  });

  it("shows the server's rejection of a second sign-up", async () => {
    const user = userEvent.setup();
    actions.signUpForTest.mockResolvedValue({
      ok: false,
      message: SIGNUP_MESSAGES.duplicate,
    });
    renderTesting({
      mode: "signed-in",
      summary: serverSummary,
      demoScores: [],
    });

    await user.click(screen.getByRole("radio", { name: "Rano" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Zgadzam się na kontakt w sprawie testu.",
      }),
    );
    await user.click(screen.getByRole("button", { name: /^Zgłoś się/ }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(SIGNUP_MESSAGES.duplicate);
    expect(alert).toHaveFocus();
    expect(actions.signUpForTest).toHaveBeenCalledWith(
      "test-telecare-nowy-targ",
      {
        motivation: "",
        availability: "morning",
        accessibilityNeeds: "",
        consent: true,
      },
    );
    expect(window.localStorage.getItem("hubmi-test-signups")).toBeNull();
  });

  it("sends feedback to the server and shows the returned summary", async () => {
    const user = userEvent.setup();
    actions.submitFeedback.mockResolvedValue({
      ok: true,
      message: FEEDBACK_MESSAGES.success,
      summary: { ...serverSummary, count: 13, avgRating: 4.3 },
    });
    renderTesting({
      mode: "signed-in",
      summary: serverSummary,
      demoScores: [],
    });

    await user.click(screen.getByRole("radio", { name: "5 – bardzo dobrze" }));
    await user.click(screen.getByRole("button", { name: "Wyślij opinię" }));

    await screen.findByText(FEEDBACK_MESSAGES.success);
    expect(actions.submitFeedback).toHaveBeenCalledWith(
      "inn-telecare",
      expect.objectContaining({
        rating: "5",
        testId: "test-telecare-nowy-targ",
      }),
    );
    expect(
      results().getByText(/Średnia ocena/).parentElement?.textContent,
    ).toBe("Średnia ocena: 4,3 z 5 (13 opinii)");
    expect(window.localStorage.getItem("hubmi-test-feedback")).toBeNull();
  });
});

describe("OpenTestsList", () => {
  it("lists tests with dates and plurals, and filters by gmina", async () => {
    const user = userEvent.setup();
    render(<OpenTestsList tests={[assistant, telecare]} demo />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Otwarte testy: 2 testy",
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("15 października – 30 listopada 2026");
    expect(rows[0]).toHaveTextContent("Zostały 3 miejsca");
    expect(rows[1]).toHaveTextContent("Zostało 1 miejsce");
    expect(
      screen.getByRole("link", { name: "Zgłoś się: Teleopieka sąsiedzka" }),
    ).toHaveAttribute(
      "href",
      "/test/inn-telecare#test-test-telecare-nowy-targ",
    );

    await user.selectOptions(screen.getByLabelText("Gmina"), "Wieliczka");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Otwarte testy: 1 test",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Wieliczka");
  });

  it("marks tests the signed-in user already joined", () => {
    render(
      <OpenTestsList
        tests={[assistant, telecare]}
        demo={false}
        signedUpTestIds={[telecare.id]}
      />,
    );
    expect(
      screen.getByRole("link", {
        name: "Zapisano. Zobacz test: Teleopieka sąsiedzka",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zgłoś się: Gminny asystent cyfrowy" }),
    ).toBeInTheDocument();
  });

  it("shows the empty state", () => {
    render(<OpenTestsList tests={[]} demo={false} />);
    expect(screen.getByText("Teraz nie ma otwartych testów.")).toBeVisible();
  });
});
