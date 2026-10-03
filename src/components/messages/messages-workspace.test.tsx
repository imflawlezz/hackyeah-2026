// @vitest-environment jsdom
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MessagesWorkspace } from "./messages-workspace";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getMockStore } from "@/lib/messages/mock-store";
vi.mock("@/app/(public)/messages/actions", () => ({
  loadMessages: vi.fn(async () => ({
    demo: true,
    userId: "demo-resident",
    conversations: [],
    messages: [],
    notifications: [],
  })),
  markRead: vi.fn(),
  sendMessage: vi.fn(),
}));
afterEach(cleanup);
it("announces an incoming message without moving composer focus and updates the bell", async () => {
  render(
    <>
      <MessagesWorkspace id="demo-conversation-0" />
      <NotificationBell />
    </>,
  );
  const composer = await screen.findByLabelText("Twoja wiadomość");
  composer.focus();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Powiadomienia, 2 nieprzeczytane" }),
    ).toBeTruthy(),
  );
  getMockStore().receive({
    id: "new-incoming",
    conversationId: "demo-conversation-0",
    authorId: "demo-admin",
    body: "Odpowiedź zespołu",
    createdAt: new Date().toISOString(),
  });
  await waitFor(() =>
    expect(screen.getByText("Nowa wiadomość od Jan R. (ROPS).")).toBeTruthy(),
  );
  expect(document.activeElement).toBe(composer);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Powiadomienia, 3 nieprzeczytane" }),
    ).toBeTruthy(),
  );
});
