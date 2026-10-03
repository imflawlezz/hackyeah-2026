import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Dla instytucji",
  description:
    "W tej części sprawdzisz pomysły dla Twojej gminy, CUS lub OPS. Ta funkcja jest w przygotowaniu.",
};

export default function InstitutionsPage() {
  return (
    <PlaceholderPage
      title="Dla instytucji"
      description="W tej części sprawdzisz pomysły dla Twojej gminy, CUS lub OPS. Ta funkcja jest w przygotowaniu."
    />
  );
}
