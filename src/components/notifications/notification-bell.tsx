"use client";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useNotifications } from "@/lib/notifications/use-notifications";
import { unreadLabel, relativeTime } from "@/lib/messages/format";
import { loginPath } from "@/lib/auth/redirect";

export function NotificationList() {
  const { status, notifications, unread, error, markRead } = useNotifications();

  if (status === "loading") {
    return (
      <p role="status" className="text-base text-muted-foreground">
        Wczytujemy powiadomienia…
      </p>
    );
  }

  if (status === "signed-out") {
    return (
      <div className="space-y-3">
        <p>Zaloguj się, aby zobaczyć swoje powiadomienia.</p>
        <Link
          href={loginPath("/notifications")}
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          Zaloguj się
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status === "demo" && (
        <p className="text-sm">
          Powiadomienia demonstracyjne, zapisane w tej przeglądarce.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {unread > 0 && (
        <button
          type="button"
          className="min-h-11 text-primary underline"
          onClick={() => void markRead()}
        >
          Oznacz wszystkie jako przeczytane
        </button>
      )}
      {notifications.length > 0 ? (
        <ul className="divide-y">
          {notifications.map((n) => (
            <li key={n.id} className="space-y-2 py-4">
              <Link
                onClick={() => void markRead(n.id)}
                className="inline-flex min-h-11 items-center text-primary underline"
                href={n.link}
              >
                {n.title}
              </Link>
              {!n.readAt && <span className="ml-2 font-semibold">Nowe</span>}
              {n.body && <p>{n.body}</p>}
              <time
                dateTime={n.createdAt}
                className="block text-sm text-muted-foreground"
              >
                {relativeTime(n.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        status !== "error" && <p>Nie masz jeszcze powiadomień.</p>
      )}
    </div>
  );
}

export function NotificationBell() {
  const { status, unread } = useNotifications();
  const count = status === "ready" || status === "demo" ? unread : 0;
  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm px-2"
        aria-label={unreadLabel(count)}
      >
        <BellIcon aria-hidden="true" className="size-6" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="rounded-full bg-primary px-2 text-sm font-semibold text-primary-foreground"
          >
            {count}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle>Powiadomienia</SheetTitle>
          <SheetDescription>
            Odpowiedzi i informacje o Twoich pomysłach.
          </SheetDescription>
        </SheetHeader>
        <NotificationList />
        <Link
          className="inline-flex min-h-11 items-center text-primary underline"
          href="/notifications"
        >
          Zobacz wszystkie powiadomienia
        </Link>
      </SheetContent>
    </Sheet>
  );
}
