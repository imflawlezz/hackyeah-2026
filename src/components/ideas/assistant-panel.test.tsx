// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AssistantPanel } from "@/components/ideas/assistant-panel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("renders a Markdown reply as bold text and a list, and the question as plain text", async () => {
  const reply = "**Grupa docelowa**: seniorzy.\n\n- ankieta\n- spotkanie";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(reply, { status: 200 })),
  );
  const user = userEvent.setup();
  render(<AssistantPanel />);

  await user.type(
    screen.getByLabelText(/Twoje pytanie/),
    "Pytanie **bez** formatowania",
  );
  await user.click(screen.getByRole("button", { name: "Wyślij" }));

  const log = screen.getByRole("log");
  await waitFor(() =>
    expect(log.querySelector("strong")).toHaveTextContent("Grupa docelowa"),
  );
  expect(log.querySelectorAll("li")).toHaveLength(2);
  expect(log).toHaveTextContent("Asystent:");
  expect(log).toHaveTextContent("Ty: Pytanie **bez** formatowania");
  expect(log.querySelectorAll("strong")).toHaveLength(1);
});
