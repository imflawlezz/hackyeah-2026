import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Logowanie",
  description:
    "Zaloguj się jako mieszkaniec, instytucja, ekspert albo administrator.",
};

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="Logowanie"
      description="Zaloguj się jako mieszkaniec, instytucja, ekspert albo administrator."
    />
  );
}
