// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewMessageForm } from "@/components/messages/new-message-form";
import {
  CHALLENGE_DRAFT_KEY,
  CHALLENGE_SUBJECT,
} from "@/lib/match/challenge-draft";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/messages/new",
}));
vi.mock("@/app/(public)/messages/actions", () => ({
  startConversation: vi.fn(),
}));

const DRAFT = "Na drodze powiatowej jest dziura w jezdni";

function renderForm(subject: string, innovationId?: string) {
  render(
    <NewMessageForm
      demo
      experts={[]}
      subject={subject}
      innovationId={innovationId}
      initialKind="ask_rops"
    />,
  );
  return screen.getByRole("textbox", { name: /Twoja wiadomość/ });
}

beforeEach(() => {
  window.sessionStorage.setItem(CHALLENGE_DRAFT_KEY, DRAFT);
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("NewMessageForm", () => {
  it("fills the message with the problem left by /match for a new challenge", () => {
    const body = renderForm(CHALLENGE_SUBJECT);
    expect(body).toHaveValue(DRAFT);
    expect(screen.getByRole("textbox", { name: /Temat/ })).toHaveValue(
      "Nowe wyzwanie",
    );
  });

  it("leaves the message empty for any other subject or context", () => {
    expect(renderForm("Pytanie o termin naboru")).toHaveValue("");
    cleanup();
    expect(renderForm(CHALLENGE_SUBJECT, "inn-1")).toHaveValue("");
  });

  it("starts empty when nothing was left by /match", () => {
    window.sessionStorage.clear();
    expect(renderForm(CHALLENGE_SUBJECT)).toHaveValue("");
  });
});
