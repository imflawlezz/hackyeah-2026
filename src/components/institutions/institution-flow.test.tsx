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
import {
  InstitutionFlow,
  PLAN_LOADING_TEXT,
  PLAN_READY_TEXT,
} from "@/components/institutions/institution-flow";
import { ruralProfile } from "@/lib/institutions/fixtures";
import { PLAN_SECTIONS } from "@/lib/institutions/plan-markdown";
import { buildTemplatePlan } from "@/lib/institutions/template-plan";
import { innovations, mockMatch } from "@/lib/mocks";

const telecare = innovations.find(({ id }) => id === "inn-telecare")!;
const candidates = mockMatch({ problem: "samotni seniorzy telefon", limit: 3 });

type Responder = (body: unknown) => Response | Promise<Response>;

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

/** Routes fetch by URL and records the parsed request bodies. */
function stubApi(routes: { candidates?: Responder; plan?: Responder }) {
  const calls: { url: string; body: unknown; signal: AbortSignal }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const body: unknown = JSON.parse(String(init.body));
      calls.push({ url, body, signal: init.signal as AbortSignal });
      const responder = url.endsWith("/candidates")
        ? routes.candidates
        : routes.plan;
      if (!responder) throw new Error(`Unexpected request to ${url}`);
      return responder(body);
    }),
  );
  return calls;
}

const candidatesOk: Responder = () => json({ candidates, source: "mock" });
const planOk: Responder = (body) => {
  const { profile, innovationId } = body as {
    profile: typeof ruralProfile;
    innovationId: string;
  };
  const innovation = innovations.find(({ id }) => id === innovationId)!;
  return json({ plan: buildTemplatePlan(profile, innovation), innovation });
};

