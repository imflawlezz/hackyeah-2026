import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Kreator pomysłów",
  description:
    "W tej części przygotujesz krótką fiszkę pomysłu. Opisz, komu ma pomóc i na czym polega. Ta funkcja jest w przygotowaniu.",
};

export default function IdeasPage() {
  return (
    <PlaceholderPage
      title="Kreator pomysłów"
      description="W tej części przygotujesz krótką fiszkę pomysłu. Opisz, komu ma pomóc i na czym polega. Ta funkcja jest w przygotowaniu."
    />
  );
}
