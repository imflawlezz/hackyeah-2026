import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Baza wiedzy",
  description:
    "Przeglądaj wyzwania Małopolski, bibliotekę innowacji i materiały edukacyjne.",
};

export default function KnowledgePage() {
  return (
    <PlaceholderPage
      title="Baza wiedzy"
      description="Przeglądaj wyzwania Małopolski, bibliotekę innowacji i materiały edukacyjne."
    />
  );
}
