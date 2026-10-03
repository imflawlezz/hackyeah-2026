import { NotificationList } from "@/components/notifications/notification-bell";
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-3xl text-heading">Powiadomienia</h1>
      <NotificationList />
    </main>
  );
}
