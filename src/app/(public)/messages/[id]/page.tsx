import type { Metadata } from "next";
import { MessagesWorkspace } from "@/components/messages/messages-workspace";

export const metadata: Metadata = {
  title: "Rozmowa · Wiadomości",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <MessagesWorkspace id={(await params).id} />;
}
