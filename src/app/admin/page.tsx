import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Panel administratora",
};

export default function AdminPage() {
  return (
    <PlaceholderPage
      title="Panel administratora"
      description="Weryfikuj zgłoszenia i aktualizuj zasoby wiedzy Hubu."
    />
  );
}
