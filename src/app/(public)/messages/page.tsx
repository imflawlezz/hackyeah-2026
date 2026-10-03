import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Wiadomości",
  description:
    "W tej części napiszesz do zespołu Hubu i sprawdzisz odpowiedzi. Ta funkcja jest w przygotowaniu.",
};

export default function MessagesPage() {
  return (
    <PlaceholderPage
      title="Wiadomości"
      description="W tej części napiszesz do zespołu Hubu i sprawdzisz odpowiedzi. Ta funkcja jest w przygotowaniu."
    />
  );
}
