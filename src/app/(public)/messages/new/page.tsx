import { NewMessageForm } from "@/components/messages/new-message-form";
import { getCurrentUser } from "@/lib/auth/session";
import { listExperts } from "@/lib/data/messages";
import { getInnovationById } from "@/lib/data/innovations";
import { mockExperts } from "@/lib/mocks/messages";
import { conversationKindSchema } from "@/lib/messages/schemas";
import { createClient } from "@/lib/supabase/server";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ innovation?: string; idea?: string; kind?: string }>;
}) {
  const query = await searchParams;
  const user = await getCurrentUser();
  const innovation = query.innovation
    ? await getInnovationById(query.innovation)
    : null;
  let ideaTitle = "";
  let ideaId: string | undefined;
  if (query.idea && user && /^[0-9a-f-]{36}$/i.test(query.idea)) {
    const client = await createClient();
    const result = await client
      ?.from("ideas")
      .select("id,title")
      .eq("id", query.idea)
      .maybeSingle();
    if (result?.data) {
      ideaTitle = result.data.title;
      ideaId = result.data.id;
    }
  }
  if (!user && query.idea) {
    ideaId = query.idea;
    ideaTitle = "Twój pomysł";
  }
  const kind = conversationKindSchema.safeParse(query.kind);
  return (
    <NewMessageForm
      demo={!user}
      experts={user ? await listExperts() : mockExperts}
      initialKind={kind.success ? kind.data : "ask_rops"}
      innovationId={innovation?.id}
      ideaId={ideaId}
      subject={
        innovation
          ? `Pytanie o: ${innovation.title}`
          : ideaTitle
            ? `Pytanie o: ${ideaTitle}`
            : ""
      }
    />
  );
}
