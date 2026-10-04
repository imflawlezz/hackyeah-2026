// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import NotFound, { metadata } from "@/app/not-found";

const thrown = Object.assign(new Error("secret database detail"), {
  digest: "abc123",
});

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  consoleError.mockRestore();
});

describe("not-found page", () => {
  it("shows the Polish heading, title and links", () => {
    render(<NotFound />);

    expect(metadata.title).toBe("Nie znaleziono strony");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Nie znaleźliśmy tej strony",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Adres może być nieaktualny lub zawierać błąd."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Przejdź do strony głównej" }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "Znajdź rozwiązania" }),
    ).toHaveAttribute("href", "/match");
    expect(screen.getByRole("link", { name: "Baza wiedzy" })).toHaveAttribute(
      "href",
      "/knowledge",
    );
  });
});

describe("error page", () => {
  it("focuses the heading and hides error details", () => {
    render(<ErrorPage error={thrown} retry={vi.fn()} />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Coś poszło nie tak",
    });
    expect(heading).toHaveFocus();
    expect(
      screen.getByText(
        "Spróbuj ponownie. Jeśli błąd się powtórzy, wróć do strony głównej.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Przejdź do strony głównej" }),
    ).toHaveAttribute("href", "/");
    expect(document.body).not.toHaveTextContent("secret database detail");
    expect(consoleError).toHaveBeenCalledWith("Unexpected error", "abc123");
  });

  it("calls retry when the user tries again", async () => {
    const retry = vi.fn();
    render(<ErrorPage error={thrown} retry={retry} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Spróbuj ponownie" }),
    );

    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe("global error page", () => {
  it("renders its own Polish document without error details", () => {
    const html = renderToStaticMarkup(
      <GlobalError error={thrown} retry={vi.fn()} />,
    );

    expect(html).toContain('<html lang="pl">');
    expect(html).toContain("<title>Coś poszło nie tak · HubMI.pl</title>");
    expect(html).toContain("Coś poszło nie tak");
    expect(html).toContain('href="/"');
    expect(html).not.toContain("secret database detail");
  });

  it("calls retry when the user tries again", async () => {
    const retry = vi.fn();
    // Rendered into a div: jsdom cannot mount a second <html> document.
    render(<GlobalError error={thrown} retry={retry} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Spróbuj ponownie" }),
    );

    expect(retry).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith("Unexpected error", "abc123");
  });
});
