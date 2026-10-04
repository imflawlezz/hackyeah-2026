// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
vi.mock("@/app/(auth)/login/demo-actions", () => ({ signInAsDemo: vi.fn() }));
import { DemoAccounts } from "./demo-accounts";
import { signInAsDemo } from "@/app/(auth)/login/demo-actions";
afterEach(cleanup);

it("renders four named form buttons with descriptions when enabled", () => {
  render(<DemoAccounts enabled />);
  expect(screen.getAllByRole("button")).toHaveLength(4);
  for (const label of [
    "Mieszkaniec",
    "Gmina (JST)",
    "Ekspert",
    "Administrator ROPS",
  ]) {
    const button = screen.getByRole("button", { name: label });
    expect(button.closest("form")).not.toBeNull();
    expect(button).toHaveAccessibleDescription();
  }
});
it("hides all demo controls when disabled", () => {
  render(<DemoAccounts enabled={false} />);
  expect(screen.queryByRole("button")).toBeNull();
});

it("shows a pending state and announces a returned error", async () => {
  let finish!: (result: { error: string }) => void;
  vi.mocked(signInAsDemo).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<DemoAccounts enabled />);
  await userEvent.click(screen.getByRole("button", { name: "Mieszkaniec" }));
  expect(
    screen.getByRole("button", { name: "Loguję… Mieszkaniec" }),
  ).toBeDisabled();
  await act(async () => {
    finish({ error: "Logowanie demonstracyjne jest wyłączone." });
  });
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Logowanie demonstracyjne jest wyłączone.",
  );
  expect(screen.getByRole("button", { name: "Mieszkaniec" })).toBeEnabled();
});
it("keeps the server password out of client props and rendered markup", () => {
  const source = readFileSync("src/components/auth/demo-accounts.tsx", "utf8");
  const page = readFileSync("src/app/(auth)/login/page.tsx", "utf8");
  expect(source).not.toMatch(/password|DEMO_USER_PASSWORD/i);
  expect(page).not.toContain("DEMO_USER_PASSWORD");
  const { container } = render(<DemoAccounts enabled />);
  expect(container.innerHTML).not.toMatch(/password|DEMO_USER_PASSWORD/i);
});
