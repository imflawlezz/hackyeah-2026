import type { Conversation, Message, Notification } from "@/types";
export const DEMO_USER = "demo-resident";
export const mockExperts = [
  { id: "demo-expert", displayName: "Anna K.", municipality: "Kraków" },
];
export const mockPartners = [
  { id: "demo-cus", displayName: "CUS w Gminie Przykładowej" },
];
const createdAt = "2026-10-03T08:00:00.000Z";
const subjects = [
  "Opieka wytchnieniowa w powiecie wielickim",
  "Asystenci cyfrowi w gminie",
  "Współpraca NGO z CUS",
];
const bodies = [
  "Gdzie mogę znaleźć wsparcie w opiece nad bliską osobą?",
  "Chcemy przetestować asystenta cyfrowego. Od czego zacząć?",
  "Szukamy CUS do wspólnego pilotażu usług sąsiedzkich.",
];
export const mockConversations: Conversation[] = subjects.map((subject, i) => ({
  id: `demo-conversation-${i}`,
  kind: (["ask_rops", "ask_expert", "partnership"] as const)[i],
  subject,
  createdBy: DEMO_USER,
  createdAt,
  lastMessageAt: createdAt,
  preview: bodies[i],
  unread: i < 2,
  people: [
    {
      id: DEMO_USER,
      displayName: "Marta P.",
      role: i === 1 ? "jst" : "resident",
    },
    {
      id: ["demo-admin", "demo-expert", "demo-cus"][i],
      displayName: ["Jan R. (ROPS)", "Anna K.", "CUS w Gminie Przykładowej"][i],
      role: i === 1 ? "expert" : "admin",
    },
  ],
}));
export const mockMessages: Message[] = bodies.map((body, i) => ({
  id: `demo-message-${i}`,
  conversationId: mockConversations[i].id,
  authorId: mockConversations[i].people[1].id,
  body,
  createdAt,
}));
export const mockNotifications: Notification[] = mockConversations
  .slice(0, 2)
  .map((c, i) => ({
    id: `demo-notification-${i}`,
    userId: DEMO_USER,
    type: "message",
    title: "Nowa wiadomość",
    body: c.subject,
    link: `/messages/${c.id}`,
    createdAt,
  }));
