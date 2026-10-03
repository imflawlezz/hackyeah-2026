// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  save: vi.fn(),
  send: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/app/(public)/ideas/actions", () => ({ saveIdea: mocks.save }));
vi.mock("@/app/(public)/messages/actions", () => ({
  startConversation: mocks.send,
  loadMessages: vi.fn(async () => ({
    demo: true,
    userId: "demo-resident",
    conversations: [],
    messages: [],
    notifications: [],
  })),
  markRead: vi.fn(),
  sendMessage: mocks.send,
}));
vi.mock("./voice-input-button", () => ({
  VoiceInputButton: ({
    onTranscript,
  }: {
    onTranscript: (text: string) => void;
  }) => (
    <button type="button" onClick={() => onTranscript("Dyktowany tekst")}>
      Wstaw transkrypcję testową
    </button>
  ),
}));
import { IdeaWizard } from "@/components/ideas/idea-wizard";
import { NewMessageForm } from "@/components/messages/new-message-form";
import { MessagesWorkspace } from "@/components/messages/messages-workspace";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("appends through the idea field callback without saving or advancing", () => {
  render(<IdeaWizard call={null} signedIn={false} />);
  const field = screen.getByRole("textbox", {
    name: "Jaki problem chcesz rozwiązać?",
  });
  fireEvent.change(field, { target: { value: "Ręcznie wpisany problem" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Wstaw transkrypcję testową" }),
  );
  expect(field).toHaveValue("Ręcznie wpisany problem\nDyktowany tekst");
  expect(screen.getByText("Krok 1 z 9")).toBeInTheDocument();
  expect(mocks.save).not.toHaveBeenCalled();
});
it("appends to the controlled new message body without sending", () => {
  render(
    <NewMessageForm demo experts={[]} subject="" initialKind="ask_rops" />,
  );
  const field = screen.getByLabelText("Twoja wiadomość");
  fireEvent.change(field, { target: { value: "Wpisana wiadomość" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Wstaw transkrypcję testową" }),
  );
  expect(field).toHaveValue("Wpisana wiadomość\nDyktowany tekst");
  expect(mocks.send).not.toHaveBeenCalled();
  expect(mocks.push).not.toHaveBeenCalled();
});
it("appends to the conversation composer without sending", async () => {
  render(<MessagesWorkspace id="demo-conversation-0" />);
  const field = await screen.findByLabelText("Twoja wiadomość");
  fireEvent.change(field, { target: { value: "Bieżąca wiadomość" } });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Wstaw transkrypcję testową" }),
    ).toBeInTheDocument(),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Wstaw transkrypcję testową" }),
  );
  expect(field).toHaveValue("Bieżąca wiadomość\nDyktowany tekst");
  expect(mocks.send).not.toHaveBeenCalled();
});
