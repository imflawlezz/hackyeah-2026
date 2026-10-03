import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Wiadomości",
};

export default function MessagesPage() {
  return (
    <PlaceholderPage
      title="Wiadomości"
      description="Rozmawiaj z zespołem Hubu, mentorami i partnerami."
    />
  );
}
