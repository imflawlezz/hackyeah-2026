import { MessagesWorkspace } from "@/components/messages/messages-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <MessagesWorkspace id={(await params).id} />;
}
