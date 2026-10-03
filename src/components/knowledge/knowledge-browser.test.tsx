// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KnowledgeBrowser } from "@/components/knowledge/knowledge-browser";
import { materialLinkText } from "@/components/knowledge/material-list";
import { innovations, materials } from "@/lib/mocks";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

function renderBrowser(search = "") {
  window.history.replaceState(
    null,
    "",
    search ? `/knowledge?${search}` : "/knowledge",
  );
  return render(
    <KnowledgeBrowser
      innovations={innovations}
      materials={materials}
      search={search}
    />,
  );
}

afterEach(cleanup);

describe("KnowledgeBrowser", () => {
  it("opens the library by default with three tabs", () => {
    renderBrowser();

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Wyzwania Małopolski",
      "Biblioteka innowacji",
      "Materiały",
    ]);
    expect(
      screen.getByRole("tab", { name: "Biblioteka innowacji" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Szukaj w bibliotece")).toBeInTheDocument();
  });

  it("deep-links to the materials tab", () => {
    renderBrowser("tab=materials");

    expect(screen.getByRole("tab", { name: "Materiały" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getAllByRole("listitem")).toHaveLength(
      materials.length,
    );
    const mapLink = within(panel).getByRole("link", {
      name: "Pobierz: Mapa Wyzwań Społecznych (PDF, 7,8 MB, po polsku), otwiera się w nowej karcie",
    });
    expect(mapLink).toHaveAttribute("target", "_blank");
    expect(
      within(panel).getByRole("link", {
        name: "Wypełnij w kreatorze: Kanwa Innowacji Społecznych (Szablon, po polsku)",
      }),
    ).toHaveAttribute("href", "/ideas/new");
    expect(materialLinkText(materials[2]!)).toBe(
      "Przeczytaj: Biblioteka Innowacji Społecznych: rozwiązania dla seniorów (Artykuł, po polsku)",
    );
    for (const material of materials) {
      expect(material.url).toMatch(/^(https:\/\/rops\.krakow\.pl\/|\/)/);
    }
    expect(screen.queryByText(/jeszcze nie działają/)).not.toBeInTheDocument();
  });

  it("opens the library pre-filtered from the URL", () => {
    renderBrowser(
      "tab=library&category=Opieka&category=Samotno%C5%9B%C4%87&q=seniorzy",
    );

    expect(screen.getByRole("checkbox", { name: "Opieka" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Samotność" })).toBeChecked();
    expect(screen.getByLabelText("Szukaj w bibliotece")).toHaveValue(
      "seniorzy",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleziono 3 innowacje",
    );
  });

  it("lists the seven challenges with links into the library and the match form", () => {
    renderBrowser("tab=challenges");

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(7);
    const href = screen
      .getByRole("link", {
        name: "Zobacz innowacje: Starzenie się społeczeństwa",
      })
      .getAttribute("href")!;
    expect(href.startsWith("/knowledge?tab=library")).toBe(true);
    expect(new URLSearchParams(href.split("?")[1]).getAll("category")).toEqual([
      "Opieka",
      "Samotność",
    ]);
    expect(
      screen.getByRole("link", {
        name: "Opisz podobny problem: Kryzys zdrowia psychicznego",
      }),
    ).toHaveAttribute("href", "/match?category=Zdrowie+psychiczne");
    // Computed from the data: 2 "Opieka" + 1 "Samotność" in the mocks.
    expect(
      screen.getByText(/W bibliotece: 3 innowacje \(Opieka, Samotność\)/),
    ).toBeVisible();
  });

  it("writes filters and the chosen tab to the URL, keeping the rest", async () => {
    const user = userEvent.setup();
    renderBrowser("tab=library&q=seniorzy");

    await user.click(screen.getByRole("checkbox", { name: "Opieka" }));
    expect(window.location.search).toBe(
      "?tab=library&q=seniorzy&category=Opieka",
    );

    await user.click(screen.getByRole("tab", { name: "Materiały" }));
    const params = new URLSearchParams(window.location.search);
    expect(params.get("tab")).toBe("materials");
    expect(params.get("q")).toBe("seniorzy");
    expect(params.getAll("category")).toEqual(["Opieka"]);
  });
});
