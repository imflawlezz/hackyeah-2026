import type { Metadata } from "next";
import { NotificationList } from "@/components/notifications/notification-bell";

export const metadata: Metadata = {
  title: "Powiadomienia",
  description:
    "Odpowiedzi na Twoje wiadomości i informacje o Twoich pomysłach.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl text-heading">Powiadomienia</h1>
      <NotificationList />
    </div>
  );
}
