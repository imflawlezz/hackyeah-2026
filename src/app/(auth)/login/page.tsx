import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Logowanie",
  description:
    "W tej części zalogujesz się na swoje konto. Logowanie jest w przygotowaniu.",
};

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="Logowanie"
      description="W tej części zalogujesz się na swoje konto. Logowanie jest w przygotowaniu."
    />
  );
}
