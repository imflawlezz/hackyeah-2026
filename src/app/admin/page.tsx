import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Panel administratora",
  description:
    "W tej części sprawdzisz zgłoszenia i uzupełnisz bazę wiedzy Hubu. Panel jest w przygotowaniu.",
};

export default function AdminPage() {
  return (
    <PlaceholderPage
      title="Panel administratora"
      description="W tej części sprawdzisz zgłoszenia i uzupełnisz bazę wiedzy Hubu. Panel jest w przygotowaniu."
    />
  );
}
