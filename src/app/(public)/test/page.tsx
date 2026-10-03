import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Testuj innowacje",
  description:
    "W tej części zgłosisz chęć udziału w testach i opiszesz swoje uwagi. Ta funkcja jest w przygotowaniu.",
};

export default function TestPage() {
  return (
    <PlaceholderPage
      title="Testuj innowacje"
      description="W tej części zgłosisz chęć udziału w testach i opiszesz swoje uwagi. Ta funkcja jest w przygotowaniu."
    />
  );
}
