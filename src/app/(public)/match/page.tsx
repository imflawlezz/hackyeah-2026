import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Dopasuj innowację",
  description: "Opisz problem społeczny, a system wskaże pasujące innowacje.",
};

export default function MatchPage() {
  return (
    <PlaceholderPage
      title="Dopasuj innowację"
      description="Opisz problem społeczny, a system wskaże pasujące innowacje."
    />
  );
}
