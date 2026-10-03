// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/(auth)/login/actions", () => ({ signOut: vi.fn() }));

import { HeaderActions } from "@/components/layout/header-actions";

afterEach(cleanup);

it("shows only the sign-in link when logged out", () => {
  render(<HeaderActions user={null} demo={false} />);

  expect(screen.getByRole("link", { name: "Zaloguj się" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(
    screen.queryByRole("link", { name: "Panel administratora" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Wyloguj" })).toBeNull();
  expect(screen.queryByText("Wersja demonstracyjna")).toBeNull();
});

it("shows the name, role and sign-out for a resident, without the admin link", () => {
  render(
    <HeaderActions
      user={{ displayName: "Anna Przykładowa", role: "resident" }}
      demo={false}
    />,
  );

  expect(screen.getByText("Anna Przykładowa")).toBeInTheDocument();
  expect(screen.getByText("Mieszkaniec lub organizacja")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Wyloguj" })).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Panel administratora" }),
  ).toBeNull();
  expect(screen.queryByRole("link", { name: "Zaloguj się" })).toBeNull();
});

it("shows the admin link to an admin", () => {
  render(
    <HeaderActions
      user={{ displayName: "Administrator ROPS (demo)", role: "admin" }}
      demo={false}
    />,
  );

  expect(screen.getByText("Administrator ROPS")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Panel administratora" }),
  ).toHaveAttribute("href", "/admin");
  expect(screen.getByRole("button", { name: "Wyloguj" })).toBeInTheDocument();
});

it("shows both links and the demo label in demo mode", () => {
  render(<HeaderActions user={null} demo />);

  expect(screen.getByText("Wersja demonstracyjna")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Panel administratora" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Zaloguj się" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Wyloguj" })).toBeNull();
});
