// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MatchExperience } from "@/components/match/match-experience";
import { mockMatch, problems } from "@/lib/mocks";

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

beforeEach(() => {
  replace.mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MatchExperience", () => {
  it("shows an inline Polish error and focuses the field for a short problem", async () => {
    const user = userEvent.setup();
    const fetchMock = respondWith([]);
    render(<MatchExperience />);

    const field = screen.getByLabelText("Opis problemu");
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
    expect(field).toHaveFocus();
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
    const field = screen.getByLabelText("Opis problemu");
    expect(field).toHaveValue(example.description);
    expect(field).toHaveFocus();
    expect(screen.getByText(/^\d+ \/ 2000/)).toHaveTextContent(
      `${example.description.length} / 2000`,
    );
  });

  it("shows a typical best AI similarity as a strong match", async () => {
    const user = userEvent.setup();
    const problem = "Samotni seniorzy na wsi nie mają z kim porozmawiać";
    const [first, second] = mockMatch({ problem, limit: 2 });
    respondWith(
      [
        { ...first!, score: 0.45 },
        { ...second!, score: 0.25 },
      ],
      { headers: { "X-Match-Source": "ai" } },
    );
    render(<MatchExperience />);

    await user.type(screen.getByLabelText("Opis problemu"), problem);
    await user.click(
      screen.getByRole("button", { name: "Znajdź rozwiązania" }),
    );

    await screen.findByRole("heading", { level: 2, name: /^Znaleźliśmy/ });
    expect(screen.getByText("Bardzo dobre dopasowanie")).toBeInTheDocument();
    expect(screen.getByText("(83%)")).toBeInTheDocument();
    expect(screen.getByText("Częściowe dopasowanie")).toBeInTheDocument();
    expect(screen.getByText("(17%)")).toBeInTheDocument();
  });

  it("renders results, focuses the heading and syncs the URL", async () => {
    const user = userEvent.setup();
    const problem = "Młodzież po lekcjach nie ma gdzie spędzać czasu";
    const results = mockMatch({ problem });
    const fetchMock = respondWith(results, {
      headers: { "X-Match-Source": "mock" },
    });
    render(<MatchExperience />);

    await user.type(screen.getByLabelText("Opis problemu"), problem);
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
    const fetchMock = respondWith(mockMatch({ problem }));
    render(<MatchExperience />);

    const field = screen.getByLabelText("Opis problemu");
    const submit = screen.getByRole("button", { name: "Znajdź rozwiązania" });
    await user.type(field, problem);
    await user.click(submit);
    await screen.findByRole("heading", { name: /^Znaleźliśmy/ });

    await user.clear(field);
    await user.type(field, "za mało");
    await user.click(submit);

    expect(field).toHaveFocus();
    expect(
      screen.getByText("Opis jest za krótki. Napisz co najmniej 10 znaków."),
    ).toBeVisible();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^Znaleźliśmy/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state", async () => {
    const user = userEvent.setup();
    respondWith([], { headers: { "X-Match-Source": "ai" } });
    render(<MatchExperience />);

    await user.type(
      screen.getByLabelText("Opis problemu"),
      "xyzqwerty xyzqwerty",
    );
    await user.click(
      screen.getByRole("button", { name: "Znajdź rozwiązania" }),
    );

    const heading = await screen.findByRole("heading", {
      name: "Nie znaleźliśmy rozwiązań dla tego opisu.",
    });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nie znaleźliśmy rozwiązań dla tego opisu. Opisz problem innymi słowami albo wybierz inną kategorię.",
    );
  });

  it("shows an alert with a retry button that resubmits", async () => {
    const user = userEvent.setup();
    const fetchMock = respondWith({ error: "Błąd serwera" }, { status: 500 });
    render(<MatchExperience />);

    await user.type(
      screen.getByLabelText("Opis problemu"),
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
      screen.getByLabelText("Opis problemu"),
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
    const fetchMock = respondWith(mockMatch({ problem: "samotni seniorzy" }));
    render(
      <MatchExperience
        initialValues={{ problem: "samotni seniorzy", category: "Samotność" }}
        autoRun
      />,
    );

    expect(screen.getByLabelText("Opis problemu")).toHaveValue(
      "samotni seniorzy",
    );
    expect(screen.getByLabelText("Kategoria (opcjonalnie)")).toHaveValue(
      "Samotność",
    );
    await screen.findByRole("heading", { name: /^Znaleźliśmy/ });
    expect(fetchMock.mock.calls[0]![1].body).toBe(
      JSON.stringify({ problem: "samotni seniorzy", category: "Samotność" }),
    );
  });
});
