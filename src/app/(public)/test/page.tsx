import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Testuj innowacje",
  description:
    "Zgłoś się do testów i przekaż opinię o istniejących rozwiązaniach.",
};

export default function TestPage() {
  return (
    <PlaceholderPage
      title="Testuj innowacje"
      description="Zgłoś się do testów i przekaż opinię o istniejących rozwiązaniach."
    />
  );
}
