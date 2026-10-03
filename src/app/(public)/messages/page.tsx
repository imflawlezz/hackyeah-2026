import type { Metadata } from "next";
import { MessagesWorkspace } from "@/components/messages/messages-workspace";

export const metadata: Metadata = {
  title: "Wiadomości",
  description: "Rozmowy z zespołem ROPS Kraków, ekspertami i partnerami.",
};

export default function Page() {
  return <MessagesWorkspace />;
}
