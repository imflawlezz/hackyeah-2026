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
import { MatchExperience } from "@/components/match/match-experience";
import { CHALLENGE_DRAFT_KEY } from "@/lib/match/challenge-draft";
import { mockMatch, problems } from "@/lib/mocks";
import type { MatchResult } from "@/types";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/match",
  useSearchParams: () => new URLSearchParams(),
}));

function respondWith(body: unknown, init: ResponseInit = {}) {
  const fetchMock = vi.fn().mockImplementation(
    async () =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { "Content-Type": "application/json", ...init.headers },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The API body: every result in the given tier ("match" unless stated). */
function body(
  results: MatchResult[],
  tiers: ("match" | "related")[] = [],
  noGoodMatch = !results.some(
    (_, index) => (tiers[index] ?? "match") === "match",
  ),
) {
  return {
    results: results.map((result, index) => ({
      ...result,
      tier: tiers[index] ?? "match",
    })),
    noGoodMatch,
  };
}

async function search(problem: string) {
  const user = userEvent.setup();
  await user.type(
    screen.getByRole("textbox", { name: "Opis problemu" }),
    problem,
  );
  await user.click(screen.getByRole("button", { name: "Znajdź rozwiązania" }));
}

const NO_MATCH_TITLE =
  "Nie mamy jeszcze rozwiązania, które pasuje do Twojego opisu";

beforeEach(() => {
  replace.mockClear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MatchExperience", () => {
  it("shows an inline Polish error and focuses the error summary for a short problem", async () => {
    const user = userEvent.setup();
    const fetchMock = respondWith([]);
    render(<MatchExperience />);

    const field = screen.getByRole("textbox", { name: "Opis problemu" });
    await user.type(field, "za mało");
    await user.click(
      screen.getByRole("button", { name: "Znajdź rozwiązania" }),
    );

    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription(
      expect.stringContaining(
        "Opis jest za krótki. Napisz co najmniej 10 znaków.",
      ),
    );
    const summary = screen.getByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      within(summary).getByRole("link", {
        name: "Opis jest za krótki. Napisz co najmniej 10 znaków.",
      }),
    ).toHaveAttribute("href", "#problem");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fills the textarea from an example chip and moves focus to it", async () => {
    const user = userEvent.setup();
    render(<MatchExperience />);

    await user.click(
      screen.getByRole("button", { name: /Młodzież po lekcjach/ }),
    );

    const example = problems.find(
      (problem) => problem.id === "prob-after-school",
    )!;
    const field = screen.getByRole("textbox", { name: "Opis problemu" });
    expect(field).toHaveValue(example.description);
    expect(field).toHaveFocus();
    expect(screen.getByText(/^\d+ \/ 2000/)).toHaveTextContent(
      `${example.description.length} / 2000`,
    );
  });

  it("shows the best AI match as strong and the others relative to it", async () => {
    const problem = "Samotni seniorzy na wsi nie mają z kim porozmawiać";
    const [first, second] = mockMatch({ problem, limit: 2 });
    respondWith(
      body([
        { ...first!, score: 0.62 },
        { ...second!, score: 0.5 },
      ]),
      { headers: { "X-Match-Source": "ai" } },
    );
    render(<MatchExperience />);

    await search(problem);

    await screen.findByRole("heading", { level: 2, name: /^Znaleźliśmy/ });
    expect(screen.getByText("Bardzo dobre dopasowanie")).toBeInTheDocument();
    expect(screen.getByText("(100%)")).toBeInTheDocument();
    expect(screen.getByText("Dobre dopasowanie")).toBeInTheDocument();
    expect(screen.getByText("(71%)")).toBeInTheDocument();
    expect(screen.queryByText("Częściowe dopasowanie")).toBeNull();
    expect(screen.queryByRole("heading", { name: NO_MATCH_TITLE })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Mniej powiązane rozwiązania" }),
    ).toBeNull();
    expect(window.sessionStorage.getItem(CHALLENGE_DRAFT_KEY)).toBeNull();
  });

  it("renders results, focuses the heading and syncs the URL", async () => {
    const user = userEvent.setup();
    const problem = "Młodzież po lekcjach nie ma gdzie spędzać czasu";
    const results = mockMatch({ problem });
    const fetchMock = respondWith(body(results), {
      headers: { "X-Match-Source": "mock" },
    });
    render(<MatchExperience />);

    await user.type(
      screen.getByRole("textbox", { name: "Opis problemu" }),
      problem,
    );
    await user.click(
      screen.getByRole("button", { name: "Znajdź rozwiązania" }),
    );

    const heading = await screen.findByRole("heading", {
      level: 2,
      name: /^Znaleźliśmy \d+ pasując/,
    });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent(heading.textContent!);
    expect(
      screen.getByText(
        "Wyniki pochodzą z przykładowej bazy. Porównujemy słowa i kategorię z Twoim opisem.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(results.length);

    const first = results[0]!.innovation;
    const link = screen.getByRole("link", {
      name: `Zobacz szczegóły: ${first.title}`,
    });
    expect(link).toHaveAttribute("href", `/knowledge/${first.id}`);
    expect(
      screen.getAllByText("Bardzo dobre dopasowanie").length,
    ).toBeGreaterThan(0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      `/match?${new URLSearchParams({ q: problem }).toString()}`,
      { scroll: false },
    );
  });

  it("hides previous results when the problem becomes too short", async () => {
    const user = userEvent.setup();
    const problem = "Młodzież po lekcjach nie ma gdzie spędzać czasu";
    const fetchMock = respondWith(body(mockMatch({ problem })));
    render(<MatchExperience />);

    const field = screen.getByRole("textbox", { name: "Opis problemu" });
    const submit = screen.getByRole("button", { name: "Znajdź rozwiązania" });
    await user.type(field, problem);
    await user.click(submit);
    await screen.findByRole("heading", { name: /^Znaleźliśmy/ });

    await user.clear(field);
    await user.type(field, "za mało");
    await user.click(submit);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getAllByText(
        "Opis jest za krótki. Napisz co najmniej 10 znaków.",
      )[0],
    ).toBeVisible();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^Znaleźliśmy/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("invites a new challenge when nothing fits, without the problem in the URL", async () => {
    const problem = "Na drodze powiatowej jest dziura w jezdni";
    respondWith(body([]), { headers: { "X-Match-Source": "ai" } });
    render(<MatchExperience />);

    await search(problem);

    const heading = await screen.findByRole("heading", {
      level: 2,
      name: NO_MATCH_TITLE,
    });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent(
      `${NO_MATCH_TITLE}. Możesz zgłosić nowe wyzwanie.`,
    );
    expect(
      screen.getByText(
        "To ważna informacja dla ROPS. Zgłoś problem jako nowe wyzwanie. Zespół Hubu sprawdzi, czy można znaleźć lub wypracować rozwiązanie.",
      ),
    ).toBeInTheDocument();

    const action = screen.getByRole("link", { name: "Zgłoś nowe wyzwanie" });
    expect(action).toHaveAttribute(
      "href",
      "/messages/new?kind=ask_rops&subject=Nowe%20wyzwanie",
    );
    // The description goes through sessionStorage only.
    expect(window.sessionStorage.getItem(CHALLENGE_DRAFT_KEY)).toBe(problem);
    for (const link of screen.getAllByRole("link")) {
      expect(decodeURIComponent(link.getAttribute("href") ?? "")).not.toContain(
        "dziura",
      );
    }
    expect(
      screen.getByRole("link", { name: "Zaproponuj własny pomysł" }),
    ).toHaveAttribute("href", "/ideas/new");
    expect(
      screen.getByRole("link", { name: "Zobacz wyzwania regionu" }),
    ).toHaveAttribute("href", "/knowledge?tab=challenges");

    expect(screen.queryByRole("article")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Mniej powiązane rozwiązania" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: /^Znaleźliśmy/ })).toBeNull();
  });

  it("shows weak results only as less related, without a label or percentage", async () => {
    const problem = "Na dworcu kolejowym nie ma podjazdu dla wózków";
    const results = mockMatch({ problem: "samotni seniorzy", limit: 2 }).map(
      (result, index) => ({ ...result, score: 0.46 - index * 0.02 }),
    );
    respondWith(body(results, ["related", "related"]), {
      headers: { "X-Match-Source": "ai" },
    });
    render(<MatchExperience />);

    await search(problem);

    const heading = await screen.findByRole("heading", {
      level: 2,
      name: NO_MATCH_TITLE,
    });
    await waitFor(() => expect(heading).toHaveFocus());
    const related = screen.getByRole("region", {
      name: "Mniej powiązane rozwiązania",
    });
    // The invitation comes first, the weak results after it.
    expect(
      heading.compareDocumentPosition(related) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(related).getByText(
        "Mogą dotyczyć podobnego tematu, ale nie odpowiadają wprost na Twój problem.",
      ),
    ).toBeInTheDocument();
    expect(within(related).getAllByRole("article")).toHaveLength(2);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.queryByText(/dopasowanie/)).toBeNull();
    expect(screen.queryByText(/\d+%/)).toBeNull();
    expect(screen.queryByText("Dlaczego to pasuje")).toBeNull();
    expect(screen.queryByRole("heading", { name: /^Znaleźliśmy/ })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      `${NO_MATCH_TITLE}. Możesz zgłosić nowe wyzwanie. Niżej są mniej powiązane rozwiązania: 2.`,
    );
    expect(window.sessionStorage.getItem(CHALLENGE_DRAFT_KEY)).toBe(problem);
  });

  it("shows matches first and the less related results in their own section", async () => {
    const problem = "Samotni seniorzy na wsi nie mają z kim porozmawiać";
    const [first, second, third] = mockMatch({ problem, limit: 3 });
    respondWith(
      body(
        [
          { ...first!, score: 0.62 },
          { ...second!, score: 0.45 },
          { ...third!, score: 0.41 },
        ],
        ["match", "related", "related"],
      ),
      { headers: { "X-Match-Source": "ai" } },
    );
    render(<MatchExperience />);

    await search(problem);

    const heading = await screen.findByRole("heading", {
      level: 2,
      name: "Znaleźliśmy 1 pasującą innowację",
    });
    await waitFor(() => expect(heading).toHaveFocus());
    const related = screen.getByRole("region", {
      name: "Mniej powiązane rozwiązania",
    });
    expect(
      heading.compareDocumentPosition(related) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(related).getAllByRole("article")).toHaveLength(2);
    expect(
      within(related).queryByRole("article", { name: first!.innovation.title }),
    ).toBeNull();
    expect(
      screen.getByRole("article", { name: first!.innovation.title }),
    ).toHaveTextContent(/Bardzo dobre dopasowanie\s*\(100%\)/);
    expect(within(related).queryByText(/dopasowanie/)).toBeNull();
    expect(within(related).queryByText(/\d+%/)).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleźliśmy 1 pasującą innowację. Niżej są mniej powiązane rozwiązania: 2.",
    );
    expect(screen.queryByRole("heading", { name: NO_MATCH_TITLE })).toBeNull();
    expect(window.sessionStorage.getItem(CHALLENGE_DRAFT_KEY)).toBeNull();
  });

  it("keeps the chosen category with the description for the new challenge", async () => {
    respondWith(body([]), { headers: { "X-Match-Source": "ai" } });
    render(
      <MatchExperience
        initialValues={{ problem: "samotni seniorzy", category: "Bezdomność" }}
        autoRun
      />,
    );

    await screen.findByRole("heading", { name: NO_MATCH_TITLE });
    expect(window.sessionStorage.getItem(CHALLENGE_DRAFT_KEY)).toBe(
      "samotni seniorzy\n\nKategoria: Bezdomność",
    );
  });

  it("shows an alert with a retry button that resubmits", async () => {
    const user = userEvent.setup();
    const fetchMock = respondWith({ error: "Błąd serwera" }, { status: 500 });
    render(<MatchExperience />);

    await user.type(
      screen.getByRole("textbox", { name: "Opis problemu" }),
      "samotni seniorzy na wsi",
    );
    await user.click(
      screen.getByRole("button", { name: "Znajdź rozwiązania" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Nie udało się pobrać propozycji. Spróbuj ponownie za chwilę.",
    );

    await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]![1].body).toBe(
      JSON.stringify({ problem: "samotni seniorzy na wsi" }),
    );
  });

  it("shows the server message for a 429 response", async () => {
    const user = userEvent.setup();
    respondWith(
      { error: "Za dużo zapytań. Odczekaj chwilę." },
      { status: 429 },
    );
    render(<MatchExperience />);

    await user.type(
      screen.getByRole("textbox", { name: "Opis problemu" }),
      "samotni seniorzy na wsi",
    );
    await user.click(
      screen.getByRole("button", { name: "Znajdź rozwiązania" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Za dużo zapytań. Odczekaj chwilę.",
    );
  });

  it("prefills and runs the search automatically from the URL", async () => {
    const fetchMock = respondWith(
      body(mockMatch({ problem: "samotni seniorzy" })),
    );
    render(
      <MatchExperience
        initialValues={{ problem: "samotni seniorzy", category: "Samotność" }}
        autoRun
      />,
    );

    expect(screen.getByRole("textbox", { name: "Opis problemu" })).toHaveValue(
      "samotni seniorzy",
    );
    expect(screen.getByRole("combobox", { name: "Kategoria" })).toHaveValue(
      "Samotność",
    );
    await screen.findByRole("heading", { name: /^Znaleźliśmy/ });
    expect(fetchMock.mock.calls[0]![1].body).toBe(
      JSON.stringify({ problem: "samotni seniorzy", category: "Samotność" }),
    );
  });
});
