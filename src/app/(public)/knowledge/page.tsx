import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Baza wiedzy",
  description:
    "W tej części znajdziesz wyzwania Małopolski, przykłady innowacji i materiały do pracy z mieszkańcami. Ta funkcja jest w przygotowaniu.",
};

export default function KnowledgePage() {
  return (
    <PlaceholderPage
      title="Baza wiedzy"
      description="W tej części znajdziesz wyzwania Małopolski, przykłady innowacji i materiały do pracy z mieszkańcami. Ta funkcja jest w przygotowaniu."
    />
  );
}
