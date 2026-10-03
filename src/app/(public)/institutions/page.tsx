import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Dla instytucji",
};

export default function InstitutionsPage() {
  return (
    <PlaceholderPage
      title="Dla instytucji"
      description="Dostosuj sprawdzoną innowację do potrzeb swojej instytucji."
    />
  );
}
