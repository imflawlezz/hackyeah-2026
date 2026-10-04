// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SkipLink } from "@/components/layout/skip-link";

it("renders a link to the main content", () => {
  render(<SkipLink />);

  const link = screen.getByRole("link", { name: "Przejdź do treści głównej" });
  expect(link).toHaveAttribute("href", "#main");
});
