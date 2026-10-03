// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_TEXT,
  InnovationLibrary,
} from "@/components/knowledge/innovation-library";
import { EMPTY_FILTERS, type LibraryFilters } from "@/lib/knowledge/url";
import { innovations } from "@/lib/mocks";

function Harness({
  initial = EMPTY_FILTERS,
  onChange,
}: {
  initial?: LibraryFilters;
  onChange?: (filters: LibraryFilters) => void;
}) {
  const [filters, setFilters] = useState(initial);
  return (
    <InnovationLibrary
      innovations={innovations}
      filters={filters}
      onChange={(next) => {
        onChange?.(next);
        setFilters(next);
      }}
    />
  );
}

afterEach(cleanup);

describe("InnovationLibrary", () => {
  it("lists every innovation with a details link named after it", () => {
    render(<Harness />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleziono 10 innowacji",
    );
    expect(screen.getAllByRole("article")).toHaveLength(innovations.length);
    const link = screen.getByRole("link", {
      name: "Zobacz szczegóły: Teleopieka sąsiedzka",
    });
    expect(link).toHaveAttribute("href", "/knowledge/inn-telecare");
  });

  it("updates the count region after a search without diacritics", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByLabelText("Szukaj w bibliotece"), "swietlica");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Znaleziono 1 innowację",
      ),
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Świetlica otwarta po lekcjach" }),
    ).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({
      q: "swietlica",
      categories: [],
      group: "",
    });
  });

  it("combines the search with category and target group filters", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ ...EMPTY_FILTERS, q: "seniorzy" }} />);

    expect(screen.getByLabelText("Szukaj w bibliotece")).toHaveValue(
      "seniorzy",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleziono 4 innowacje",
    );

    await user.click(screen.getByRole("checkbox", { name: "Opieka" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleziono 2 innowacje",
    );

    await user.selectOptions(
      screen.getByLabelText("Grupa docelowa"),
      "Opiekunowie osób zależnych",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleziono 1 innowację",
    );
  });

  it("shows the empty state and resets with the clear button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initial={{ q: "seniorzy", categories: ["Młodzież"], group: "" }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleziono 0 innowacji",
    );
    expect(screen.getByText(EMPTY_TEXT)).toBeVisible();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Wyczyść filtry" }));

    expect(onChange).toHaveBeenLastCalledWith(EMPTY_FILTERS);
    expect(screen.getByLabelText("Szukaj w bibliotece")).toHaveValue("");
    expect(
      screen.getByRole("checkbox", { name: "Młodzież" }),
    ).not.toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleziono 10 innowacji",
    );
  });

  it("follows filters that change from outside", () => {
    const { rerender } = render(
      <InnovationLibrary
        innovations={innovations}
        filters={{ ...EMPTY_FILTERS, q: "telefon" }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Szukaj w bibliotece")).toHaveValue("telefon");

    rerender(
      <InnovationLibrary
        innovations={innovations}
        filters={{ ...EMPTY_FILTERS, categories: ["Samotność"] }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Szukaj w bibliotece")).toHaveValue("");
    expect(screen.getByRole("checkbox", { name: "Samotność" })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Znaleziono 1 innowację",
    );
  });
});
