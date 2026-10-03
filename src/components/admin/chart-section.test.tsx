// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ChartSection } from "@/components/admin/chart-section";

afterEach(cleanup);

it("toggles a data table with a caption as the chart alternative", async () => {
  const user = userEvent.setup();
  render(
    <ChartSection
      title="Zgłoszenia według kategorii"
      summary="Najwięcej zgłoszeń dotyczyło kategorii Samotność (11)."
      table={{
        caption: "Liczba zgłoszeń w każdej kategorii",
        columns: ["Kategoria", "Zgłoszenia"],
        rows: [
          ["Samotność", 11],
          ["Opieka", 10],
        ],
      }}
    >
      <svg data-testid="chart" />
    </ChartSection>,
  );

  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "Zgłoszenia według kategorii",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Samotność \(11\)/)).toBeInTheDocument();
  expect(screen.getByTestId("chart").parentElement).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(screen.queryByRole("table")).not.toBeInTheDocument();

  const toggle = screen.getByRole("button", { name: "Pokaż dane w tabeli" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  await user.click(toggle);

  const table = screen.getByRole("table", {
    name: "Liczba zgłoszeń w każdej kategorii",
  });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(toggle).toHaveAccessibleName("Ukryj tabelę");
  expect(toggle.getAttribute("aria-controls")).toBe(table.parentElement?.id);
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent),
  ).toEqual(["Kategoria", "Zgłoszenia"]);
  expect(
    within(table).getByRole("rowheader", { name: "Opieka" }),
  ).toBeInTheDocument();

  await user.click(toggle);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

it("shows only the summary when there is no data", () => {
  render(
    <ChartSection
      title="Słowa"
      summary="Za mało zgłoszeń."
      table={{ caption: "Słowa", columns: ["Słowo"], rows: [] }}
    >
      <svg />
    </ChartSection>,
  );
  expect(screen.getByText("Za mało zgłoszeń.")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
