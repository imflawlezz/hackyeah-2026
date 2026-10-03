import type { Metadata } from "next";
import { IdeaWizard } from "@/components/ideas/idea-wizard";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveGrantCall } from "@/lib/data/grant-calls";

export const metadata: Metadata = {
  title: "Nowy pomysł",
  description: "Uzupełnij kanwę innowacji krok po kroku.",
};

export default async function NewIdeaPage() {
  const [user, call] = await Promise.all([
    getCurrentUser(),
    getActiveGrantCall(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl text-heading">Dodaj pomysł</h1>
      <IdeaWizard call={call} signedIn={Boolean(user)} />
    </div>
  );
}