/** Fills the whole form with the keyboard only. */
async function fillProfile(user: ReturnType<typeof userEvent.setup>) {
  await user.tab();
  expect(
    screen.getByLabelText("Typ instytucji", { exact: false }),
  ).toHaveFocus();
  await user.keyboard("G"); // selects "Gmina" by typing
  await user.selectOptions(
    screen.getByLabelText("Typ instytucji", { exact: false }),
    "gmina",
  );
  await user.tab();
  await user.selectOptions(screen.getByLabelText("Rodzaj gminy"), "wiejska");
  await user.tab();
  // One tab stop per radio group; arrows move inside it.
  expect(screen.getByRole("radio", { name: "Do 5 tys." })).toHaveFocus();
  await user.keyboard(" {ArrowDown}");
  expect(screen.getByRole("radio", { name: "5–20 tys." })).toBeChecked();
  await user.tab();
  expect(screen.getByRole("radio", { name: "Do 20 tys. zł" })).toHaveFocus();
  await user.keyboard(" {ArrowDown}");
  expect(screen.getByRole("radio", { name: "20–100 tys. zł" })).toBeChecked();
  await user.tab();
  await user.keyboard("2");
  await user.tab();
  await user.keyboard(ruralProfile.targetGroup);
  await user.tab();
  await user.keyboard(ruralProfile.need);
  await user.tab();
  await user.keyboard(ruralProfile.constraints!);
  await user.tab();
  expect(screen.getByRole("radio", { name: "Za 3 miesiące" })).toHaveFocus();
  await user.keyboard(" {ArrowDown}");
  expect(screen.getByRole("radio", { name: "Za 6 miesięcy" })).toBeChecked();
  await user.tab();
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("InstitutionFlow", () => {
  it("announces every missing answer and sends nothing", async () => {
    const user = userEvent.setup();
    const calls = stubApi({});
    render(<InstitutionFlow preselected={null} />);

    await user.click(
      screen.getByRole("button", { name: "Dobierz rozwiązania" }),
    );

    const missing = [
      "Wybierz typ instytucji.",
      "Wybierz liczbę mieszkańców.",
      "Wybierz roczny budżet.",
      "Podaj liczbę osób od 0 do 20.",
      "Napisz, kogo ma objąć wsparcie.",
      "Opisz potrzebę. Napisz co najmniej 10 znaków.",
      "Wybierz termin.",
    ];
    const [summary, ...fieldAlerts] = await screen.findAllByRole("alert");
    // Gov.pl error summary first: focused, one link per missing answer.
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      within(summary)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(missing);
    expect(fieldAlerts.map((alert) => alert.textContent)).toEqual(missing);
    expect(
      screen.getByLabelText("Typ instytucji", { exact: false }),
    ).toHaveAccessibleDescription("Wybierz typ instytucji.");
    expect(
      screen.getByRole("group", { name: "Liczba mieszkańców" }),
    ).toHaveAccessibleDescription(
      "Gminy albo obszaru, na którym działasz. Wybierz liczbę mieszkańców.",
    );
    const need = screen.getByLabelText("Jakiej zmiany potrzebujecie?", {
      exact: false,
    });
    expect(need).toHaveAttribute("aria-invalid", "true");
    expect(need).toHaveAccessibleDescription(
      expect.stringContaining("Opisz potrzebę. Napisz co najmniej 10 znaków."),
    );
    expect(calls).toHaveLength(0);
  });

  it("goes through all three steps with the keyboard only", async () => {
    const user = userEvent.setup();
    const calls = stubApi({ candidates: candidatesOk, plan: planOk });
    render(<InstitutionFlow preselected={null} />);

    expect(screen.getByText("Krok 1 z 3")).toBeVisible();
    await fillProfile(user);
    expect(
      screen.getByRole("button", { name: "Dobierz rozwiązania" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");

    // Step 2: focus lands on the heading, candidates are a radio list.
    const heading = await screen.findByRole("heading", {
      name: "Wybierz rozwiązanie",
    });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText("Krok 2 z 3")).toBeVisible();
    expect(calls[0]).toMatchObject({
      url: "/api/institutions/candidates",
      body: ruralProfile,
    });
    const radios = screen.getAllByRole("radio", { hidden: false });
    expect(radios).toHaveLength(3);
    expect(radios[0]).toBeChecked();
    expect(radios[0]).toHaveAccessibleName(
      expect.stringContaining(candidates[0]!.innovation.title),
    );
    expect(
      screen.getByText("Wyniki demonstracyjne (tryb bez AI)."),
    ).toBeVisible();

    await user.tab();
    expect(radios[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(radios[1]).toBeChecked();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Przygotuj plan" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");

    // Step 3: the plan document.
    const chosen = candidates[1]!.innovation;
    const planHeading = await screen.findByRole("heading", {
      level: 2,
      name: `Plan wdrożenia: ${chosen.title}`,
    });
    await waitFor(() => expect(planHeading).toHaveFocus());
    expect(calls[1]).toMatchObject({
      url: "/api/institutions/plan",
      body: {
        innovationId: chosen.id,
        profile: { ...ruralProfile, innovationId: chosen.id },
      },
    });
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(PLAN_READY_TEXT);
    expect(
      screen.getByText(
        "Tekst przygotowany automatycznie. Sprawdź go przed użyciem.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Plan przygotowany według szablonu, bez AI."),
    ).toBeVisible();

    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual(PLAN_SECTIONS.map(({ title }) => title));
    const toc = screen.getByRole("navigation", { name: "Spis treści planu" });
    expect(
      within(toc)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(PLAN_SECTIONS.map(({ id }) => `#${id}`));
    for (const { id } of PLAN_SECTIONS) {
      expect(document.getElementById(id)).not.toBeNull();
    }

    const costs = screen.getByRole("table", { name: /Przybliżone przedziały/ });
    expect(within(costs).getAllByRole("row")).toHaveLength(8);
    expect(
      within(costs).getByRole("row", { name: /^Razem/ }),
    ).toHaveTextContent(/10\s000\szł – 50\s000\szł/);
    expect(
      screen.getByRole("table", { name: "Ryzyka i sposoby zapobiegania" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zapytaj ROPS o wdrożenie" }),
    ).toHaveAttribute(
      "href",
      `/messages/new?innovation=${chosen.id}&kind=ask_rops`,
    );
  }, 20_000);

  it("puts the loading text in the live region and can be interrupted", async () => {
    const user = userEvent.setup();
    let release: (response: Response) => void = () => {};
    const calls = stubApi({
      plan: () => new Promise<Response>((resolve) => (release = resolve)),
    });
    window.sessionStorage.setItem(
      "hubmi-institution-profile",
      JSON.stringify({
        institutionType: "gmina",
        municipalityType: "wiejska",
        populationBand: "5-20k",
        budgetBand: "20-100k",
        staffAvailable: "2",
        targetGroup: ruralProfile.targetGroup,
        need: ruralProfile.need,
        constraints: ruralProfile.constraints,
        timeline: "6",
      }),
    );
    render(<InstitutionFlow preselected={telecare} />);

    // Restored from sessionStorage; the preselected innovation skips step 2.
    await waitFor(() =>
      expect(
        screen.getByLabelText("Kogo ma objąć wsparcie?", { exact: false }),
      ).toHaveValue(ruralProfile.targetGroup),
    );
    expect(screen.getByText("Krok 1 z 2")).toBeVisible();
    expect(
      screen.getByText(/Wybrana innowacja:/).parentElement?.textContent,
    ).toBe("Wybrana innowacja: Teleopieka sąsiedzka (Samotność)");
    expect(
      screen.getByRole("link", { name: "Zmień innowację" }),
    ).toHaveAttribute("href", "/institutions");

    await user.click(screen.getByRole("button", { name: "Przygotuj plan" }));

    const live = screen.getAllByRole("status")[0]!;
    await waitFor(() => expect(live).toHaveTextContent(PLAN_LOADING_TEXT));
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("/api/institutions/plan");

    await user.click(screen.getByRole("button", { name: "Przerwij" }));
    expect(calls[0]!.signal.aborted).toBe(true);
    expect(live).toHaveTextContent(/^Przerwano\./);
    expect(screen.queryByRole("button", { name: "Przerwij" })).toBeNull();

    // A late answer to the aborted request must not open the plan.
    release(
      json({
        plan: buildTemplatePlan(ruralProfile, telecare),
        innovation: telecare,
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();

    // Starting again works and announces completion.
    stubApi({ plan: planOk });
    await user.click(screen.getByRole("button", { name: "Przygotuj plan" }));
    await screen.findByRole("heading", {
      level: 2,
      name: "Plan wdrożenia: Teleopieka sąsiedzka",
    });
    expect(live).toHaveTextContent(PLAN_READY_TEXT);
  });

  it("shows the server's message with a retry that works", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      "hubmi-institution-profile",
      JSON.stringify({
        institutionType: "ops_cus",
        municipalityType: "",
        populationBand: "<5k",
        budgetBand: "<20k",
        staffAvailable: "0",
        targetGroup: "opiekunowie",
        need: "Opiekunowie nie mają kiedy odpocząć.",
        constraints: "",
        timeline: "3",
      }),
    );
    stubApi({
      plan: () =>
        json(
          {
            error:
              "Zbyt wiele planów w krótkim czasie. Spróbuj ponownie za minutę.",
          },
          { status: 429 },
        ),
    });
    render(<InstitutionFlow preselected={telecare} />);
    await waitFor(() =>
      expect(
        screen.getByLabelText("Kogo ma objąć wsparcie?", { exact: false }),
      ).toHaveValue("opiekunowie"),
    );

    await user.click(screen.getByRole("button", { name: "Przygotuj plan" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Zbyt wiele planów w krótkim czasie. Spróbuj ponownie za minutę.",
    );

    const calls = stubApi({ plan: planOk });
    await user.click(
      within(alert).getByRole("button", { name: "Spróbuj ponownie" }),
    );
    await screen.findByRole("heading", { level: 2, name: /^Plan wdrożenia/ });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(calls[0]!.body).toMatchObject({
      innovationId: "inn-telecare",
      profile: { institutionType: "ops_cus", staffAvailable: 0, timeline: 3 },
    });
  });

  it("copies and downloads the plan as Markdown", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const createObjectURL = vi.fn(() => "blob:plan");
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const print = vi.fn();
    vi.stubGlobal("print", print);
    window.sessionStorage.setItem(
      "hubmi-institution-profile",
      JSON.stringify({
        institutionType: "gmina",
        municipalityType: "wiejska",
        populationBand: "5-20k",
        budgetBand: "20-100k",
        staffAvailable: "2",
        targetGroup: ruralProfile.targetGroup,
        need: ruralProfile.need,
        constraints: "",
        timeline: "6",
      }),
    );
    stubApi({ plan: planOk });
    render(<InstitutionFlow preselected={telecare} />);
    await waitFor(() =>
      expect(
        screen.getByLabelText("Kogo ma objąć wsparcie?", { exact: false }),
      ).toHaveValue(ruralProfile.targetGroup),
    );
    await user.click(screen.getByRole("button", { name: "Przygotuj plan" }));
    await screen.findByRole("heading", { level: 2, name: /^Plan wdrożenia/ });

    await user.click(
      screen.getByRole("button", { name: "Kopiuj jako Markdown" }),
    );
    await screen.findByText("Plan skopiowany do schowka jako Markdown.");
    const copied = writeText.mock.calls[0]![0] as string;
    expect(copied.startsWith("# Plan wdrożenia: Teleopieka sąsiedzka\n")).toBe(
      true,
    );
    expect(copied).toContain("## Szacunkowe koszty");

    await user.click(screen.getByRole("button", { name: "Pobierz plik .md" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Plik z planem został pobrany.")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Drukuj lub zapisz jako PDF" }),
    );
    expect(print).toHaveBeenCalledTimes(1);

    // Going back keeps the answers.
    await user.click(
      screen.getAllByRole("button", { name: "Zmień opis instytucji" })[0]!,
    );
    expect(
      screen.getByLabelText("Kogo ma objąć wsparcie?", { exact: false }),
    ).toHaveValue(ruralProfile.targetGroup);
  });

  it("explains a preselected innovation that does not exist", () => {
    stubApi({});
    render(<InstitutionFlow preselected={null} preselectedMissing />);
    expect(
      screen.getByText(/Nie znaleźliśmy innowacji wskazanej w adresie/),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Dobierz rozwiązania" }),
    ).toBeVisible();
  });
});
