import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Kreator pomysłów",
  description: "Zgłoś pomysł na innowację społeczną w krótkiej fiszce.",
};

export default function IdeasPage() {
  return (
    <PlaceholderPage
      title="Kreator pomysłów"
      description="Zgłoś pomysł na innowację społeczną w krótkiej fiszce."
    />
  );
}
